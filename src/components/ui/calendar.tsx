"use client"

import * as React from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CalendarMode = 'gregorian' | 'hijri';

interface CalendarProps {
    mode?: CalendarMode;
    selected?: Date;
    onSelect?: (date: Date) => void;
    className?: string;
    disabled?: (date: Date) => boolean;
}

// Helpers for Hijri (Umm Al-Qura) - ARABIC LOCALE
const hijriFormatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
});

const getHijriParts = (date: Date) => {
    const parts = hijriFormatter.formatToParts(date);
    const day = parts.find(p => p.type === 'day')?.value;
    const month = parts.find(p => p.type === 'month')?.value;
    const year = parts.find(p => p.type === 'year')?.value;
    return { day, month, year };
}

export function Calendar({ mode = 'gregorian', selected, onSelect, className, disabled }: CalendarProps) {
    // Determine view date (month/year to display)
    const [viewDate, setViewDate] = React.useState(selected || new Date());

    // Update view if selected changes externally
    React.useEffect(() => {
        if (selected) setViewDate(selected);
    }, [selected]);

    const handlePrevMonth = () => {
        const newDate = new Date(viewDate);
        if (mode === 'gregorian') {
            newDate.setMonth(newDate.getMonth() - 1);
        } else {
            newDate.setDate(newDate.getDate() - 29); // Rough jump back
        }
        setViewDate(newDate);
    }

    const handleNextMonth = () => {
        const newDate = new Date(viewDate);
        if (mode === 'gregorian') {
            newDate.setMonth(newDate.getMonth() + 1);
        } else {
            newDate.setDate(newDate.getDate() + 30); // Rough jump fwd
        }
        setViewDate(newDate);
    }

    const handleToday = () => {
        const today = new Date();
        setViewDate(today);
        if (onSelect) onSelect(today);
    }

    // Grid Generation logic
    const renderHeader = () => {
        if (mode === 'gregorian') {
            return viewDate.toLocaleString('ar-SA-u-ca-gregory', { month: 'long', year: 'numeric' });
        } else {
            const h = getHijriParts(viewDate);
            return `${h.month} ${h.year}`;
        }
    }

    const renderDays = () => {
        const daysAr = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
        return (
            <div className="flex mb-2" dir="rtl">
                {daysAr.map(day => (
                    <div key={day} className="w-9 text-center text-xs text-muted-foreground font-medium">{day}</div>
                ))}
            </div>
        )
    }

    const renderCells = () => {
        const rows = [];
        const days = [];

        let startOfMonth = new Date(viewDate);

        if (mode === 'gregorian') {
            startOfMonth.setDate(1);
        } else {
            const currentParts = getHijriParts(startOfMonth);
            const temp = new Date(viewDate);
            // Search backwards for the 1st of the Hijri month
            let guard = 0;
            while (guard < 35) {
                temp.setDate(temp.getDate() - 1);
                const p = getHijriParts(temp);
                if (p.month !== currentParts.month) {
                    temp.setDate(temp.getDate() + 1);
                    startOfMonth = temp;
                    break;
                }
                guard++;
            }
        }

        const startDayOfWeek = startOfMonth.getDay(); // 0 = Sun

        // PADDING
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(<div key={`empty-${i}`} className="w-9 h-9" />);
        }

        // DAYS
        const currentIter = new Date(startOfMonth);
        const currentMonthIdentifier = mode === 'gregorian' ? currentIter.getMonth() : getHijriParts(currentIter).month;

        while (true) {
            const dateToClick = new Date(currentIter);
            const isSelected = selected &&
                dateToClick.getDate() === selected.getDate() &&
                dateToClick.getMonth() === selected.getMonth() &&
                dateToClick.getFullYear() === selected.getFullYear();

            const isToday = new Date().toDateString() === dateToClick.toDateString();

            let dayNum: string | number = dateToClick.getDate();
            if (mode === 'hijri') {
                // Force Arabic numerals
                const d = getHijriParts(dateToClick).day || '0';
                // Map to Arabic numerals if needed, but 'ar-SA' usually handles it. 
                // If default parser returns Western Arabic (0-9), we can force Eastern Arabic if desired.
                // For now relying on Locale output which usually respects number system.
                dayNum = d;
            }

            days.push(
                <div key={dateToClick.toISOString()} className="w-9 h-9 flex items-center justify-center p-0 relative">
                    <Button
                        variant={isSelected ? "default" : "ghost"}
                        className={cn(
                            "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                            isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                            isToday && !isSelected && "bg-accent text-accent-foreground"
                        )}
                        onClick={() => onSelect && onSelect(dateToClick)}
                        disabled={disabled ? disabled(dateToClick) : false}
                    >
                        {typeof dayNum === 'number' ? dayNum.toLocaleString('ar-SA') : dayNum}
                    </Button>
                </div>
            );

            currentIter.setDate(currentIter.getDate() + 1);

            const nextMonthIdentifier = mode === 'gregorian' ? currentIter.getMonth() : getHijriParts(currentIter).month;
            if (nextMonthIdentifier !== currentMonthIdentifier) {
                break;
            }
        }

        let cellsInRow: React.ReactNode[] = [];
        days.forEach((day, i) => {
            cellsInRow.push(day);
            if ((i + 1) % 7 === 0) {
                rows.push(<div key={`row-${i}`} className="flex w-full mt-2 justify-end" dir="rtl">{cellsInRow}</div>);
                cellsInRow = [];
            }
        });
        if (cellsInRow.length > 0) {
            // Fill remaining cells to align right in RTL
            const remaining = 7 - cellsInRow.length;
            for (let k = 0; k < remaining; k++) {
                cellsInRow.push(<div key={`empty-end-${k}`} className="w-9 h-9" />);
            }
            rows.push(<div key={`row-last`} className="flex w-full mt-2 justify-end" dir="rtl">{cellsInRow}</div>);
        }

        return <div className="space-y-1">{rows}</div>;
    }

    return (
        <div className={cn("p-3 bg-white rounded-md shadow-sm border", className)} dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between pt-1 relative items-center mb-4">
                <div className="flex items-center space-x-1 space-x-reverse">
                    <Button variant="outline" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" onClick={handlePrevMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100" onClick={handleNextMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                </div>
                <div className="text-sm font-bold">
                    {renderHeader()}
                </div>
            </div>

            {/* Content */}
            <div className="mt-2">
                {renderDays()}
                {renderCells()}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t mt-4">
                <Button variant="ghost" className="text-xs h-8 px-2 text-muted-foreground" onClick={() => (onSelect && onSelect(undefined as unknown as Date))}>مسح</Button>
                <Button variant="ghost" className="text-xs h-8 px-2 text-primary" onClick={handleToday}>اليوم</Button>
            </div>
        </div>
    )
}
