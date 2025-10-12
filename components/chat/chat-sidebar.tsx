"use client"

import { useEffect, useState } from "react"
import { Plus, UserCircle, X } from "lucide-react"
import { getFirebaseFirestore } from "@/lib/firebaseClient"

type User = {
  uid: string
  displayName?: string
  email?: string
  photoURL?: string
}

type Chat = {
  id: string
  users: string[]
  lastMessage?: string
  updatedAt?: any
}

type ChatSidebarProps = {
  chats: Chat[]
  currentUser: User | null
  selectedChatId: string | null
  onSelectChat: (chatId: string) => void
  loading?: boolean
}

type OtherUser = {
  uid: string
  displayName?: string
  photoURL?: string
  email?: string
}

export default function ChatSidebar({
  chats,
  currentUser,
  selectedChatId,
  onSelectChat,
  loading,
}: ChatSidebarProps) {
  const [otherUsers, setOtherUsers] = useState<Record<string, OtherUser>>({})
  const [showUserList, setShowUserList] = useState(false)
  const [allUsers, setAllUsers] = useState<OtherUser[]>([])
  const [search, setSearch] = useState("")

  // Charge other users info for each chat
  useEffect(() => {
    async function fetchOtherUsers() {
      if (!currentUser || !chats.length) return
      const firestore = await getFirebaseFirestore()
      const { getFirestore, doc, getDoc } = firestore
      const db = getFirestore()
      const userMap: Record<string, OtherUser> = {}
      // Get the UIDs of the other users
      const uids = Array.from(
        new Set(
          chats
            .map(chat => chat.users.find(uid => uid !== currentUser.uid))
            .filter(Boolean)
        )
      )
      // Query each user document
      await Promise.all(
        uids.map(async uid => {
            const userDoc = await getDoc(doc(db, "users", uid!))
            if (userDoc.exists()) {
            const data = userDoc.data()
            userMap[uid!] = {
              uid: uid!,
              displayName: [data.name, data.lastname].filter(Boolean).join(" ") || data.displayName || data.email || uid,
              photoURL: data.photoURL,
              email: data.email,
            }
            } else {
                console.log("Usuario NO encontrado:", uid)
            }
        })
      )
      setOtherUsers(userMap)
    }
    fetchOtherUsers()
  }, [chats, currentUser])

  // Load all registered users (to start new chat)
  useEffect(() => {
    async function fetchAllUsers() {
      if (!currentUser || !showUserList) return
      try {
        const firestore = await getFirebaseFirestore()
        const { getFirestore, collection, getDocs } = firestore
        const db = getFirestore()
        const q = collection(db, "users")
        const snap = await getDocs(q)
        const users: OtherUser[] = []
        snap.forEach((doc: any) => {
          const data = doc.data()
          const uid = data.uid || doc.id
          if (uid !== currentUser.uid) {
            users.push({
              uid,
              displayName: [data.name, data.lastname].filter(Boolean).join(" ") || data.displayName || data.email || uid,
              photoURL: data.photoURL,
              email: data.email,
            })
          }
        })
        setAllUsers(users)
      } catch (e) {
        // Ignore
      }
    }
    fetchAllUsers()
  }, [showUserList, currentUser])

    useEffect(() => {
        async function updateChats() {
            const firestore = await getFirebaseFirestore()
            const { getFirestore, collection, getDocs, doc, updateDoc, query, orderBy, limit } = firestore
            const db = getFirestore()
            const chatsSnap = await getDocs(collection(db, "chats"))
            for (const chatDoc of chatsSnap.docs) {
                const messagesSnap = await getDocs(
                    query(collection(db, `chats/${chatDoc.id}/messages`), orderBy("createdAt", "desc"), limit(1))
                )
                if (!messagesSnap.empty) {
                    const lastMsg = messagesSnap.docs[0].data()
                    await updateDoc(doc(db, "chats", chatDoc.id), {
                        lastMessage: lastMsg.text || (lastMsg.fileUrl ? "Archivo adjunto" : ""),
                        updatedAt: lastMsg.createdAt,
                    })
                }
            }
        }
        updateChats()
    }, [])

  // Start new chat (or select existing one)
  async function handleStartChat(user: OtherUser) {
    setShowUserList(false)
    if (!currentUser) return
    // Check if a chat already exists between the two users
    const existing = chats.find(
      (chat) =>
        chat.users.length === 2 &&
        chat.users.includes(currentUser.uid) &&
        chat.users.includes(user.uid)
    )
    if (existing) {
      onSelectChat(existing.id)
      return
    }
    // If not, create a new one in Firestore
    try {
      const firestore = await getFirebaseFirestore()
      const { getFirestore, collection, addDoc, serverTimestamp } = firestore
      const db = getFirestore()
      const docRef = await addDoc(collection(db, "chats"), {
        users: [currentUser.uid, user.uid],
        lastMessage: "",
        updatedAt: serverTimestamp(),
      })
      onSelectChat(docRef.id)
    } catch (e) {
      // Error
    }
  }

  // Filter users by search
  const filteredUsers = allUsers.filter(
    (u) =>
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <aside className="w-72 bg-gray-100 border-r flex flex-col relative">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-bold text-lg">Chats</h2>
        <button
          className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-white hover:bg-blue-700 text-sm"
          title="Nuevo chat"
          onClick={() => setShowUserList(true)}
        >
          <Plus className="h-4 w-4" />
          Nuevo
        </button>
      </div>

      {/* User list modal */}
      {showUserList && (
        <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-80 max-h-[70vh] flex flex-col">
            <div className="flex items-center justify-between p-3 border-b">
              <span className="font-semibold">Iniciar chat</span>
              <button onClick={() => setShowUserList(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-3">
              <input
                type="text"
                placeholder="Buscar usuario..."
                className="w-full rounded border px-2 py-1 text-sm mb-2"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <div className="overflow-y-auto max-h-56">
                {filteredUsers.length === 0 ? (
                  <div className="text-gray-500 text-sm py-4 text-center">No hay usuarios</div>
                ) : (
                  <ul>
                    {filteredUsers.map((user) => (
                      <li
                        key={user.uid}
                        className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-blue-50 rounded transition"
                        onClick={() => handleStartChat(user)}
                      >
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <UserCircle className="h-8 w-8 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{user.displayName || "Usuario"}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-gray-500">Cargando chats...</div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-gray-500">No tienes chats aún.</div>
        ) : (
          <ul>
            {chats.map((chat) => {
              // Find the other user's UID
              const otherUid = chat.users.find((uid) => uid !== currentUser?.uid)
              const other = otherUsers[otherUid || ""] || { displayName: "Usuario", photoURL: undefined }
              return (
                <li
                  key={chat.id}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b hover:bg-blue-50 transition ${
                    selectedChatId === chat.id ? "bg-blue-100" : ""
                  }`}
                  onClick={() => onSelectChat(chat.id)}
                >
                  {other.photoURL ? (
                    <img src={other.photoURL} alt={other.displayName} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <UserCircle className="h-10 w-10 text-gray-400" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{other.displayName || "Usuario"}</div>
                    <div className="text-xs text-gray-500 truncate">{chat.lastMessage || "Sin mensajes"}</div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}