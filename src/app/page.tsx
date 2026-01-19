import { redirect } from 'next/navigation'

export default function HomePage() {
    // Redirect to the dashboard (middleware will handle auth check)
    redirect('/dashboard')
}
