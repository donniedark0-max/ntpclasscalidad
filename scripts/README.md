Seed script para semanas y exámenes

Este pequeño README explica cómo usar el script `seed-weeks.js` para crear 18 semanas con un examen por semana y cómo funciona el almacenamiento de respuestas desde el cliente.

Requisitos
- Tener credenciales de Firebase Admin disponibles: puedes exportar el JSON del service account a la variable de entorno FIREBASE_SERVICE_ACCOUNT (contenido completo JSON) o establecer GOOGLE_APPLICATION_CREDENTIALS con la ruta al archivo JSON.

Ejecutar el seed

```bash
# desde la raíz del proyecto
FIREBASE_SERVICE_ACCOUNT='{"type":...}' node scripts/seed-weeks.js
# o
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
node scripts/seed-weeks.js
```

Qué crea
- Colección `weeks` con documentos `week-1` ... `week-18`.
- Cada documento contiene un campo `exam` con 4 preguntas (3 de ejemplo + la pregunta de texto para el control interno).

Cómo se guardan las respuestas (implementación en cliente)
- La página del examen sube archivos a Firebase Storage en la ruta:
  `answers/<weekId>/<examId>/<studentCode>/<questionId>/<timestamp>_<filename>`
- Luego guarda un documento en Firestore en la colección `answers_<weekId>` con id = `<studentCode>` y contenido:
  {
    studentCode,
    uid,
    courseId,
    examId,
    submittedAt,
    answers: { q1: [...], q2: [...], q4: [url1, url2] | "texto" }
  }

Notas
- Asegúrate de que tus reglas de Firestore/Storage permitan lecturas/escrituras para usuarios autenticados según tu política.
- Este script solo crea datos de ejemplo; edita el bloque `questions` si quieres preguntas reales.
