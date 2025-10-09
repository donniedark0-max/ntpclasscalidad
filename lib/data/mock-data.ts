import type { Course, WeekContent, Activity, UserProfile } from "@/lib/types"

export const courses: Course[] = [
  {
    id: "1",
    code: "33350",
    name: "Auditoría de Sistemas Informáticos",
    type: "Presencial",
    progress: 16,
    instructor: "Kevin George Muñoz Tito",
  },
  {
    id: "2",
    code: "13438",
    name: "Calidad de Software",
    type: "Presencial",
    progress: 7,
    instructor: "Rene Alejandro Zamudio Ariza",
  },
  {
    id: "3",
    code: "30526",
    name: "Inteligencia Artificial",
    type: "Presencial",
    progress: 6,
    instructor: "Luis Gustavo Arenaza Encinas",
  },
]

export const weeklyContent: WeekContent[] = [
  {
    id: "week-1",
    title: "Semana 01",
    subtitle: "SEMANA 1",
    items: [
      {
        id: "exam-1",
        type: "exam",
        label: "Examen • Evaluación",
        title: "S01 - EXAMEN 01",
        status: "pending",
      },
      {
        id: "forum-1",
        type: "forum",
        label: "Foro de discusión no calificado",
        title: "Foro",
        status: "expired",
        deadline: "Desde: Lunes, 11 de agosto de 2025 a las 06:00 a.m.",
      },
    ],
  },
]

export const activities: Activity[] = [
  {
    id: "1",
    type: "Tarea no calificada",
    title: "NUEVA FECHA ¡Participa en la Fer...",
    course: "Egresa con Potencial",
    deadline: "09/10/2025 a las 4:00 PM",
    status: "pending",
  },
  {
    id: "2",
    type: "Foro no calificado",
    title: "S09.s1-Foro",
    course: "PRUEBAS DE SOFTWARE",
    deadline: "10/10/2025 a las 7:37 PM",
    status: "pending",
  },
  {
    id: "3",
    type: "Tarea no calificada",
    title: "S09.s1-Tarea",
    course: "PRUEBAS DE SOFTWARE",
    deadline: "10/10/2025 a las 11:59 PM",
    status: "pending",
  },
  {
    id: "4",
    type: "Foro no calificado",
    title: "Foro",
    course: "CALIDAD DE SOFTWARE",
    deadline: "11/10/2025 a las 11:00 PM",
    status: "pending",
  },
]

export const userProfile: UserProfile = {
  celular: "990123456",
  correo: "usuario@ejemplo.com",
  nombres: "Juan Carlos",
  apellidos: "Pérez Gómez",
  documentoIdentidad: "12345678",
  fechaNacimiento: "01/01/1990",
  direccion: "Av. Ficticia 123, Ciudad, País",
}

export const exams: Record<string, any> = {
  "exam-1": {
    id: "exam-1",
    title: "S01 - EXAMEN 01",
    courseId: "1",
    weekId: "week-1",
    timeLimit: 60,
    attempts: 0,
    maxAttempts: 3,
    questions: [
      {
        id: "q1",
        type: "multiple-choice",
        question: "¿Cuál es el objetivo principal de la auditoría de sistemas?",
        options: [
          "Desarrollar nuevos sistemas",
          "Evaluar la seguridad y eficiencia de los sistemas de información",
          "Programar aplicaciones",
          "Diseñar bases de datos",
        ],
      },
      {
        id: "q2",
        type: "checkbox",
        question: "Selecciona los componentes de un sistema de información (puede haber múltiples respuestas):",
        options: ["Hardware", "Software", "Datos", "Personas", "Procesos", "Redes"],
      },
      {
        id: "q3",
        type: "multiple-choice",
        question: "¿Qué norma internacional se utiliza para la gestión de seguridad de la información?",
        options: ["ISO 9001", "ISO 27001", "ISO 14001", "ISO 45001"],
      },
      {
        id: "q4",
        type: "text",
        question: "Explica brevemente qué es un control interno en sistemas de información:",
      },
      {
        id: "q5",
        type: "checkbox",
        question: "¿Cuáles de los siguientes son tipos de auditoría de sistemas?",
        options: [
          "Auditoría de seguridad",
          "Auditoría de cumplimiento",
          "Auditoría operativa",
          "Auditoría financiera",
          "Auditoría de desarrollo",
        ],
      },
    ],
  },
}
