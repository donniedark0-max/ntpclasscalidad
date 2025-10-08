"use client"

import { useState } from "react"
import DashboardLayout from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ArrowLeft, Clock, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { exams } from "@/lib/data/mock-data"

export default function ExamPage({ params }: { params: { courseId: string; examId: string } }) {
  const exam = exams[params.examId]
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [submitted, setSubmitted] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(exam?.timeLimit || 60)

  if (!exam) {
    return (
      <DashboardLayout>
        <div className="text-center">Examen no encontrado</div>
      </DashboardLayout>
    )
  }

  const handleMultipleChoice = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleCheckbox = (questionId: string, option: string, checked: boolean) => {
    setAnswers((prev) => {
      const current = prev[questionId] || []
      if (checked) {
        return { ...prev, [questionId]: [...current, option] }
      } else {
        return { ...prev, [questionId]: current.filter((item: string) => item !== option) }
      }
    })
  }

  const handleText = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  const handleSubmit = () => {
    console.log("[v0] Exam submitted with answers:", answers)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl">
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-green-600">¡Examen enviado con éxito!</h2>
            <p className="mb-6 text-gray-600">
              Tu examen ha sido enviado correctamente. Recibirás los resultados una vez que el docente lo revise.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>
                <strong>Examen:</strong> {exam.title}
              </p>
              <p>
                <strong>Fecha de envío:</strong> {new Date().toLocaleString("es-ES")}
              </p>
              <p>
                <strong>Preguntas respondidas:</strong> {Object.keys(answers).length} de {exam.questions.length}
              </p>
            </div>
            <Link href={`/dashboard/courses/${params.courseId}`}>
              <Button className="mt-6">Volver al curso</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/dashboard/courses/${params.courseId}`}
          className="mb-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
        >
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

          <div className="flex gap-4 text-sm text-gray-600">
            <span>
              Intentos: {exam.attempts}/{exam.maxAttempts}
            </span>
            <span>•</span>
            <span>Preguntas: {exam.questions.length}</span>
          </div>
        </div>

        <div className="space-y-6">
          {exam.questions.map((question: any, index: number) => (
            <div key={question.id} className="rounded-lg bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold">
                {index + 1}. {question.question}
              </h3>

              {question.type === "multiple-choice" && (
                <RadioGroup
                  value={answers[question.id]}
                  onValueChange={(value) => handleMultipleChoice(question.id, value)}
                >
                  <div className="space-y-3">
                    {question.options.map((option: string, optIndex: number) => (
                      <div key={optIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${optIndex}`} />
                        <Label htmlFor={`${question.id}-${optIndex}`} className="cursor-pointer font-normal">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              )}

              {question.type === "checkbox" && (
                <div className="space-y-3">
                  {question.options.map((option: string, optIndex: number) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <Checkbox
                        id={`${question.id}-${optIndex}`}
                        checked={answers[question.id]?.includes(option)}
                        onCheckedChange={(checked) => handleCheckbox(question.id, option, checked as boolean)}
                      />
                      <Label htmlFor={`${question.id}-${optIndex}`} className="cursor-pointer font-normal">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}

              {question.type === "text" && (
                <Textarea
                  placeholder="Escribe tu respuesta aquí..."
                  value={answers[question.id] || ""}
                  onChange={(e) => handleText(question.id, e.target.value)}
                  className="min-h-32"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-4 rounded-lg bg-white p-6 shadow-sm">
          <Link href={`/dashboard/courses/${params.courseId}`}>
            <Button variant="outline">Cancelar</Button>
          </Link>
          <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            Enviar examen
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}
