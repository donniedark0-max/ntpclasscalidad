"use client"

import { useState } from "react"
import { userProfile } from "@/lib/data/mock-data"

export default function ProfileForm() {
  const [profile, setProfile] = useState(userProfile)
  const [editingField, setEditingField] = useState<string | null>(null)

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Información personal</h1>
      <p className="mb-6 text-gray-600">Revisa y agrega tus datos personales para seguir en contacto.</p>

      {/* Editable Contact Info */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <p className="font-semibold">Celular</p>
            <p className="text-gray-700">{profile.celular}</p>
          </div>
          <button className="text-blue-600 hover:underline">Editar</button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Correo</p>
            <p className="text-gray-700">{profile.correo}</p>
          </div>
          <button className="text-blue-600 hover:underline">Editar</button>
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <div className="flex gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-600">
              <span className="text-xs font-bold text-blue-600">i</span>
            </div>
            <p className="text-sm text-gray-700">
              Solo puedes <strong>actualizar estos datos (1) vez al día.</strong> Esta actualización se mostrarán en
              todas tus plataformas digitales UTP.
            </p>
          </div>
        </div>
      </div>

      {/* Read-only Personal Info */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div>
            <p className="font-semibold">Nombres</p>
            <p className="text-gray-700">{profile.nombres}</p>
          </div>

          <div>
            <p className="font-semibold">Apellidos</p>
            <p className="text-gray-700">{profile.apellidos}</p>
          </div>

          <div>
            <p className="font-semibold">Documento de identidad</p>
            <p className="text-gray-700">{profile.documentoIdentidad}</p>
          </div>

          <div>
            <p className="font-semibold">Fecha de nacimiento</p>
            <p className="text-gray-700">{profile.fechaNacimiento}</p>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <div className="flex gap-2">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 border-blue-600">
              <span className="text-xs font-bold text-blue-600">i</span>
            </div>
            <p className="text-sm text-gray-700">
              Si los datos mostrados contienen errores, registra una{" "}
              <a href="#" className="text-blue-600 underline">
                solicitud de SAE
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Additional Editable Fields */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <p className="font-semibold">Estado Civil</p>
          </div>
          <button className="text-blue-600 hover:underline">Editar</button>
        </div>

        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <p className="font-semibold">Dirección de domicilio</p>
            <p className="text-gray-700">{profile.direccion}</p>
          </div>
          <button className="text-blue-600 hover:underline">Editar</button>
        </div>

        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <p className="font-semibold">Movilidad</p>
            <p className="text-gray-400">Ingresa tu movilidad</p>
          </div>
          <button className="text-blue-600 hover:underline">Editar</button>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Contacto de emergencia</p>
            <p className="text-gray-400">Ingresa tu contacto de emergencia</p>
          </div>
          <button className="text-blue-600 hover:underline">Editar</button>
        </div>
      </div>
    </div>
  )
}
