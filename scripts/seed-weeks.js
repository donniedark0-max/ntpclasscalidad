/*
Seed script para crear 18 semanas y un examen por semana en Firestore.
Uso:
  - Coloca tu JSON de service account en la variable de entorno FIREBASE_SERVICE_ACCOUNT (contenido JSON) o en un archivo y apunta con GOOGLE_APPLICATION_CREDENTIALS.
  - Ejecuta: node scripts/seed-weeks.js

Esto creará la colección `weeks` con documentos week-1..week-18. Cada documento tendrá un `exam` con preguntas simples.
*/

const admin = require('firebase-admin')
// try loading local env if present so script can read FIREBASE_SERVICE_ACCOUNT from .env.local
try {
  require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env.local') })
} catch (e) {
  // ignore if dotenv not installed; fallback to process.env
}

function initAdmin() {
  const fs = require('fs')
  const path = require('path')

  // 1) Prefer explicit file `utp-class-fsc.json` in repo root if present
  try {
    const rootSaPath = path.resolve(__dirname, '..', 'utp-class-fsc.json')
    if (fs.existsSync(rootSaPath)) {
      const fileContent = fs.readFileSync(rootSaPath, 'utf8')
      const sa = JSON.parse(fileContent)
      admin.initializeApp({ credential: admin.credential.cert(sa) })
      return
    }
  } catch (e) {
    // continue to other strategies
  }

  // 2) Environment strategies (existing logic)
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    let raw = process.env.FIREBASE_SERVICE_ACCOUNT
    // If value looks like a path to a file, try reading it
    try {
      if (typeof raw === 'string' && fs.existsSync(raw)) {
        const fileContent = fs.readFileSync(raw, 'utf8')
        const sa = JSON.parse(fileContent)
        admin.initializeApp({ credential: admin.credential.cert(sa) })
        return
      }
    } catch (e) {
      // continue to other parsing strategies
    }

    // Try raw parsing, then sanitized parsing, then base64 decode
    const tryParse = (s) => {
      try { return JSON.parse(s) } catch (e) { return null }
    }

    let sa = tryParse(raw)
    if (!sa) {
      // remove surrounding quotes if present
      try {
        if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1)
        // convert escaped newlines to real newlines
        raw = raw.replace(/\\n/g, '\n')
        sa = tryParse(raw)
      } catch (e) {
        sa = null
      }
    }

    if (!sa) {
      // try base64 decode
      try {
        const decoded = Buffer.from(raw, 'base64').toString('utf8')
        sa = tryParse(decoded)
      } catch (e) {
        sa = null
      }
    }

    if (sa) {
      admin.initializeApp({ credential: admin.credential.cert(sa) })
      return
    } else {
      console.error('FIREBASE_SERVICE_ACCOUNT invalid JSON or unknown format. Provide a valid JSON, base64 JSON, or a file path.')
    }
  }

  // 3) GOOGLE_APPLICATION_CREDENTIALS (file path) - let firebase-admin load ADC
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp()
    return
  }

  console.error('No firebase credentials found. Provide utp-class-fsc.json in project root, set FIREBASE_SERVICE_ACCOUNT, or set GOOGLE_APPLICATION_CREDENTIALS')
  process.exit(1)
}

async function seed() {
  initAdmin()
  const db = admin.firestore()
  const weeksCol = db.collection('weeks')

  for (let i = 1; i <= 18; i++) {
    const weekId = `week-${i}`
    // Preguntas de ejemplo más realistas: mezclamos temas de sistemas, calidad y AI
    const exam = {
      id: `exam-week-${i}`,
      title: `Examen Semana ${i}`,
      timeLimit: 60,
      attempts: 0,
      maxAttempts: 3,
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: `¿Cuál es la función principal de los controles de acceso en un sistema de información?`,
          options: [
            'Proteger la confidencialidad y la integridad de los datos',
            'Aumentar la velocidad del sistema',
            'Reducir el almacenamiento necesario',
            'Mejorar la estética de la interfaz',
          ],
        },
        {
          id: 'q2',
          type: 'checkbox',
          question: `Selecciona las actividades que forman parte del aseguramiento de la calidad del software:`,
          options: ['Revisión de código', 'Pruebas automatizadas', 'Documentación', 'Marketing del producto'],
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: `En aprendizaje automático, ¿qué es sobreajuste (overfitting)?`,
          options: [
            'Cuando el modelo funciona bien con datos nuevos',
            'Cuando el modelo se ajusta demasiado a los datos de entrenamiento y falla en datos nuevos',
            'Cuando no hay suficientes parámetros en el modelo',
            'Cuando el modelo no converge durante el entrenamiento',
          ],
        },
        {
          id: 'q4',
          type: 'text',
          question: `Explica brevemente qué es un control interno en sistemas de información y proporciona un ejemplo práctico. (Puedes adjuntar evidencias en PDF/PNG/JPG)`,
        },
      ],
    }

    await weeksCol.doc(weekId).set({
      week: i,
      exam,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log('Seeded', weekId)
  }

  console.log('Done seeding 18 weeks')
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
