"use client"

import { useState } from "react"
import { Paperclip, Send } from "lucide-react"

type MessageInputProps = {
  onSend: (message: string, file?: File | null) => Promise<void>
  disabled?: boolean
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [sending, setSending] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!message.trim() && !file) || sending || disabled) return
    setSending(true)
    try {
      await onSend(message.trim(), file)
      setMessage("")
      setFile(null)
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t p-3 bg-white">
      <label className="cursor-pointer">
        <Paperclip className="h-5 w-5 text-gray-500" />
        <input
          type="file"
          className="hidden"
          onChange={handleFileChange}
          disabled={sending || disabled}
        />
      </label>
      {file && (
        <span className="text-xs text-gray-600 truncate max-w-[120px]">{file.name}</span>
      )}
      <input
        type="text"
        className="flex-1 rounded border px-3 py-2 text-sm"
        placeholder="Escribe un mensaje..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        disabled={sending || disabled}
      />
      <button
        type="submit"
        className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
        disabled={sending || (!message.trim() && !file) || disabled}
      >
        <Send className="h-5 w-5" />
      </button>
    </form>
  )
}