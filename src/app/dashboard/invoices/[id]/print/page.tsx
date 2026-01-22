"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowRight, Printer, AlertCircle } from "lucide-react"
import Link from "next/link"

// Company settings interface
interface CompanySettings {
    companyNameAr: string
    companyLogo: string | null
    vatRegNo: string | null
    companyAddress: string | null
    companyAddressLine2: string | null
}

// Invoice data interface
interface InvoiceData {
    id: string
    invoiceNumber: string
    issueDate: string
    dueDate?: string
    subtotal: number
    vatAmount: number
    totalAmount: number
    paidAmount: number
    status: string
    booking: {
        id: string
        bookingNumber: string
        eventDate: string
        hall: {
            name: string
        }
    }
    customer: {
        name: string
        phone: string
        idNumber?: string
    }
    payments: {
        id: string
        amount: number
        paymentDate: string
    }[]
}

// Generate ZATCA TLV QR Code Data
const generateTLV = (tag: number, value: string): number[] => {
    const encoder = new TextEncoder()
    const valueBytes = encoder.encode(value)
    return [tag, valueBytes.length, ...valueBytes]
}

// Helper: Safe date parser
const safeDate = (date: string | Date | undefined): Date => {
    if (!date) return new Date()
    const d = new Date(date)
    return isNaN(d.getTime()) ? new Date() : d
}

