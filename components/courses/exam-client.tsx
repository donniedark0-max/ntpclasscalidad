"use client"

import React, { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Clock, CheckCircle2, Upload } from "lucide-react"
import Link from "next/link"

type Props = {
  exam: any
  courseId: string
}

export default function ExamClient({ exam, courseId }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [submissionExists, setSubmissionExists] = useState(false)
  const [submissionData, setSubmissionData] = useState<any>(null)
  const [utpCode, setUtpCode] = useState<string | null>(null)
  const [checkingSubmission, setCheckingSubmission] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState<number>(exam?.timeLimit || 60)
  const [filesByQuestion, setFilesByQuestion] = useState<Record<string, File[]>>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let t: any = null
    if (exam?.timeLimit) {
      t = setInterval(() => setTimeRemaining((s) => Math.max(0, s - 1)), 1000)
    }
    return () => { if (t) clearInterval(t) }
  }, [exam])

  // On mount, check if user already submitted for this week
  useEffect(() => {
    let mounted = true
    async function checkSubmission() {
      try {
        const meResp = await fetch('/api/auth/me').then((r) => r.json()).catch(() => null)
        const code = meResp?.user?.utpCode
        if (!mounted) return
        if (!code) {
          setCheckingSubmission(false)
          return
        }
        setUtpCode(code)

        // determine week number
        let weekNumber = 'unknown'
        if (exam.weekId) {
          const m = String(exam.weekId).match(/week-(\d+)/)
          if (m) weekNumber = m[1]
        } else if (exam.week) {
          weekNumber = String(exam.week)
        }

        try {
          const firebaseApp = (await import('@/lib/firebaseClient')).default
          const { getFirestore, doc, getDoc } = await import('firebase/firestore')
          const db = getFirestore(firebaseApp as any)
          const { collection } = await import('firebase/firestore')
          const colName = `answers_week-${weekNumber}`
          const dref = doc(db, colName, code)
          const snap = await getDoc(dref)
          if (snap.exists()) {
            const data = snap.data()
            setSubmissionExists(true)
            setSubmissionData(data)
            setSubmitted(true)
          }
        } catch (e) {
          // If client cannot read Firestore due to rules, ignore — server will still allow submit
          console.warn('Could not check existing submission client-side', e)
        }
      } catch (err) {
        console.error('checkSubmission error', err)
      } finally {
        if (mounted) setCheckingSubmission(false)
      }
    }

    checkSubmission()
    return () => { mounted = false }
  }, [exam])

  if (!exam) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="text-center">Examen no encontrado</div>
      </div>
    )
  }

  const handleMultipleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleCheckbox = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (checked) return { ...prev, [questionId]: [...current, option] }
      return { ...prev, [questionId]: current.filter((i: string) => i !== option) }
    })
  }

  const handleText = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleFileChange = (questionId: string, files: FileList | null) => {
    setErrorMessage(null)
    if (!files) return
    const arr = Array.from(files)

    // Validate types and size
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    const maxSize = 5 * 1024 * 1024 // 5 MB
    const valid: File[] = []
    const errors: string[] = []

    for (const f of arr) {
      if (!allowed.includes(f.type)) {
        errors.push(`${f.name}: formato no permitido`)
        continue
      }
      if (f.size > maxSize) {
        errors.push(`${f.name}: supera 5 MB`)
        continue
      }
      valid.push(f)
      if (valid.length >= 5) break
    }

    if (errors.length) {
      setErrorMessage(errors.join('. '))
    }

    // limit to 5 files
    const final = valid.slice(0, 5)
    setFilesByQuestion((prev) => ({ ...prev, [questionId]: final }))
  }

  const handleSubmit = async () => {
    try {
      setErrorMessage(null)
      // fetch authenticated user (server session)
      const me = await fetch('/api/auth/me').then(r => r.json()).catch(() => null)
      const code = me?.user?.utpCode
      if (!code) {
        setErrorMessage('No se pudo identificar al usuario')
        return
      }

      // dynamic import firebase client for uploads and firestore writes
      const firebaseApp = (await import('@/lib/firebaseClient')).default
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import('firebase/storage')
      const { getFirestore, collection, doc, setDoc } = await import('firebase/firestore')

      const storage = getStorage(firebaseApp as any)
      const db = getFirestore(firebaseApp as any)

      const uploadedAnswers: Record<string, any> = { ...answers }

      // upload files and replace with URLs
      for (const [qId, files] of Object.entries(filesByQuestion)) {
        if (!files || files.length === 0) continue
        const urls: string[] = []
        for (const file of files) {
          // re-validate before upload
          const allowed = ['image/jpeg', 'image/png', 'application/pdf']
          const maxSize = 5 * 1024 * 1024
          if (!allowed.includes(file.type) || file.size > maxSize) {
            setErrorMessage(`Archivo inválido: ${file.name}`)
            return
          }
          const ts = Date.now()
          const path = `answers/${exam.weekId || exam.week || 'week'}/${exam.id}/${code}/${qId}/${ts}_${file.name}`
          const r = ref(storage, path)
          await uploadBytes(r, file as any)
          const url = await getDownloadURL(r)
          urls.push(url)
        }
        uploadedAnswers[qId] = urls
      }

      // determine week number for collection name
      let weekNumber = 'unknown'
      if (exam.weekId) {
        const m = String(exam.weekId).match(/week-(\d+)/)
        if (m) weekNumber = m[1]
      } else if (exam.week) {
        weekNumber = String(exam.week)
      }

      const collName = `answers_week-${weekNumber}`
      const answersRef = doc(collection(db, collName), code)
      await setDoc(answersRef, {
        examId: exam.id,
        courseId,
        submittedAt: new Date().toISOString(),
        answers: uploadedAnswers,
        status: 'pending_review',
      })

      // update local state to reflect submission persisted
      setSubmissionExists(true)
      setSubmissionData({ examId: exam.id, submittedAt: new Date().toISOString(), answers: uploadedAnswers, status: 'pending_review' })
      setSubmitted(true)
    } catch (err) {
      console.error('submit exam error', err)
      setErrorMessage('Error al enviar el examen')
    }
  }

  if (submitted) {
    // If we have submissionData with status, show pending review message
    const status = submissionData?.status || 'pending_review'
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-lg bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <CheckCircle2 className="h-16 w-16 text-orange-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-orange-600">Examen en revisión</h2>
          <p className="mb-6 text-gray-600">Tu examen está siendo revisado por el docente. La nota aparecerá próximamente.</p>
          <div className="space-y-2 text-sm text-gray-500">
            <p><strong>Examen:</strong> {exam.title}</p>
            <p>
              <strong>Estado:</strong> {status === 'pending_review' ? 'En revisión' : status}
            </p>
            <p>
              <strong>Fecha de envío:</strong> {submissionData?.submittedAt ? new Date(submissionData.submittedAt).toLocaleString() : new Date().toLocaleString()}
            </p>
          </div>
          <Link href={`/dashboard/courses/${courseId}`}>
            <Button className="mt-6">Volver al curso</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/dashboard/courses/${courseId}`} className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700">
        <ArrowLeft className="h-4 w-4" />
        Volver al curso
      </Link>

      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">{exam.title}</h1>
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">{timeRemaining} min</span>
          </div>
        </div>

        <div className="space-y-6">
          {exam.questions?.map((question: any, index: number) => (
            <div key={question.id} className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">{index + 1}. {question.question}</h3>

              {question.type === 'multiple-choice' && (
                <RadioGroup value={answers[question.id]} onValueChange={(value) => handleMultipleChoice(question.id, value)}>
                  <div className="space-y-3">
                    {question.options?.map((option: string, optIndex: number) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                        <Label htmlFor={`${question.id}-${optIndex}`} className="cursor-pointer font-normal">{option}</Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {question.type === 'checkbox' && (
                <div className="space-y-3">
                  {question.options?.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${optIndex}`}
                        checked={answers[question.id]?.includes(option)}
                        onChange={(e) => handleCheckbox(question.id, option, (e.target as HTMLInputElement).checked)}
                      />
                      <Label htmlFor={`${question.id}-${optIndex}`} className="cursor-pointer font-normal">{option}</Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'text' && (
                <div className="space-y-3">
                  <Textarea placeholder="Escribe tu respuesta aquí..." value={answers[question.id] || ''} onChange={(e) => handleText(question.id, (e.target as HTMLTextAreaElement).value)} className="min-h-32" />

                  {/* Attachment UI styled like SAE form */}
                  <div className="mb-6">
                    <p className="mb-2 font-semibold">
                      Adjuntar evidencia: <span className="font-normal">(Opcional)</span>
                    </p>
                    <p className="mb-4 text-sm text-gray-600">Sólo puedes subir 5 archivos en formato JPG, PNG, PDF. (Carga máxima: 5 MB)</p>

                    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
                      <Upload className="mx-auto mb-2 h-8 w-8 text-blue-600" />
                      <button
                        type="button"
                        className="text-blue-600 hover:underline"
                        onClick={() => {
                          const el = document.getElementById(`file-${question.id}`) as HTMLInputElement | null
                          el?.click()
                        }}
                      >
                        Subir archivo(s)
                      </button>

                      <input
                        id={`file-${question.id}`}
                        type="file"
                        accept=".pdf,image/png,image/jpeg"
                        multiple
                        aria-label={`Adjuntar archivos para ${question.id}`}
                        className="hidden"
                        onChange={(e) => handleFileChange(question.id, e.target.files)}
                      />
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      {filesByQuestion[question.id]?.map((f, i) => (
                        <div key={i} className="flex items-center justify-center gap-2">{f.name} <span className="text-xs text-gray-400">({Math.round(f.size/1024)} KB)</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4 rounded-lg bg-white p-6 shadow-sm">
          <Link href={`/dashboard/courses/${courseId}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">Enviar examen</Button>
        </div>
      </div>
    </div>
  )
}
