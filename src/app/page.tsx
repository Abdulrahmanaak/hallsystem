import { redirect } from 'next/navigation'

export default function HomePage() {
    // Redirect to the public landing page
    redirect('/landing')
}
