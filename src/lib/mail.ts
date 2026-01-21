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
