import { type InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className = "", ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-600 focus:outline-none ${className}`}
      {...props}
    />
  )
})

Input.displayName = "Input"

export { Input }
