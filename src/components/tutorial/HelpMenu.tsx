'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, ChevronDown, ChevronUp, RotateCcw, BookOpen } from 'lucide-react'
import { useTour } from './TourProvider'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    TOUR_METADATA,
    dashboardTourSteps,
    bookingsTourSteps,
    calendarTourSteps,
    hallsTourSteps,
    financeTourSteps,
    expensesTourSteps,
    usersTourSteps,
    settingsTourSteps
} from './tours'
import type { StepOptions } from 'shepherd.js'

// Map tour IDs to their steps
const TOUR_STEPS: Record<string, StepOptions[]> = {
    'dashboard-tour': dashboardTourSteps,
    'bookings-tour': bookingsTourSteps,
    'calendar-tour': calendarTourSteps,
    'halls-tour': hallsTourSteps,
    'finance-tour': financeTourSteps,
    'expenses-tour': expensesTourSteps,
    'users-tour': usersTourSteps,
    'settings-tour': settingsTourSteps
}

interface HelpMenuProps {
    currentPath: string
}

export default function HelpMenu({ currentPath }: HelpMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { startTour, isTourComplete, resetTours, activeTour } = useTour()

    // Find current page tour
    const getCurrentTourId = () => {
        const sortedTours = Object.entries(TOUR_METADATA).sort(([, a], [, b]) =>
            b.path.length - a.path.length
        )

        for (const [tourId, meta] of sortedTours) {
            if (currentPath === meta.path || currentPath.startsWith(meta.path + '/')) {
                return tourId
            }
        }
        return 'dashboard-tour'
    }

    const currentTourId = getCurrentTourId()
    const currentTourMeta = TOUR_METADATA[currentTourId as keyof typeof TOUR_METADATA]
    const hasUncompletedTours = Object.keys(TOUR_METADATA).some(id => !isTourComplete(id))

    // Check for auto-start param
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const tourToStart = params.get('startTour')
        if (tourToStart && TOUR_STEPS[tourToStart] && !activeTour) {
            // Wait a bit for page to be ready
            setTimeout(() => {
                startTour(tourToStart, TOUR_STEPS[tourToStart])
                // Clear param
                const newUrl = window.location.pathname
                window.history.replaceState({}, '', newUrl)
            }, 500)
        }
    }, [activeTour, startTour])

    const handleStartTour = (tourId: string) => {
        const meta = TOUR_METADATA[tourId as keyof typeof TOUR_METADATA]
        if (!meta) return

        // If not on target page, navigate there
        if (currentPath !== meta.path) {
            window.location.href = `${meta.path}?startTour=${tourId}`
            return
        }

        if (!activeTour && TOUR_STEPS[tourId]) {
            startTour(tourId, TOUR_STEPS[tourId])
            setIsOpen(false)
        }
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <button
                    className={`
            flex items-center gap-2 w-full px-3 py-2 rounded-lg
            text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]
            transition-colors outline-none
            ${hasUncompletedTours ? 'help-menu-item' : 'help-menu-item completed'}
          `}
                >
                    <HelpCircle size={20} />
                    <span>مساعدة</span>
                    {isOpen ? <ChevronUp size={16} className="mr-auto" /> : <ChevronDown size={16} className="mr-auto" />}
                </button>
            </PopoverTrigger>

            <PopoverContent
                side="top"
                align="start"
                className="w-64 p-0 bg-[var(--bg-primary)] border-[var(--border-color)] shadow-xl mb-1"
                sideOffset={10}
            >
                <div className="p-2 border-b border-[var(--border-color)] bg-[var(--bg-secondary)] rounded-t-lg">
                    <p className="text-sm font-medium text-[var(--text-primary)]">الجولات التعريفية</p>
                </div>

                {/* Current Page Tour */}
                <div className="p-2 border-b border-[var(--border-color)]">
                    <button
                        onClick={() => handleStartTour(currentTourId)}
                        disabled={!!activeTour}
                        className={`
              flex items-center gap-2 w-full px-3 py-2 rounded-lg
              bg-[var(--primary-50)] text-[var(--primary-700)]
              hover:bg-[var(--primary-100)] transition-colors
              ${activeTour ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                    >
                        <BookOpen size={18} />
                        <span>جولة الصفحة الحالية</span>
                        {!isTourComplete(currentTourId) && (
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse mr-auto" />
                        )}
                    </button>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 px-3">
                        {currentTourMeta?.name}
                    </p>
                </div>

                {/* All Tours List */}
                <div className="max-h-48 overflow-y-auto p-2">
                    {Object.entries(TOUR_METADATA).map(([tourId, meta]) => (
                        <button
                            key={tourId}
                            onClick={() => handleStartTour(tourId)}
                            disabled={!!activeTour}
                            className={`
                flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm
                text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]
                transition-colors
                ${activeTour ? 'opacity-50 cursor-not-allowed' : ''}
              `}
                        >
                            <span className={`w-2 h-2 rounded-full ${isTourComplete(tourId) ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <span>{meta.name}</span>
                        </button>
                    ))}
                </div>

                {/* Reset Button */}
                <div className="p-2 border-t border-[var(--border-color)]">
                    <button
                        onClick={() => {
                            resetTours()
                            setIsOpen(false)
                        }}
                        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <RotateCcw size={16} />
                        <span>إعادة تعيين الجولات</span>
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    )
}
