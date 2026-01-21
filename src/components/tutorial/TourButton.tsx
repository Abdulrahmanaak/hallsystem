'use client'

import { HelpCircle, RotateCcw } from 'lucide-react'
import { useTour } from './TourProvider'
import type { StepOptions } from 'shepherd.js'

interface TourButtonProps {
    tourId: string
    steps: StepOptions[]
    label?: string
    showReset?: boolean
}

export default function TourButton({
    tourId,
    steps,
    label = 'بدء الجولة التعريفية',
    showReset = false
}: TourButtonProps) {
    const { startTour, isTourComplete, resetTours, activeTour } = useTour()

    const handleStart = () => {
        if (!activeTour) {
            startTour(tourId, steps)
        }
    }

    const isComplete = isTourComplete(tourId)

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleStart}
                disabled={!!activeTour}
                className={`
          tour-start-button
          ${isComplete ? 'opacity-80' : ''}
          ${activeTour ? 'opacity-50 cursor-not-allowed' : ''}
        `}
                title={isComplete ? 'أكملت هذه الجولة مسبقاً' : label}
            >
                <HelpCircle />
                <span>{label}</span>
                {!isComplete && (
                    <span className="flex items-center justify-center w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
                )}
            </button>

            {showReset && isComplete && (
                <button
                    onClick={resetTours}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="إعادة تعيين جميع الجولات"
                >
                    <RotateCcw size={18} />
                </button>
            )}
        </div>
    )
}
