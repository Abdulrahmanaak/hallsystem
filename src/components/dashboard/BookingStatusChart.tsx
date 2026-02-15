'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface BookingStatusChartProps {
    data: {
        name: string
        value: number
        color: string
    }[]
}



export default function BookingStatusChart({ data }: BookingStatusChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center text-gray-400">
                لا توجد بيانات متاحة
            </div>
        )
    }

    return (
        <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-sm font-medium ml-2 mr-2">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    )
}
