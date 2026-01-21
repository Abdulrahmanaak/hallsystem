
interface PrintableInvoiceData {
    invoiceNumber: string
    issueDate: string
    dueDate?: string

    // Customer Info
    customerName: string
    customerPhone: string
    customerIdNumber?: string

    // Booking Info
    bookingNumber: string
    hallName: string
    eventDate: string | Date

    // Financials
    subtotal: number
    vatAmount: number
    totalAmount: number
    paidAmount: number
    remainingAmount: number

    // Items for the table (optional, defaults to single item "Booking Payment")
    items?: {
        name: string
        quantity: number
        price: number
        total: number
        tax: number
        net: number
    }[]
}

// Generate ZATCA TLV QR Code Data
const generateTLV = (tag: number, value: string): number[] => {
    const encoder = new TextEncoder()
    const valueBytes = encoder.encode(value)
    return [tag, valueBytes.length, ...valueBytes]
}

export const printInvoice = async (data: PrintableInvoiceData) => {
    // Fetch company settings
    let settings = {
        companyNameAr: 'نظام إدارة القاعات',
        companyLogo: '' as string | null,
        vatRegNo: '',
        companyAddress: '',
        companyAddressLine2: ''
    }

    try {
        const settingsRes = await fetch('/api/settings')
        if (settingsRes.ok) {
            settings = await settingsRes.json()
        }
    } catch (e) {
        console.warn('Could not fetch settings for invoice')
    }

    // Format dates
    const safeDate = (date: string | Date | undefined): Date => {
        if (!date) return new Date()
        const d = new Date(date)
        return isNaN(d.getTime()) ? new Date() : d
    }

    const eventDateObj = safeDate(data.eventDate)
    const issueDateObj = safeDate(data.issueDate)

    const eventHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
    }).format(eventDateObj)
    const eventGregorian = eventDateObj.toLocaleDateString('en-GB')

    const issueDateHijri = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
        day: 'numeric', month: 'numeric', year: 'numeric'
    }).format(issueDateObj)
    const issueDateGregorian = issueDateObj.toLocaleDateString('en-GB')

    const printTimestamp = new Date().toLocaleString('en-GB')

    // ZATCA Required Fields for QR
    const sellerName = settings.companyNameAr || 'نظام إدارة القاعات'
    const vatRegNumber = settings.vatRegNo || ''
    const invoiceTimestamp = issueDateObj.toISOString()
    const invoiceTotal = data.totalAmount.toFixed(2)
    const vatTotal = data.vatAmount.toFixed(2)

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

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>فاتورة ${data.invoiceNumber}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif; 
                    padding: 20px; 
                    direction: rtl;
                    font-size: 12px;
                    line-height: 1.4;
                    color: #333;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 2px solid #2563eb;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                /* Header */
                .header {
                    background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
                    color: white;
                    padding: 15px 20px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .header-right { text-align: right; }
                .header-center { text-align: center; flex: 1; }
                .header-left { text-align: left; }
                .company-name { font-size: 18px; font-weight: 700; margin-bottom: 4px; }
                .invoice-type { 
                    background: rgba(255,255,255,0.2);
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 14px;
                    display: inline-block;
                }
                .invoice-number { font-size: 16px; font-weight: 700; }
                .tax-number { font-size: 10px; opacity: 0.9; margin-top: 4px; }
                .hall-name { 
                    background: #fbbf24;
                    color: #1e40af;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-weight: 600;
                    margin-top: 8px;
                    display: inline-block;
                }
                
                /* Customer & Contract Info */
                .info-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1px;
                    background: #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                }
                .info-box {
                    background: white;
                    padding: 12px;
                }
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 6px;
                }
                .info-row:last-child { margin-bottom: 0; }
                .info-label { color: #6b7280; }
                .info-value { font-weight: 600; color: #1f2937; }
                
                /* Services Table */
                .services-section {
                    padding: 15px;
                    border-bottom: 1px solid #e5e7eb;
                }
                .services-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 10px;
                }
                .services-table th {
                    background: #1e40af;
                    color: white;
                    padding: 8px 6px;
                    font-size: 10px;
                    font-weight: 600;
                    text-align: center;
                }
                .services-table td {
                    padding: 8px 6px;
                    text-align: center;
                    border-bottom: 1px solid #e5e7eb;
                    font-size: 11px;
                }
                .services-table tr:nth-child(even) { background: #f9fafb; }
                
                /* Financial Summary */
                .summary-section {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: 1px;
                    background: #e5e7eb;
                    border-bottom: 1px solid #e5e7eb;
                }
                .summary-box {
                    background: white;
                    padding: 12px;
                }
                .summary-title {
                    background: #fbbf24;
                    color: #1e40af;
                    padding: 6px;
                    text-align: center;
                    font-weight: 700;
                    font-size: 11px;
                    margin: -12px -12px 10px -12px;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                    font-size: 10px;
                }
                .summary-total {
                    background: #dbeafe;
                    padding: 6px;
                    border-radius: 4px;
                    margin-top: 8px;
                }
                .summary-total .summary-row {
                    font-weight: 700;
                    color: #1e40af;
                    margin: 0;
                }
                .summary-remaining {
                    background: #fef3c7;
                    border: 2px solid #f59e0b;
                }
                .summary-remaining .summary-row {
                    color: #b45309;
                }
                
                /* Footer */
                .footer {
                    background: #f3f4f6;
                    padding: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .footer-address {
                    text-align: center;
                    flex: 1;
                    font-size: 10px;
                    color: #6b7280;
                }
                .print-time {
                    text-align: left;
                    font-size: 9px;
                    color: #9ca3af;
                }
                
                @media print { 
                    body { padding: 10px; }
                    .invoice-container { border: 1px solid #2563eb; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <!-- Header -->
                <div class="header">
                    <div class="header-right">
                        <div class="invoice-number">رقم الفاتورة: ${data.invoiceNumber.split('-').pop()}</div>
                        <div class="tax-number">الرقم الضريبي: ${settings.vatRegNo || 'غير محدد'}</div>
                    </div>
                    <div class="header-center">
                        <div class="company-name">${settings.companyNameAr}</div>
                        <div class="invoice-type">فاتورة ضريبية مبسطة</div>
                        <div class="hall-name">${data.hallName}</div>
                    </div>
                    <div class="header-left">
                        ${settings.companyLogo ? `<img src="${settings.companyLogo}" alt="Logo" style="max-width: 80px; max-height: 60px; object-fit: contain;" />` : `<div style="font-size: 10px;">Invoice No: ${data.invoiceNumber.split('-').pop()}</div>`}
                    </div>
                </div>
                
                <!-- Customer & Contract Info -->
                <div class="info-section">
                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">اسم العميل:</span>
                            <span class="info-value">${data.customerName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">رقم الجوال:</span>
                            <span class="info-value" dir="ltr">${data.customerPhone}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">رقم الهوية:</span>
                            <span class="info-value">${data.customerIdNumber || '-'}</span>
                        </div>
                    </div>
                    <div class="info-box">
                        <div class="info-row">
                            <span class="info-label">رقم العقد:</span>
                            <span class="info-value">${data.bookingNumber}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ الفاتورة:</span>
                            <span class="info-value">${issueDateHijri} | ${issueDateGregorian}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">تاريخ الحفل:</span>
                            <span class="info-value">${eventHijri} | ${eventGregorian}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Services Table -->
                <div class="services-section">
                    <table class="services-table">
                        <thead>
                            <tr>
                                <th>م</th>
                                <th>التاريخ</th>
                                <th>اسم الخدمة</th>
                                <th>الكمية</th>
                                <th>السعر</th>
                                <th>الإجمالي</th>
                                <th>الضريبة</th>
                                <th>الصافي</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>${issueDateGregorian}</td>
                                <td>دفعة حجز - ${data.bookingNumber}</td>
                                <td>1</td>
                                <td>${(data.totalAmount - data.vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td>${(data.totalAmount - data.vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td>${data.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td>${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <!-- Financial Summary -->
                <div class="summary-section">
                    <div class="summary-box">
                        <div class="summary-title">حساب إيجار القاعة</div>
                        <div class="summary-row">
                            <span>إيجار القاعة:</span>
                            <span>${(data.totalAmount - data.vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="summary-row">
                            <span>خصم:</span>
                            <span>0.00</span>
                        </div>
                        <div class="summary-row">
                            <span>الضريبة:</span>
                            <span>${data.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="summary-total">
                            <div class="summary-row">
                                <span>الصافي:</span>
                                <span>${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-box">
                        <div class="summary-title">حساب الخدمات</div>
                        <div class="summary-row">
                            <span>قيمة الخدمات:</span>
                            <span>0.00</span>
                        </div>
                        <div class="summary-row">
                            <span>خصم:</span>
                            <span>0.00</span>
                        </div>
                        <div class="summary-row">
                            <span>الضريبة:</span>
                            <span>0.00</span>
                        </div>
                        <div class="summary-total">
                            <div class="summary-row">
                                <span>الصافي:</span>
                                <span>0.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-box">
                        <div class="summary-title">الحساب النهائي</div>
                        <div class="summary-row">
                            <span>إجمالي الفاتورة:</span>
                            <span>${(data.totalAmount - data.vatAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="summary-row">
                            <span>إجمالي الضريبة:</span>
                            <span>${data.vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="summary-row">
                            <span>صافي الفاتورة:</span>
                            <span>${data.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div class="summary-total summary-remaining">
                            <div class="summary-row">
                                <span>إجمالي المدفوع:</span>
                                <span>${data.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Footer -->
                <div class="footer">
                    <div id="qr-container" style="width: 100px; text-align: center;">
                        <div id="qr-code"></div>
                        <p style="font-size: 8px; color: #666; margin-top: 4px;">ZATCA QR</p>
                    </div>
                    <div class="footer-address">
                        <p>${settings.companyAddress || ''}</p>
                        <p>${settings.companyAddressLine2 || ''}</p>
                    </div>
                    <div class="print-time">
                        تاريخ الطباعة<br/>${printTimestamp}
                    </div>
                </div>
            </div>
            
            <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
            <script>
                window.onload = function() {
                    try {
                        const qrData = '${base64QRData}';
                        const qrContainer = document.getElementById('qr-code');
                        new QRCode(qrContainer, {
                            text: qrData,
                            width: 90,
                            height: 90,
                            colorDark: '#000000',
                            colorLight: '#ffffff',
                            correctLevel: QRCode.CorrectLevel.M
                        });
                        setTimeout(function() { window.print(); }, 800);
                    } catch(e) {
                        console.error('QR Error:', e);
                        setTimeout(function() { window.print(); }, 500);
                    }
                };
            </script>
        </body>
        </html>
    `)
    printWindow.document.close()
}
