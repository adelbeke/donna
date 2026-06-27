import {X} from "lucide-react";
import {type PropsWithChildren, useEffect} from "react";
import {createPortal} from "react-dom";

interface Props extends PropsWithChildren {
    isOpen: boolean
    title: string
    onClose: () => void
}

export function Modal({children, isOpen, title, onClose}: Props) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [isOpen])

    if (!isOpen) return null

    // ponytail: portal escapes any ancestor with transform/filter that would break fixed positioning
    return createPortal(
        <>
            <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
            <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
                <div className="pointer-events-auto w-xl max-h-[80vh] overflow-y-auto rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-lg p-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</p>
                        <button
                            onClick={onClose}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none rounded"
                            aria-label="Close settings"
                        >
                            <X size={16} />
                        </button>
                    </div>
                    {children}
                </div>
            </div>
        </>,
        document.body
    )
}