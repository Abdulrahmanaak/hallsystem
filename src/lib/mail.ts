import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
})

export async function sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${token}`

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"Hall Management System" <no-reply@hallsystem.com>',
            to: email,
            subject: 'إعادة تعيين كلمة المرور',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>طلب إعادة تعيين كلمة المرور</h2>
                    <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
                    <p>اضغط على الزر أدناه لإعادة تعيين كلمة المرور:</p>
                    <a href="${resetUrl}" style="
                        background-color: #4F46E5;
                        color: white;
                        padding: 12px 24px;
                        text-decoration: none;
                        border-radius: 4px;
                        display: inline-block;
                        margin: 20px 0;
                    ">إعادة تعيين كلمة المرور</a>
                    <p>إذا لم تقم بطلب هذا التغيير، يمكنك تجاهل هذا البريد الإلكتروني.</p>
                    <hr />
                    <p style="color: #666; font-size: 12px;">هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('Error sending email:', error)
        return { success: false, error }
    }
}

interface NotificationEmailInput {
    to: string
    title: string
    message: string
    link?: string
}

export async function sendNotificationEmail(input: NotificationEmailInput) {
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '')
    const fullLink = input.link ? `${appUrl}${input.link.startsWith('/') ? '' : '/'}${input.link}` : appUrl

    console.log(`[EMAIL_SENDING] To: ${input.to}, Subject: ${input.title}`)

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"نظام إدارة القاعات" <no-reply@hallsystem.com>',
            to: input.to,
            subject: input.title,
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #4F46E5, #7C3AED); padding: 20px; border-radius: 8px 8px 0 0;">
                        <h2 style="color: white; margin: 0;">نظام إدارة القاعات</h2>
                    </div>
                    <div style="background: #ffffff; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
                        <h3 style="color: #1f2937; margin-top: 0;">${input.title}</h3>
                        <p style="color: #4b5563; line-height: 1.6;">${input.message}</p>
                        <a href="${fullLink}" style="
                            background-color: #4F46E5;
                            color: white;
                            padding: 12px 24px;
                            text-decoration: none;
                            border-radius: 6px;
                            display: inline-block;
                            margin: 16px 0;
                            font-weight: bold;
                        ">عرض التفاصيل</a>
                    </div>
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 16px;">
                        هذا البريد مرسل تلقائياً من نظام إدارة القاعات
                    </p>
                </div>
            `
        })
        return { success: true }
    } catch (error) {
        console.error('[NOTIFICATION_EMAIL_ERROR]', error)
        return { success: false, error }
    }
}
