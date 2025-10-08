import { type TextareaHTMLAttributes, forwardRef } from "react"

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = "", ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-600 focus:outline-none ${className}`}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
