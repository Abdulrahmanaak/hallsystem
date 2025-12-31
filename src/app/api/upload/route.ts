import { NextResponse } from 'next/server'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import { auth } from '@/lib/auth'

export async function POST(request: Request) {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
        return NextResponse.json(
            { error: 'غير مصرح - يجب تسجيل الدخول' },
            { status: 401 }
        )
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File | null
        const folder = formData.get('folder') as string || 'logos'

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'نوع الملف غير مسموح. الأنواع المسموحة: JPG, PNG, WebP, SVG' },
                { status: 400 }
            )
        }

        // Validate file size (max 2MB)
        const maxSize = 2 * 1024 * 1024
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'حجم الملف كبير جداً. الحد الأقصى 2 ميجابايت' },
                { status: 400 }
            )
        }

        // Generate unique filename
        const fileExt = file.name.split('.').pop()
        const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Upload to Supabase Storage
        const { data, error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json(
                { error: 'فشل رفع الملف: ' + error.message },
                { status: 500 }
            )
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path)

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: data.path
        })

    } catch (error) {
        console.error('Upload error:', error)
        return NextResponse.json(
            { error: 'حدث خطأ أثناء رفع الملف' },
            { status: 500 }
        )
    }
}
