import React from 'react'
import { notFound } from 'next/navigation'
import type { Metadata, ResolvingMetadata } from 'next'
import { prisma } from '@/lib/prisma'
import { PublicBookingForm } from './PublicBookingForm'
import { Building2, Users, MapPin, DollarSign } from 'lucide-react'

// Define the type for Hall fetched from DB to pass to Client Component
export type PublicHall = {
    id: string;
    name: string;
    capacity: number;
    basePrice: number;
    hourlyRate: number | null;
    amenities: string | null;
    location: string | null;
    description: string | null;
}

interface PageProps {
    params: { slug: string }
}

// Dynamically generate Open Graph Metadata based on the slug
export async function generateMetadata(
    { params }: { params: Promise<{ slug: string }> },
    parent: ResolvingMetadata
): Promise<Metadata> {
    const slug = (await params).slug

    const settings = await prisma.settings.findUnique({
        where: { slug }
    })

    if (!settings) {
        return { title: 'صفحة الحجز غير موجودة | نظام القاعات' }
    }

    // Use custom SEO fields from Settings or fallback to defaults
    const title = settings.ogTitle || `الحجز الإلكتروني - ${settings.companyNameAr}`
    const description = settings.ogDescription || `احجز مناسبتك القادمة لدى ${settings.companyNameAr} عبر نظام القاعات.`
    // Fallback to companyLogo if ogImage is missing
    const images = settings.ogImage ? [settings.ogImage] : (settings.companyLogo ? [settings.companyLogo] : [])

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            // Only add images if exist to avoid breaking OG spec
            ...(images.length > 0 && { images }),
            type: 'website',
            locale: 'ar_SA',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(images.length > 0 && { images }),
        }
    }
}

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params

    // Fetch settings by slug
    const settings = await prisma.settings.findUnique({
        where: { slug }
    })

    if (!settings) {
        notFound() // Return 404 if slug doesn't match any settings
    }

    // Fetch all active halls for this owner
    const halls = await prisma.hall.findMany({
        where: {
            ownerId: settings.ownerId,
            status: 'ACTIVE',
            isDeleted: false
        },
        orderBy: { basePrice: 'asc' } // Sort by price or name as desired
    })

    if (halls.length === 0) {
        // Technically this owner has a link but no active halls right now
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold text-slate-800">لا توجد قاعات متاحة للحجز حالياً</h1>
                <p className="text-slate-500 mt-2">يرجى المحاولة لاحقاً أو التواصل مع الإدارة.</p>
            </div>
        )
    }

    // Map to public type for client component safety (stripping sensitive config)
    const publicHallsData: PublicHall[] = halls.map(hall => ({
        id: hall.id,
        name: hall.nameAr,
        capacity: hall.capacity,
        basePrice: Number(hall.basePrice),
        hourlyRate: hall.hourlyRate ? Number(hall.hourlyRate) : null,
        amenities: hall.amenities,
        location: hall.location,
        description: hall.description
    }))

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8" dir="rtl">
            <div className="max-w-4xl mx-auto">
                {/* Header Section */}
                <div className="text-center mb-10">
                    {settings.companyLogo && (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img src={settings.companyLogo} alt={settings.companyNameAr} className="h-24 w-auto mx-auto mb-6 object-contain" />
                    )}
                    <h1 className="text-4xl font-extrabold text-[var(--primary-700)] mb-4">
                        الحجز الإلكتروني - {settings.companyNameAr}
                    </h1>
                </div>

                {/* Main Content Grid */}
                {/* Form Component - Takes up full width now as hall info is integrated or handled differently */}
                <div className="md:col-span-3">
                    <div className="bg-white rounded-2xl shadow-xl shadow-[var(--primary-100)] border border-[var(--primary-100)] overflow-hidden">
                        <div className="bg-[var(--primary-600)] px-6 py-4">
                            <h2 className="text-xl font-bold text-white">طلب حجز جديد</h2>
                            <p className="text-[var(--primary-100)] text-sm mt-1">يرجى اختيار القاعة وإدخال تفاصيل المناسبة سنتواصل معك لتأكيد الحجز.</p>
                        </div>
                        <div className="p-6">
                            <PublicBookingForm halls={publicHallsData} companyName={settings.companyNameAr} />
                        </div>
                    </div>
                </div>
            </div>
        </main>
    )
}
