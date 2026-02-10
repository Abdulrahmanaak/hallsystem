import { auth } from '@/lib/auth'
import { supabaseAdmin, STORAGE_BUCKET } from '@/lib/supabase'
import { NextResponse } from 'next/server'

import { enforceSubscription } from '@/lib/subscription'

export async function POST(req: Request) {
    try {
        const session = await auth()
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check Subscription
        const subscriptionError = await enforceSubscription(session.user.id)
        if (subscriptionError) return subscriptionError

        const formData = await req.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
        }

        // Validate file type (images and PDFs)
        // Safari on iOS may send empty MIME type for HEIC/HEIF photos — fall back to extension check
        const allowedMimeTypes = ['application/pdf', 'image/heic', 'image/heif']
        const ext = file.name.split('.').pop()?.toLowerCase() || ''
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif', 'pdf', 'svg', 'bmp']

        const isMimeValid = file.type.startsWith('image/') || allowedMimeTypes.includes(file.type)
        const isExtensionValid = allowedExtensions.includes(ext)

        if (!isMimeValid && !(file.type === '' && isExtensionValid)) {
            return NextResponse.json({ error: 'Only image and PDF files are allowed' }, { status: 400 })
        }

        // 10MB limit
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size too large (max 10MB)' }, { status: 400 })
        }

        const buffer = Buffer.from(await file.arrayBuffer())
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `expenses/${session.user.id}/${fileName}`

        const { data, error } = await supabaseAdmin
            .storage
            .from(STORAGE_BUCKET)
            .upload(filePath, buffer, {
                contentType: file.type,
                upsert: false
            })

        if (error) {
            console.error('Supabase upload error:', error)
            return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
        }

        // Get public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath)

        return NextResponse.json({ url: publicUrl })

    } catch (error) {
        console.error('Error uploading file:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
