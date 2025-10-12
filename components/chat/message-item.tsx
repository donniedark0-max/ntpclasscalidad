"use client"

type Message = {
  id: string
  senderUid: string
  text?: string
  fileUrl?: string
  createdAt: any
}

type User = {
  uid: string
  displayName?: string
  photoURL?: string
}

type MessageItemProps = {
  message: Message
  isOwn: boolean
  sender?: User
}

function formatDate(date: any) {
  if (!date) return ""
  // If comes as Firestore Timestamp
  if (typeof date === "object" && date.seconds) {
    const d = new Date(date.seconds * 1000)
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
  // If comes as string or Date
  const d = new Date(date)
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

export default function MessageItem({ message, isOwn, sender }: MessageItemProps) {
  return (
    <div className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div className={`rounded-lg px-4 py-2 max-w-xs ${isOwn ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}>
        {sender && !isOwn && (
          <div className="mb-1 text-xs font-semibold text-blue-800">{sender.displayName}</div>
        )}
        {message.text && <div>{message.text}</div>}
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block mt-1 text-blue-200 underline"
          >
            Archivo adjunto
          </a>
        )}
        <div className="text-[10px] text-right text-gray-400 mt-1">
          {formatDate(message.createdAt)}
        </div>
      </div>
    </div>
  )
}