export default function InvoicePrintPage() {
    const params = useParams()
    const router = useRouter()
    const invoiceId = params.id as string

    const [invoice, setInvoice] = useState<InvoiceData | null>(null)
    const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)

    const DEFAULT_COMPANY_SETTINGS: CompanySettings = {
        companyNameAr: 'نظام إدارة القاعات',
        companyLogo: null,
        vatRegNo: null,
        companyAddress: null,
        companyAddressLine2: null
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch invoice
                const invoiceRes = await fetch(`/api/invoices/${invoiceId}`)
                if (!invoiceRes.ok) {
                    throw new Error('Failed to fetch invoice')
                }
                const invoiceData = await invoiceRes.json()

                if (!invoiceData || invoiceData.isDeleted) {
                    setError('الفاتورة غير موجودة')
                    return
                }

                setInvoice(invoiceData)

                // Fetch settings with fallback
                let settings = DEFAULT_COMPANY_SETTINGS
                try {
                    const settingsRes = await fetch('/api/settings')
                    if (settingsRes.ok) {
                        settings = await settingsRes.json()
                        localStorage.setItem('settings_cache', JSON.stringify(settings))
                    } else {
                        throw new Error('Settings API failed')
                    }
                } catch {
                    console.warn('Failed to fetch settings, using fallback/cache')
                    const cached = localStorage.getItem('settings_cache')
                    if (cached) {
                        settings = JSON.parse(cached)
                    }
                }

                setCompanySettings(settings)

                // Generate QR code after data is loaded
                generateQRCode(invoiceData, settings)

            } catch (err) {
                console.error(err)
                setError('حدث خطأ في تحميل البيانات')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [invoiceId])

    const generateQRCode = async (invoiceData: InvoiceData, settings: CompanySettings) => {
        try {
            // ZATCA Required Fields for QR
            const sellerName = settings.companyNameAr || 'نظام إدارة القاعات'
            const vatRegNumber = settings.vatRegNo || ''
            const invoiceTimestamp = safeDate(invoiceData.issueDate).toISOString()
            // Convert to numbers in case API returns strings (Decimal type serialization)
            const invoiceTotal = Number(invoiceData.totalAmount).toFixed(2)
            const vatTotal = Number(invoiceData.vatAmount).toFixed(2)


            // Build TLV data
            const tlvData: number[] = [
                ...generateTLV(1, sellerName),       // Tag 1: Seller Name
                ...generateTLV(2, vatRegNumber),     // Tag 2: VAT Registration Number
                ...generateTLV(3, invoiceTimestamp), // Tag 3: Invoice Timestamp
                ...generateTLV(4, invoiceTotal),     // Tag 4: Invoice Total
                ...generateTLV(5, vatTotal)          // Tag 5: VAT Total
            ]

            // Convert to Base64
            const base64QRData = btoa(String.fromCharCode(...tlvData))

            // Dynamically import QRCode library
            const QRCode = (await import('qrcode')).default
            const dataUrl = await QRCode.toDataURL(base64QRData, {
                width: 90,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#ffffff'
                }
            })
            setQrDataUrl(dataUrl)
        } catch (e) {
            console.error('QR Error:', e)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="p-6 flex items-center justify-center min-h-screen">
                <div className="text-lg text-slate-500">جاري تحميل الفاتورة...</div>
            </div>
        )
    }

    if (error || !invoice || !companySettings) {
        return (
            <div className="p-6 flex flex-col items-center justify-center min-h-screen gap-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
                <div className="text-lg text-red-600">{error || 'الفاتورة غير موجودة'}</div>
                <Link href="/dashboard/finance">
                    <Button variant="outline">العودة للفواتير</Button>
                </Link>
            </div>
        )
    }

    // Format dates
    const eventDateObj = safeDate(invoice.booking.eventDate)
    const issueDateObj = safeDate(invoice.issueDate)

    const eventHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
    }).format(eventDateObj)
    const eventGregorian = eventDateObj.toLocaleDateString('en-GB')

    const issueDateHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
    }).format(issueDateObj)
    const issueDateGregorian = issueDateObj.toLocaleDateString('en-GB')

    const printTimestamp = new Date().toLocaleString('en-GB')

    // Prepare Invoice Calculations (Handling Legacy Data)
    // If VAT is 0 but Total > 0, we derive VAT from Total (assuming Total is inclusive)
    let displaySubtotal = Number(invoice.subtotal)
    let displayVatAmount = Number(invoice.vatAmount)
    let displayTotal = Number(invoice.totalAmount)

    // Legacy fix: If VAT is approximately 0 and we have a total, calculate it based on 15%
    if (displayVatAmount <= 0.1 && displayTotal > 0) {
        const vatRate = 0.15
        displaySubtotal = displayTotal / (1 + vatRate)
        displayVatAmount = displayTotal - displaySubtotal
    }

    const remainingAmount = displayTotal - invoice.paidAmount

    return (
        <>
            {/* Print Styles */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .invoice-print-page, .invoice-print-page * {
                        visibility: visible;
                    }
                    .invoice-print-page {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        padding: 10px;
                    }
                    .no-print {
                        display: none !important;
                    }
                    @page {
                        size: A4;
                        margin: 10mm;
                    }
                }
            `}</style>

            {/* Navigation Bar - Hidden on Print */}
            <div className="no-print p-4 bg-white border-b sticky top-0 z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/finance">
                        <Button variant="ghost" size="icon">
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </Link>
                    <h1 className="text-xl font-bold">طباعة فاتورة</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        onClick={handlePrint}
                        className="gap-2 bg-blue-700 text-white hover:bg-blue-800"
                    >
                        <Printer className="h-4 w-4 text-white" />
                        طباعة
                    </Button>
                </div>
            </div>

            {/* Invoice Content */}
            <div className="invoice-print-page max-w-[800px] mx-auto p-5 bg-white" dir="rtl" style={{ fontFamily: "'Cairo', 'Segoe UI', Tahoma, sans-serif", fontSize: '12px', lineHeight: 1.4, color: '#333' }}>
                <div style={{ border: '2px solid #2563eb', borderRadius: '8px', overflow: 'hidden' }}>

                    {/* Header */}
                    <div style={{ background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700 }}>رقم الفاتورة: {invoice.invoiceNumber.split('-').pop()}</div>
                            <div style={{ fontSize: '10px', opacity: 0.9, marginTop: '4px' }}>الرقم الضريبي: {companySettings.vatRegNo || 'غير محدد'}</div>
                        </div>
                        <div style={{ textAlign: 'center', flex: 1 }}>
                            <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>{companySettings.companyNameAr}</div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '4px', fontSize: '14px', display: 'inline-block' }}>فاتورة ضريبية مبسطة</div>
                            <div style={{ background: '#fbbf24', color: '#1e40af', padding: '4px 12px', borderRadius: '4px', fontWeight: 600, marginTop: '8px', display: 'inline-block' }}>{invoice.booking.hall.name}</div>
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            {companySettings.companyLogo ? (
                                <img src={companySettings.companyLogo} alt="Logo" style={{ maxWidth: '80px', maxHeight: '60px', objectFit: 'contain' }} />
                            ) : (
                                <div style={{ fontSize: '10px' }}>Invoice No: {invoice.invoiceNumber.split('-').pop()}</div>
                            )}
                        </div>
                    </div>

                    {/* Customer & Contract Info */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ background: 'white', padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: '#6b7280' }}>اسم العميل:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{invoice.customer.name}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: '#6b7280' }}>رقم الجوال:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }} dir="ltr">{invoice.customer.phone}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>رقم الهوية:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{invoice.customer.idNumber || '-'}</span>
                            </div>
                        </div>
                        <div style={{ background: 'white', padding: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: '#6b7280' }}>رقم العقد:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{invoice.booking.bookingNumber}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                                <span style={{ color: '#6b7280' }}>تاريخ الفاتورة:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{issueDateHijri} | {issueDateGregorian}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6b7280' }}>تاريخ الحفل:</span>
                                <span style={{ fontWeight: 600, color: '#1f2937' }}>{eventHijri} | {eventGregorian}</span>
                            </div>
                        </div>
                    </div>

                    {/* Services Table */}
                    <div style={{ padding: '15px', borderBottom: '1px solid #e5e7eb' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                            <thead>
                                <tr>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>م</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>التاريخ</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>اسم الخدمة</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>الكمية</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>السعر</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>الإجمالي</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>الضريبة</th>
                                    <th style={{ background: '#1e40af', color: 'white', padding: '8px 6px', fontSize: '10px', fontWeight: 600, textAlign: 'center' }}>الصافي</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>1</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>{issueDateGregorian}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>دفعة حجز - {invoice.booking.bookingNumber}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>1</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>{displaySubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>{displaySubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>{displayVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #e5e7eb', fontSize: '11px' }}>{displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Financial Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: '#e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
                        <div style={{ background: 'white', padding: '12px' }}>
                            <div style={{ background: '#fbbf24', color: '#1e40af', padding: '6px', textAlign: 'center', fontWeight: 700, fontSize: '11px', margin: '-12px -12px 10px -12px' }}>حساب إيجار القاعة</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>إيجار القاعة:</span>
                                <span>{displaySubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>خصم:</span>
                                <span>0.00</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>الضريبة:</span>
                                <span>{displayVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ background: '#dbeafe', padding: '6px', borderRadius: '4px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e40af', fontSize: '10px' }}>
                                    <span>الصافي:</span>
                                    <span>{displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '12px' }}>
                            <div style={{ background: '#fbbf24', color: '#1e40af', padding: '6px', textAlign: 'center', fontWeight: 700, fontSize: '11px', margin: '-12px -12px 10px -12px' }}>حساب الخدمات</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>قيمة الخدمات:</span>
                                <span>0.00</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>خصم:</span>
                                <span>0.00</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>الضريبة:</span>
                                <span>0.00</span>
                            </div>
                            <div style={{ background: '#dbeafe', padding: '6px', borderRadius: '4px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#1e40af', fontSize: '10px' }}>
                                    <span>الصافي:</span>
                                    <span>0.00</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: 'white', padding: '12px' }}>
                            <div style={{ background: '#fbbf24', color: '#1e40af', padding: '6px', textAlign: 'center', fontWeight: 700, fontSize: '11px', margin: '-12px -12px 10px -12px' }}>الحساب النهائي</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>إجمالي الفاتورة:</span>
                                <span>{displaySubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>إجمالي الضريبة:</span>
                                <span>{displayVatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                                <span>صافي الفاتورة:</span>
                                <span>{displayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', padding: '6px', borderRadius: '4px', marginTop: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#b45309', fontSize: '10px' }}>
                                    <span>إجمالي المدفوع:</span>
                                    <span>{invoice.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div style={{ background: '#f3f4f6', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ width: '100px', textAlign: 'center' }}>
                            {qrDataUrl ? (
                                <div>
                                    <img src={qrDataUrl} alt="ZATCA QR" style={{ width: '90px', height: '90px' }} />
                                    <p style={{ fontSize: '8px', color: '#666', marginTop: '4px' }}>ZATCA QR</p>
                                </div>
                            ) : (
                                <div style={{ width: '90px', height: '90px', border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#999' }}>
                                    جاري التحميل...
                                </div>
                            )}
                        </div>
                        <div style={{ textAlign: 'center', flex: 1, fontSize: '10px', color: '#6b7280' }}>
                            <p>{companySettings.companyAddress || ''}</p>
                            <p>{companySettings.companyAddressLine2 || ''}</p>
                        </div>
                        <div style={{ textAlign: 'left', fontSize: '9px', color: '#9ca3af' }}>
                            تاريخ الطباعة<br />{printTimestamp}
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
