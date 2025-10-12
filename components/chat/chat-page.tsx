import { useEffect, useState } from "react"
import ChatSidebar from "./chat-sidebar"
import ChatWindow from "./chat-window"
import { getFirebaseAuth, getFirebaseFirestore } from "@/lib/firebaseClient"

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

export default function ChatPage() {
    const [currentUser, setCurrentUser] = useState<User | null | undefined>(undefined)
    const [chats, setChats] = useState<Chat[]>([])
    const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [otherUsers, setOtherUsers] = useState<Record<string, User>>({})

  // Get current user from Firebase Auth
  useEffect(() => {
    let unsub: any
    async function fetchUser() {
      const auth = await getFirebaseAuth()
      unsub = auth.onAuthStateChanged((user: any) => {
        if (user) {
          setCurrentUser({
            uid: user.uid,
            displayName: user.displayName || user.email || user.uid,
            email: user.email || undefined,
            photoURL: user.photoURL || undefined,
          })
        } else {
          setCurrentUser(null)
        }
      })
    }
    fetchUser()
    return () => { if (unsub) unsub() }
  }, [])

  // Fetch chats for current user
  useEffect(() => {
    if (!currentUser) return
    const uid = currentUser.uid
    let unsub: any = null
    async function fetchChats() {
      const firestore = await getFirebaseFirestore()
      const { getFirestore, collection, query, where, orderBy, onSnapshot } = firestore
      const db = getFirestore()
      const q = query(
        collection(db, "chats"),
        where("users", "array-contains", uid),
        orderBy("updatedAt", "desc")
      )
      unsub = onSnapshot(q, (snapshot: any) => {
        const chatList: Chat[] = []
        snapshot.forEach((doc: any) => {
          chatList.push({ id: doc.id, ...doc.data() })
        })
        setChats(chatList)
        setLoading(false)
      })
    }
    fetchChats()
    return () => { if (unsub) unsub() }
  }, [currentUser])

  // Select first chat by default
  useEffect(() => {
    if (!selectedChatId && chats.length > 0) {
      setSelectedChatId(chats[0].id)
    }
  }, [chats, selectedChatId])

  useEffect(() => {
  async function fetchOtherUsers() {
    if (!currentUser || !chats.length) return
    const firestore = await getFirebaseFirestore()
    const { getFirestore, doc, getDoc } = firestore
    const db = getFirestore()
    const userMap: Record<string, User> = {}
    const uids = Array.from(
      new Set(
        chats
          .map(chat => chat.users.find(uid => uid !== currentUser.uid))
          .filter(Boolean)
      )
    )
    await Promise.all(
      uids.map(async uid => {
        const userDoc = await getDoc(doc(db, "users", uid!))
        if (userDoc.exists()) {
          const data = userDoc.data()
          userMap[uid!] = {
            uid: uid!,
            displayName: [data.name, data.lastname].filter(Boolean).join(" ") || data.displayName || data.email || uid,
            email: data.email,
            photoURL: data.photoURL,
          }
        } else {
          console.log("Usuario NO encontrado:", uid)
        }
      })
    )
    setOtherUsers(userMap)
  }
  if (currentUser && chats.length) {
    fetchOtherUsers()
  }
}, [chats, currentUser])

  // Get the other user in the selected chat
  let selectedOtherUser: User | undefined
  if (selectedChatId && chats.length && currentUser) {
    const chat = chats.find(c => c.id === selectedChatId)
    const otherUid = chat?.users.find(uid => uid !== currentUser.uid)
    if (otherUid) selectedOtherUser = otherUsers[otherUid]
  }

  // Show loader only if currentUser is undefined (not null)
  if (currentUser === undefined) {
    return (
      <div className="flex h-[80vh] items-center justify-center text-gray-500">
        Cargando usuario...
      </div>
    )
  }

  return (
    <div className="flex h-[85vh] bg-white rounded-lg shadow overflow-hidden">
      <ChatSidebar
        chats={chats}
        currentUser={currentUser}
        selectedChatId={selectedChatId}
        onSelectChat={setSelectedChatId}
        loading={loading}
      />
      <div className="flex-1 border-l">
        {selectedChatId ? (
          <ChatWindow
            chatId={selectedChatId}
            currentUser={currentUser}
            otherUser={selectedOtherUser}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            Selecciona un chat o inicia una nueva conversación
          </div>
        )}
      </div>
    </div>
  )
}