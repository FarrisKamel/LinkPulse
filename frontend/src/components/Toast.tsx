import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react'

type ToastKind = 'success' | 'error'

interface Toast {
  id: number
  message: string
  kind: ToastKind
}

interface ToastContextValue {
  notify: (message: string, kind?: ToastKind) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = nextId++
    setToasts((prev) => [...prev, { id, message, kind }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              'animate-fade-in rounded-lg px-4 py-2 text-sm text-white shadow-lg',
              toast.kind === 'error' ? 'bg-red-600' : 'bg-slate-900',
            ].join(' ')}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Returns a no-op notifier when no provider is present (e.g. in unit tests),
// so components can call useToast() without wrapping every test.
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? { notify: () => {} }
}
