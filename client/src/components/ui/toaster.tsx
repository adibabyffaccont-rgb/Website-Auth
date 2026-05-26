import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, duration, ...props }) {
        // Select icon based on variant
        const Icon = variant === "destructive" 
          ? XCircle 
          : variant === "success" 
          ? CheckCircle 
          : variant === "warning" 
          ? AlertTriangle 
          : Info;

        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 mt-0.5">
                <Icon className={`h-6 w-6 ${
                  variant === "destructive" 
                    ? "text-red-600 dark:text-red-400" 
                    : variant === "success" 
                    ? "text-green-600 dark:text-green-400" 
                    : variant === "warning" 
                    ? "text-yellow-600 dark:text-yellow-400" 
                    : "text-blue-600 dark:text-blue-400"
                }`} />
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
