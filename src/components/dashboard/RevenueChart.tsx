'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface RevenueChartProps {
    data: {
        name: string
        revenue: number
        expenses: number
    }[]
}

export default function RevenueChart({ data }: RevenueChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                لا توجد بيانات متاحة
            </div>
        )
    }

    return (
        <div className="h-80 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={data}
                    margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        tickFormatter={(value) => `${value / 1000}k`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        cursor={{ fill: '#f3f4f6' }}
                        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                        formatter={(value: any) => [
                            new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(Number(value || 0)),
                            'الإيرادات'
                        ]}
                    />
                    <Bar
                        dataKey="revenue"
                        fill="#0ea5e9" // primary-500 equivalent usually
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}
