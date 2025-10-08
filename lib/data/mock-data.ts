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
        id: "material-1",
        type: "material",
        label: "Material • PDF",
        title: "S01 - Material",
        status: "completed",
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
  celular: "904872163",
  correo: "jjosesito185@gmail.com",
  nombres: "Juan Jose",
  apellidos: "Vilcahuaman Alvarado",
  documentoIdentidad: "61181383",
  fechaNacimiento: "18/11/2002",
  direccion: "MZ K2 LT 5 LOS JARDINES DE CHILLON, Puente Piedra, Lima, Lima, Perú",
}
