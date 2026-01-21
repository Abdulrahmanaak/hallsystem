'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import Shepherd from 'shepherd.js'
import type { Tour, StepOptions } from 'shepherd.js'

// Tour completion state
interface TourState {
    [tourId: string]: boolean
}

// Tour context interface
interface TourContextType {
    isFirstVisit: boolean
    completedTours: TourState
    activeTour: Tour | null
    startTour: (tourId: string, steps: StepOptions[]) => void
    endTour: () => void
    markTourComplete: (tourId: string) => void
    resetTours: () => void
    isTourComplete: (tourId: string) => boolean
}

const TourContext = createContext<TourContextType | null>(null)

const STORAGE_KEY = 'hallsystem_tour_state'

export function TourProvider({ children }: { children: ReactNode }) {
    const [completedTours, setCompletedTours] = useState<TourState>({})
    const [isFirstVisit, setIsFirstVisit] = useState(false)
    const [activeTour, setActiveTour] = useState<Tour | null>(null)

    // Load state from localStorage on mount and check for auto-start tour
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
            try {
                const parsed = JSON.parse(stored)
                setCompletedTours(parsed.completedTours || {})
                setIsFirstVisit(false)
            } catch {
                setIsFirstVisit(true)
            }
        } else {
            setIsFirstVisit(true)
        }

        // Check for startTour query param
        const params = new URLSearchParams(window.location.search)
        const tourToStart = params.get('startTour')
        if (tourToStart) {
            // Import tours dynamically (or use a registry if available in context scope)
            // Since we can't easily dynamic import here without async complexity, 
            // we rely on the component usage or event based trigger.
            // Better approach: Expose a 'pendingTour' state or similar.
            // Actually, TourProvider doesn't know about tour definitions (steps) directly.
            // But we can emit a custom event or use a global registry.
            // Simpler: Dispatch a custom event that consumers can listen to, or let HelpMenu handle it?
            // HelpMenu is always rendered. It can read the param.
            // Let's modify HelpMenu instead to read the param on mount.
        }
    }, [])

    // Save state to localStorage
    const saveState = useCallback((tours: TourState) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            completedTours: tours,
            lastVisit: new Date().toISOString()
        }))
    }, [])

    // Start a tour
    const startTour = useCallback((tourId: string, steps: StepOptions[]) => {
        // End any active tour first
        if (activeTour) {
            activeTour.cancel()
        }

        const tour = new Shepherd.Tour({
            useModalOverlay: true,
            defaultStepOptions: {
                cancelIcon: {
                    enabled: true
                },
                scrollTo: { behavior: 'smooth', block: 'center' },
                classes: 'shepherd-theme-custom'
            }
        })

        // Add steps with progress indicator
        steps.forEach((step, index) => {
            tour.addStep({
                ...step,
                id: `${tourId}-step-${index}`,
                text: `
          <div class="shepherd-step-content">
            ${step.text}
            <div class="shepherd-progress">
              ${steps.map((_, i) => `
                <div class="shepherd-progress-dot ${i <= index ? 'active' : ''}"></div>
              `).join('')}
            </div>
          </div>
        `,
                buttons: [
                    ...(index > 0 ? [{
                        text: 'السابق',
                        action: tour.back,
                        classes: 'shepherd-button shepherd-button-secondary'
                    }] : []),
                    ...(index < steps.length - 1 ? [{
                        text: 'التالي',
                        action: tour.next,
                        classes: 'shepherd-button shepherd-button-primary'
                    }] : [{
                        text: 'إنهاء',
                        action: () => {
                            tour.complete()
                        },
                        classes: 'shepherd-button shepherd-button-primary'
                    }])
                ]
            })
        })

        // Handle tour completion
        tour.on('complete', () => {
            markTourComplete(tourId)
            setActiveTour(null)
        })

        tour.on('cancel', () => {
            setActiveTour(null)
        })

        setActiveTour(tour)
        tour.start()
    }, [activeTour])

    // End current tour
    const endTour = useCallback(() => {
        if (activeTour) {
            activeTour.cancel()
            setActiveTour(null)
        }
    }, [activeTour])

    // Mark tour as complete
    const markTourComplete = useCallback((tourId: string) => {
        setCompletedTours(prev => {
            const updated = { ...prev, [tourId]: true }
            saveState(updated)
            return updated
        })
        setIsFirstVisit(false)
    }, [saveState])

    // Reset all tours
    const resetTours = useCallback(() => {
        setCompletedTours({})
        setIsFirstVisit(true)
        localStorage.removeItem(STORAGE_KEY)
    }, [])

    // Check if tour is complete
    const isTourComplete = useCallback((tourId: string) => {
        return !!completedTours[tourId]
    }, [completedTours])

    return (
        <TourContext.Provider
            value={{
                isFirstVisit,
                completedTours,
                activeTour,
                startTour,
                endTour,
                markTourComplete,
                resetTours,
                isTourComplete
            }}
        >
            {children}
        </TourContext.Provider>
    )
}

export function useTour() {
    const context = useContext(TourContext)
    if (!context) {
        throw new Error('useTour must be used within a TourProvider')
    }
    return context
}
