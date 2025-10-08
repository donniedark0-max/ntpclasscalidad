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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
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
          <button type="button" className="text-blue-600 hover:underline">
            Subir archivo(s)
          </button>
        </div>
      </div>

      <Button type="submit" className="bg-blue-200 text-blue-900 hover:bg-blue-300">
        Solicitar
      </Button>
    </form>
  )
}
