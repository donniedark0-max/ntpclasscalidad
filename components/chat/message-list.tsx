"use client"

import MessageItem from "./message-item"

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

type MessageListProps = {
  messages: Message[]
  currentUser: User | null
  usersById?: Record<string, User>
}

export default function MessageList({ messages, currentUser, usersById }: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          message={msg}
          isOwn={msg.senderUid === currentUser?.uid}
          sender={usersById ? usersById[msg.senderUid] : undefined}
        />
      ))}
    </div>
  )
}