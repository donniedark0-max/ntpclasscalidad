// User types
export interface User {
  id: string
  codigo: string
  nombres: string
  apellidos: string
  email: string
  rol: "estudiante" | "docente" | "admin"
  avatar?: string
}

export interface UserProfile {
  celular: string
  correo: string
  nombres: string
  apellidos: string
  documentoIdentidad: string
  fechaNacimiento: string
  estadoCivil?: string
  direccion: string
  movilidad?: string
  contactoEmergencia?: string
}

// Course types
export interface Course {
  id: string
  code: string
  name: string
  type: "Presencial" | "Virtual" | "Híbrido"
  progress: number
  instructor: string
  instructorAvatar?: string
  thumbnail?: string
}

// Weekly content types
export interface WeekContent {
  id: string
  title: string
  subtitle: string
  items: WeekItem[]
}

export interface WeekItem {
  id: string
  type: "material" | "forum" | "assignment" | "exam"
  label: string
  title: string
  status?: "completed" | "pending" | "expired"
  deadline?: string
}

// Activity types
export interface Activity {
  id: string
  type: "Tarea no calificada" | "Foro no calificado" | "Examen" | "Práctica"
  title: string
  course: string
  deadline: string
  status: "pending" | "submitted" | "graded"
}

// SAE types
export interface SAERequest {
  id: string
  userId: string
  tipo: string
  telefono: string
  detalle: string
  archivos?: File[]
  estado: "pendiente" | "en_proceso" | "completado" | "rechazado"
  fechaCreacion: string
  fechaActualizacion?: string
}

// Exam/Practice types
export interface Question {
  id: string
  type: "multiple-choice" | "text" | "checkbox"
  question: string
  options?: string[]
  answer?: string | string[]
}

export interface Exam {
  id: string
  title: string
  courseId: string
  weekId: string
  questions: Question[]
  timeLimit?: number
  attempts: number
  maxAttempts: number
  score?: number
}
