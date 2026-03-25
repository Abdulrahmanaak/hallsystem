import { NextResponse } from 'next/server'

/**
 * Return a safe error response that never leaks internal details to the client.
 * Full error is logged server-side for debugging.
 */
export function safeErrorResponse(
    error: unknown,
    publicMessage: string = 'حدث خطأ غير متوقع',
    status: number = 500,
    context?: string
) {
    // Log full error server-side
    if (context) {
        console.error(`[${context}]`, error)
    } else {
        console.error(error)
    }

    return NextResponse.json(
        { error: publicMessage },
        { status }
    )
}

/**
 * Handle Prisma-specific errors with user-friendly messages.
 */
export function handlePrismaError(error: unknown, context?: string): NextResponse {
    const errCode = (error as { code?: string })?.code

    let message = 'حدث خطأ في قاعدة البيانات'

    if (errCode === 'P2002') {
        const meta = (error as { meta?: { target?: string[] } })?.meta
        const field = meta?.target?.[0]
        if (field === 'username') message = 'اسم المستخدم موجود مسبقاً'
        else if (field === 'email') message = 'البريد الإلكتروني مسجل مسبقاً'
        else message = 'البيانات موجودة مسبقاً'
        return safeErrorResponse(error, message, 409, context)
    }

    if (errCode === 'P2003') {
        return safeErrorResponse(error, 'خطأ في البيانات المرتبطة', 400, context)
    }

    return safeErrorResponse(error, message, 500, context)
}
