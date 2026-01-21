// shepherd.js type declarations
declare module 'shepherd.js' {
    export interface StepOptions {
        id?: string
        title?: string
        text?: string
        attachTo?: {
            element?: string | HTMLElement
            on?: string
        }
        buttons?: Array<{
            text?: string
            action?: (this: Tour) => void
            classes?: string
            secondary?: boolean
        }>
        classes?: string
        cancelIcon?: {
            enabled?: boolean
        }
        scrollTo?: boolean | ScrollIntoViewOptions
        advanceOn?: {
            selector?: string
            event?: string
        }
        beforeShowPromise?: () => Promise<void>
        showOn?: () => boolean
        when?: {
            show?: () => void
            hide?: () => void
        }
    }

    export interface TourOptions {
        defaultStepOptions?: StepOptions
        useModalOverlay?: boolean
        exitOnEsc?: boolean
        keyboardNavigation?: boolean
        tourName?: string
        confirmCancel?: boolean
        confirmCancelMessage?: string
    }

    export class Tour {
        constructor(options?: TourOptions)
        addStep(options: StepOptions): void
        start(): void
        next(): void
        back(): void
        cancel(): void
        complete(): void
        hide(): void
        show(stepId?: string): void
        getCurrentStep(): Step | null
        on(event: string, handler: (this: Tour) => void): void
        off(event: string, handler?: (this: Tour) => void): void
        once(event: string, handler: (this: Tour) => void): void
    }

    export class Step {
        constructor(tour: Tour, options: StepOptions)
        show(): void
        hide(): void
        cancel(): void
        complete(): void
        scrollTo(): void
        isOpen(): boolean
        destroy(): void
        el: HTMLElement | null
        tour: Tour
        options: StepOptions
    }

    const Shepherd: {
        Tour: typeof Tour
        Step: typeof Step
    }

    export default Shepherd
}
