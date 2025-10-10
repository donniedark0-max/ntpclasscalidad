"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload } from "lucide-react"

const tramiteTypes = [
  "Ampliación de vigencia/Cambio de título (Tesis o Trabajo de Suficiencia Profesional)",
  "Aprobación Plan Tesis o Trabajo Suficiencia Profesional",
  "Autenticación de Documentos",
  "Autenticación de Sílabo",
  "Beca Cultura",
  "Beca Excelencia Deportiva",
  "Beca Madre de Dios",
  "Beca por Orfandad/Por Discapacidad",
  "Beca Programa Deportivo Alta Competencia PRODAC",
  "Beca Pronabec",
]

export default function SAERequestForm() {
  const [formData, setFormData] = useState({
    tipo: "",
    telefono: "",
    detalle: "",
    aceptaComunicaciones: false,
  })
  const [files, setFiles] = useState<File[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successTicket, setSuccessTicket] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setSuccessTicket(null)

    // basic validation
    if (!formData.tipo) return setErrorMessage('Selecciona un tipo de trámite')
    if (!formData.telefono) return setErrorMessage('Ingresa un número de contacto')
    if (!formData.detalle) return setErrorMessage('Escribe el detalle de la solicitud')

    // prepare to upload files (if any)
    try {
      setIsSubmitting(true)
      const uploadedUrls: string[] = []

      if (files.length > 0) {
        // dynamic import firebase client helpers
        const fb = await import('@/lib/firebaseClient')
        const getFirebaseApp = fb.getFirebaseApp || fb.default
        const getFirebaseStorage = fb.getFirebaseStorage
        const firebaseApp = await getFirebaseApp()
        const storageMod = await getFirebaseStorage()
        const { getStorage, ref, uploadBytes, getDownloadURL } = storageMod
        const storage = getStorage(firebaseApp as any)

        for (const file of files) {
          const ts = Date.now()
          const path = `sae/${ts}_${file.name}`
          const r = ref(storage, path)
          await uploadBytes(r, file as any)
          const url = await getDownloadURL(r)
          uploadedUrls.push(url)
        }
      }

      // POST to server API to create ticket (server will read session to identify user)
      const resp = await fetch('/api/sae/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: formData.tipo, telefono: formData.telefono, detalle: formData.detalle, files: uploadedUrls }),
      })
      if (!resp.ok) {
        const txt = await resp.text()
        throw new Error(txt || 'Server error')
      }
      const json = await resp.json()
      setSuccessTicket(json.ticketId || json.id || null)
      setFormData({ tipo: "", telefono: "", detalle: "", aceptaComunicaciones: false })
      setFiles([])
    } catch (err: any) {
      console.error('SAE submit error', err)
      setErrorMessage(err?.message || 'Error al enviar la solicitud')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (inputFiles: FileList | null) => {
    setErrorMessage(null)
    if (!inputFiles) return
    const arr = Array.from(inputFiles)
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']
    const maxSize = 5 * 1024 * 1024
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
      if (valid.length + files.length >= 5) break
    }
    if (errors.length) setErrorMessage(errors.join('. '))
    setFiles((prev) => [...prev, ...valid].slice(0, 5))
    try { const el = document.getElementById('sae-file-input') as HTMLInputElement | null; if (el) el.value = '' } catch (e) {}
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
      <div className="mb-6">
        <label htmlFor="tipo" className="mb-2 block font-semibold">
          Tipo
        </label>
        <select
          id="tipo"
          value={formData.tipo}
          onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
        >
          <option value="">Selecciona un tipo de trámite</option>
          {tramiteTypes.map((tipo) => (
            <option key={tipo} value={tipo}>
              {tipo}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <label htmlFor="telefono" className="mb-2 block font-semibold">
          Información de contacto
        </label>
        <Input
          id="telefono"
          type="tel"
          placeholder="Ingresa tu número telefónico"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          maxLength={11}
        />
        <p className="mt-1 text-right text-xs text-gray-500">{formData.telefono.length} / 11</p>
      </div>

      <div className="mb-6">
        <label htmlFor="detalle" className="mb-2 block font-semibold">
          Detalle de solicitud
        </label>
        <Textarea
          id="detalle"
          placeholder="Escribe aquí el detalle"
          value={formData.detalle}
          onChange={(e) => setFormData({ ...formData, detalle: e.target.value })}
          rows={6}
          maxLength={2000}
        />
        <p className="mt-1 text-right text-xs text-gray-500">{formData.detalle.length} / 2000</p>
      </div>

      <div className="mb-6">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={formData.aceptaComunicaciones}
            onChange={(e) => setFormData({ ...formData, aceptaComunicaciones: e.target.checked })}
            className="mt-1"
          />
          <span className="text-sm text-gray-600">
            Acepto recibir comunicaciones de carácter administrativo y/o relacionados a los servicios que presta la
            Universidad al teléfono y correo ingresados.
          </span>
        </label>
      </div>

      <div className="mb-6">
        <p className="mb-2 font-semibold">
          Adjuntar evidencia: <span className="font-normal">(Opcional)</span>
        </p>
        <p className="mb-4 text-sm text-gray-600">
          Sólo puedes subir 5 archivos en formato JPG, PNG, PDF. (Carga máxima: 5 MB)
        </p>

        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <Upload className="mx-auto mb-2 h-8 w-8 text-blue-600" />
          <button type="button" className="text-blue-600 hover:underline" onClick={() => { const el = document.getElementById('sae-file-input') as HTMLInputElement | null; el?.click() }}>
            Subir archivo(s)
          </button>
          <input id="sae-file-input" type="file" accept=".pdf,image/png,image/jpeg" multiple className="hidden" onChange={(e) => handleFileChange(e.target.files)} />
        </div>

        <div className="mt-2 text-sm text-gray-600">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-center gap-2">{f.name} <span className="text-xs text-gray-400">({Math.round(f.size/1024)} KB)</span></div>
          ))}
        </div>
      </div>

      <div>
        <Button type="submit" className="bg-blue-200 text-blue-900 hover:bg-blue-300" disabled={isSubmitting}>{isSubmitting ? 'Enviando...' : 'Solicitar'}</Button>
        {successTicket && <div className="mt-3 text-sm text-green-700">Solicitud enviada. Ticket: <strong>{successTicket}</strong></div>}
        {errorMessage && <div className="mt-3 text-sm text-red-700">{errorMessage}</div>}
      </div>
    </form>
  )
}
