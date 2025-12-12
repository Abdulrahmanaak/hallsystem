"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { bookingService } from "@/lib/services/booking"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function NewBookingPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        date: "",
        startTime: "",
        endTime: "",
        hallId: "hall-1",
        totalAmount: 0,
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await bookingService.createBooking({
                ...formData,
                status: "TENTATIVE",
            })
            router.push("/dashboard/bookings")
        } catch (error) {
            console.error("Failed to create booking", error)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: name === "totalAmount" ? parseFloat(value) : value,
        }))
    }

    return (
        <div className="p-8 space-y-8 max-w-3xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/bookings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">New Booking</h2>
            </div>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Booking Details</CardTitle>
                        <CardDescription>Enter the details for the new event.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="customerName">Customer Name</Label>
                                <Input
                                    id="customerName"
                                    name="customerName"
                                    required
                                    value={formData.customerName}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="customerPhone">Phone Number</Label>
                                <Input
                                    id="customerPhone"
                                    name="customerPhone"
                                    required
                                    value={formData.customerPhone}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="customerEmail">Email</Label>
                            <Input
                                id="customerEmail"
                                name="customerEmail"
                                type="email"
                                required
                                value={formData.customerEmail}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date">Date</Label>
                                <Input
                                    id="date"
                                    name="date"
                                    type="date"
                                    required
                                    value={formData.date}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="startTime">Start Time</Label>
                                <Input
                                    id="startTime"
                                    name="startTime"
                                    type="time"
                                    required
                                    value={formData.startTime}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="endTime">End Time</Label>
                                <Input
                                    id="endTime"
                                    name="endTime"
                                    type="time"
                                    required
                                    value={formData.endTime}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="hallId">Hall</Label>
                                <select
                                    id="hallId"
                                    name="hallId"
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={formData.hallId}
                                    onChange={handleChange}
                                >
                                    <option value="hall-1">Grand Ballroom</option>
                                    <option value="hall-2">Garden Hall</option>
                                    <option value="hall-3">Conference Room</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="totalAmount">Total Amount ($)</Label>
                                <Input
                                    id="totalAmount"
                                    name="totalAmount"
                                    type="number"
                                    min="0"
                                    required
                                    value={formData.totalAmount}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="animate-spin mr-2">⏳</span> Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" /> Create Booking
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    )
}
