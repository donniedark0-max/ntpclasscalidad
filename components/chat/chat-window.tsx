"use client"

import { useEffect, useRef, useState } from "react"
import { Paperclip, UserCircle, Send } from "lucide-react"
import { getFirebaseFirestore, getFirebaseAuth } from "@/lib/firebaseClient"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"

type User = {
  uid: string
  displayName?: string
  email?: string
  photoURL?: string
}

type Message = {
  id: string
  senderUid: string
  text?: string
  fileUrl?: string
  createdAt: any
}

type ChatWindowProps = {
  chatId: string
  currentUser: User | null
  otherUser?: User | undefined
}
export default function ChatWindow({ chatId, currentUser, otherUser }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Listen for messages in Firestore
  useEffect(() => {
    if (!chatId) return
    let unsub: any = null
    async function fetchMessages() {
      const firestore = await getFirebaseFirestore()
      const { getFirestore, collection, query, orderBy, onSnapshot } = firestore
      const db = getFirestore()
      const q = query(
        collection(db, `chats/${chatId}/messages`),
        orderBy("createdAt", "asc")
      )
      unsub = onSnapshot(q, (snapshot: any) => {
        const msgs: Message[] = []
        snapshot.forEach((doc: any) => {
          msgs.push({ id: doc.id, ...doc.data() })
        })
        setMessages(msgs)
      })
    }
    fetchMessages()
    return () => { if (unsub) unsub() }
  }, [chatId])

  // Send message (text or file)
  async function handleSend(e?: React.FormEvent) {
  if (e) e.preventDefault()
  if (!currentUser || (!newMessage.trim() && !file)) return
  setSending(true)
  try {
    let fileUrl = null
    if (file) {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import("firebase/storage")
      const storage = getStorage()
      const fileRef = ref(storage, `chat-files/${chatId}/${Date.now()}-${file.name}`)
      await uploadBytes(fileRef, file)
      fileUrl = await getDownloadURL(fileRef)
    }
    // Save message in Firestore
    const firestore = await getFirebaseFirestore()
    const { getFirestore, collection, addDoc, serverTimestamp, doc, updateDoc } = firestore
    const db = getFirestore()
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      senderUid: currentUser.uid,
      text: newMessage.trim() || null,
      fileUrl: fileUrl || null,
      createdAt: serverTimestamp(),
    })
    // Update the chat document with the last message and date
    const lastMsg =
    newMessage.trim()
      ? newMessage.trim()
      : file
      ? "Archivo adjunto"
      : ""
    const chatRef = doc(db, "chats", chatId)
    await updateDoc(chatRef, {
      lastMessage: lastMsg,
      updatedAt: serverTimestamp(),
    })
    setNewMessage("")
    setFile(null)
  } catch (err) {
    // Error
  }
  setSending(false)
}

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  return (
    <div className="flex flex-col h-full">
        {/* Header with user info */}
        <div className="flex items-center gap-3 border-b px-4 py-3 bg-white">
            {otherUser?.photoURL ? (
            <img src={otherUser.photoURL} alt={otherUser.displayName} className="h-10 w-10 rounded-full object-cover" />
            ) : (
            <UserCircle className="h-10 w-10 text-gray-400" />
            )}
            <div>
            <div className="font-semibold text-lg">{otherUser?.displayName || "Usuario"}</div>
            <div className="text-xs text-gray-500">{otherUser?.email}</div>
            </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg) => (
                <div
                key={msg.id}
                className={`mb-3 flex ${msg.senderUid === currentUser?.uid ? "justify-end" : "justify-start"}`}
            >
                <div className={`rounded-lg px-4 py-2 max-w-xs ${msg.senderUid === currentUser?.uid ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-900"}`}>
                {msg.text && <div>{msg.text}</div>}
                {msg.fileUrl && (
                    <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-blue-200 underline"
                    >
                    Archivo adjunto
                    </a>
                )}
                <div className="text-[10px] text-right text-gray-400 mt-1"></div>
                </div>
            </div>
            ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input for message and attachment */}
      <form onSubmit={handleSend} className="flex items-center gap-2 border-t p-3 bg-white">
        <label className="cursor-pointer" aria-label="Adjuntar archivo">
          <Paperclip className="h-5 w-5 text-gray-500" />
          <input
            type="file"
            className="hidden"
            onChange={handleFileChange}
            disabled={sending}
            aria-label="Seleccionar archivo para adjuntar"
          />
        </label>
        {file && (
          <span className="text-xs text-gray-600 truncate max-w-[120px]">{file.name}</span>
        )}
        <input
          type="text"
          className="flex-1 rounded border px-3 py-2 text-sm"
          placeholder="Escribe un mensaje..."
          aria-label="Mensaje"
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          disabled={sending}
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          disabled={sending || (!newMessage.trim() && !file)}
          aria-label="Enviar mensaje"
        >
          <span className="sr-only">Enviar mensaje</span>
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}