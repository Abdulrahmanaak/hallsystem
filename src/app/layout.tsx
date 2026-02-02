import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: {
        default: 'نظام إدارة القاعات | Hall Management System',
        template: '%s | نظام إدارة القاعات'
    },
    description: 'نظام سحابي متكامل لإدارة القاعات، الحجوزات، والمالية بسهولة تامة.',
    keywords: ['إدارة قاعات', 'حجوزات مناسبات', 'نظام مالي', 'فاتورة ضريبية', 'قاعات أفراح'],
    authors: [{ name: 'Hall System Team' }],
    creator: 'Hall System Team',
    publisher: 'Hall System Team',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        locale: 'ar_SA',
        url: 'https://hallsystem.sa',
        siteName: 'نظام إدارة القاعات',
        title: 'نظام إدارة القاعات | الحل الأمثل لإدارة مناسباتك',
        description: 'أدِر حجوزاتك وفواتيرك الضريبية ومصروفاتك في مكان واحد.',
        images: [
            {
                url: '/images/hero_dashboard_v2.png',
                width: 1200,
                height: 630,
                alt: 'نظام إدارة القاعات Dashboard',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'نظام إدارة القاعات | Hall Management System',
        description: 'نظام سحابي متكامل لإدارة القاعات والحجوزات والمالية.',
        images: ['/images/hero_dashboard_v2.png'],
        creator: '@hallsystem',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    icons: {
        icon: '/images/logo.png',
        shortcut: '/images/logo.png',
        apple: '/images/logo.png',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>{children}</body>
        </html>
    )
}
