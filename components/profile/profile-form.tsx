"use client"

import { useEffect, useState, useCallback } from "react"
import type { UserProfile } from '@/lib/types'

export default function ProfileForm() {
  const [profile, setProfile] = useState<Partial<UserProfile & Record<string, any>>>({
    celular: '',
    correo: '',
    nombres: '',
    apellidos: '',
    documentoIdentidad: '',
    fechaNacimiento: '',
    direccion: '',
    movilidad: '',
    estadoCivil: '',
    contactoEmergencia: '',
  })
  const [loading, setLoading] = useState(true)
  const [userUid, setUserUid] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<{ contact?: boolean; personal?: boolean; other?: boolean }>({})

  useEffect(() => {
  let mounted = true
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(async (json) => {
        if (!mounted) return
        if (json?.ok && json.user) {
          let u = json.user
          // normalize dateB if server returned Firestore Timestamp
          const normalizeDate = (val: any) => {
            if (!val) return null
            if (typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
              try { return new Date(val.seconds * 1000).toISOString().split('T')[0] } catch(e) { return String(val) }
            }
            if (val instanceof Date) return val.toISOString().split('T')[0]
            return String(val)
          }
          if (u.dateB) {
            u = { ...u, dateB: normalizeDate(u.dateB) }
          }
          if (u.uid) setUserUid(u.uid)
          // If missing name/lastname, try client Firestore read by uid
          if ((!u.name || !u.lastname) && u.uid) {
            try {
              const firebaseApp = (await import('@/lib/firebaseClient')).default
              const { getFirestore, doc, getDoc } = await import('firebase/firestore')
              const db = getFirestore(firebaseApp as any)
              const userDoc = await getDoc(doc(db, 'users', u.uid))
              if (userDoc.exists()) {
                const data = userDoc.data()
                // helper: normalize Firestore Timestamp -> ISO string or keep string
                const normalizeDate = (val: any) => {
                  if (!val) return null
                  // Firestore Timestamp object has seconds & nanoseconds
                  if (typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
                    try {
                      return new Date(val.seconds * 1000).toISOString().split('T')[0]
                    } catch (e) {
                      return String(val)
                    }
                  }
                  // If it's a JS Date
                  if (val instanceof Date) return val.toISOString().split('T')[0]
                  // Otherwise stringify
                  return String(val)
                }

                // Map Firestore fields to our UI shape, normalizing dateB
                u = {
                  ...u,
                  name: data.name || u.name,
                  lastname: data.lastname || u.lastname,
                  number: data.number || u.number,
                  emailPersonal: data.emailPersonal || data.email || null,
                  DNI: data.DNI || null,
                  located: data.located || null,
                  dateB: normalizeDate(data.dateB) || null,
                  Movilidad: data.Movilidad || null,
                  numberE: data.numberE || null,
                  status: data.status || null,
                }
              }
            } catch (e) {
              // ignore
            }
          }

          setProfile(prev => ({
            ...prev,
            nombres: u.name || prev.nombres,
            apellidos: u.lastname || prev.apellidos,
            correo: u.emailPersonal || u.email || prev.correo,
            celular: u.number || prev.celular,
            direccion: u.located || prev.direccion,
            documentoIdentidad: u.DNI || prev.documentoIdentidad,
            fechaNacimiento: u.dateB || prev.fechaNacimiento,
            movilidad: u.Movilidad || prev.movilidad,
            contactoEmergencia: u.numberE || prev.contactoEmergencia,
            estadoCivil: u.status || prev.estadoCivil,
          }))
        }
      })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])
  const [editingField, setEditingField] = useState<string | null>(null)

  // Helper to safely render values that may be Firestore Timestamps or Dates
  const display = (val: any) => {
    if (val === null || val === undefined) return ''
    if (typeof val === 'object' && 'seconds' in val && 'nanoseconds' in val) {
      try { return new Date(val.seconds * 1000).toLocaleDateString() } catch (e) { return String(val) }
    }
    if (val instanceof Date) return val.toLocaleDateString()
    return String(val)
  }

  // Small skeleton component for fields
  const FieldSkeleton = ({ width = 'w-48', height = 'h-4' } : { width?: string; height?: string }) => (
    <div className={`animate-pulse ${width} ${height} rounded bg-gray-200`} />
  )

  const startEdit = (section: 'contact' | 'personal' | 'other') => {
    setEditing(prev => ({ ...prev, [section]: true }))
  }
  const cancelEdit = (section: 'contact' | 'personal' | 'other') => {
    setEditing(prev => ({ ...prev, [section]: false }))
  }

  const saveUpdates = useCallback(async (updates: Record<string, any>) : Promise<{ok:boolean, message?:string}> => {
  if (!userUid) return { ok: false, message: 'No se pudo identificar al usuario' }
  setSaving(true)
    try {
      const firebaseApp = (await import('@/lib/firebaseClient')).default
      const { getFirestore, doc, getDoc, updateDoc, setDoc } = await import('firebase/firestore')
      const db = getFirestore(firebaseApp as any)
      const userRef = doc(db, 'users', userUid)
      const existing = await getDoc(userRef)
      if (existing.exists()) {
        await updateDoc(userRef, updates)
      } else {
        await setDoc(userRef, updates)
      }

      // Update local state mapping fields we care about
      setProfile(prev => ({
        ...prev,
        nombres: updates.name || updates.nombres || prev.nombres,
        apellidos: updates.lastname || updates.apellidos || prev.apellidos,
        correo: updates.email || updates.correo || prev.correo,
        celular: updates.number || updates.celular || prev.celular,
        direccion: updates.direccion || prev.direccion,
      }))

      return { ok: true }
    } catch (err: any) {
      console.error('save profile error', err)
      return { ok: false, message: err?.message }
    } finally {
      setSaving(false)
    }
  }, [userUid])

  return (
    <div>
  <h1 className="mb-2 text-2xl font-bold">Información personal</h1>
  <p className="mb-6 text-gray-600">Revisa y agrega tus datos personales para seguir en contacto.</p>

      {/* Editable Contact Info */}
      <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between border-b pb-4">
          <div>
            <p className="font-semibold">Celular</p>
              {!editing.contact ? (
                loading ? <FieldSkeleton width="h-4.5 w-40" /> : <p className="text-gray-700" data-testid="profile-celular-value">{display(profile.celular)}</p>
            ) : (
              <input data-testid="profile-celular-input" aria-label="Celular" placeholder="Ej. 987654321" title="Celular" className="mt-1 w-full rounded border px-3 py-2" value={profile.celular || ''} onChange={(e) => setProfile(prev => ({ ...prev, celular: e.target.value }))} />
            )}
          </div>
          {!editing.contact ? (
            <button data-testid="profile-celular-edit" disabled={loading} className={`text-blue-600 hover:underline ${loading ? 'opacity-40 cursor-not-allowed' : ''}`} onClick={() => startEdit('contact')}>Editar</button>
          ) : (
            <div className="flex gap-2">
              <button data-testid="profile-celular-save" className="text-blue-600 hover:underline" onClick={async () => { const r = await saveUpdates({ number: profile.celular }); if (r.ok) cancelEdit('contact') }}>Guardar</button>
              <button data-testid="profile-celular-cancel" className="text-gray-500 hover:underline" onClick={() => cancelEdit('contact')}>Cancelar</button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold">Correo (personal)</p>
              {!editing.contact ? (
                loading ? <FieldSkeleton width="h-4.5 w-56" /> : <p className="text-gray-700" data-testid="profile-correo-value">{display(profile.correo)}</p>
            ) : (
              <input data-testid="profile-correo-input" aria-label="Correo personal" placeholder="tu@correo.com" title="Correo personal" className="mt-1 w-full rounded border px-3 py-2" value={profile.correo || ''} onChange={(e) => setProfile(prev => ({ ...prev, correo: e.target.value }))} />
            )}
          </div>
          {!editing.contact ? (
            <button data-testid="profile-correo-edit" className="text-blue-600 hover:underline" onClick={() => startEdit('contact')}>Editar</button>
          ) : (
            <div className="flex gap-2">
              <button data-testid="profile-correo-save" className="text-blue-600 hover:underline" onClick={async () => { const r = await saveUpdates({ emailPersonal: profile.correo }); if (r.ok) cancelEdit('contact') }}>Guardar</button>
              <button data-testid="profile-correo-cancel" className="text-gray-500 hover:underline" onClick={() => cancelEdit('contact')}>Cancelar</button>
            </div>
          )}
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
        {!editing.personal ? (
          loading ? <FieldSkeleton width="h-4.5 w-48" /> : <p className="text-gray-700">{display(profile.nombres)}</p>
            ) : (
              <input aria-label="Nombres" placeholder="Nombres" title="Nombres" className="mt-1 w-full rounded border px-3 py-2" value={profile.nombres || ''} onChange={(e) => setProfile(prev => ({ ...prev, nombres: e.target.value }))} />
            )}
          </div>

          <div>
            <p className="font-semibold">Apellidos</p>
            {!editing.personal ? (
              loading ? <FieldSkeleton width="h-4.5 w-48" /> : <p className="text-gray-700">{display(profile.apellidos)}</p>
            ) : (
              <input aria-label="Apellidos" placeholder="Apellidos" title="Apellidos" className="mt-1 w-full rounded border px-3 py-2" value={profile.apellidos || ''} onChange={(e) => setProfile(prev => ({ ...prev, apellidos: e.target.value }))} />
            )}
          </div>

          <div>
            <p className="font-semibold">Documento de identidad</p>
            {loading ? <FieldSkeleton width="h-4.5 w-36" /> : <p className="text-gray-700">{display(profile.documentoIdentidad)}</p>}
          </div>

          <div>
            <p className="font-semibold">Fecha de nacimiento</p>
            {loading ? <FieldSkeleton width="h-4.5 w-36" /> : <p className="text-gray-700">{display(profile.fechaNacimiento)}</p>}
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
          {!editing.personal ? (
            <div className="mt-3">
              <button className="text-blue-600 hover:underline" onClick={() => startEdit('personal')}>Editar Nombres/Apellidos</button>
            </div>
          ) : (
            <div className="mt-3 flex gap-2">
              <button className="text-blue-600 hover:underline" onClick={async () => { const r = await saveUpdates({ name: profile.nombres, lastname: profile.apellidos }); if (r.ok) cancelEdit('personal') }}>Guardar</button>
              <button className="text-gray-500 hover:underline" onClick={() => cancelEdit('personal')}>Cancelar</button>
            </div>
          )}
        </div>
      </div>

      {/* Additional Editable Fields */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-semibold">Estado Civil</p>
              {!editing.other ? (
                loading ? <FieldSkeleton width="h-4.5 w-40" /> : <p className="text-gray-700">{display(profile.estadoCivil)}</p>
              ) : (
                <input aria-label="Estado Civil" placeholder="Estado civil" title="Estado civil" className="mt-1 w-full rounded border px-3 py-2" value={profile.estadoCivil || ''} onChange={(e) => setProfile(prev => ({ ...prev, estadoCivil: e.target.value }))} />
              )}
            </div>
            {!editing.other ? (
              <button className="text-blue-600 hover:underline" onClick={() => startEdit('other')}>Editar</button>
            ) : null}
          </div>

          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-semibold">Dirección de domicilio</p>
              {!editing.other ? (
                loading ? <FieldSkeleton width="h-4.5 w-72" /> : <p className="text-gray-700">{display(profile.direccion)}</p>
              ) : (
                <input aria-label="Dirección" placeholder="Dirección" title="Dirección" className="mt-1 w-full rounded border px-3 py-2" value={profile.direccion || ''} onChange={(e) => setProfile(prev => ({ ...prev, direccion: e.target.value }))} />
              )}
            </div>
            {!editing.other ? (
              <button className="text-blue-600 hover:underline" onClick={() => startEdit('other')}>Editar</button>
            ) : null}
          </div>

          <div className="mb-4 flex items-center justify-between border-b pb-4">
            <div>
              <p className="font-semibold">Movilidad</p>
              {!editing.other ? (
                loading ? <FieldSkeleton width="h-4.5 h-4.5w-40" /> : <p className="text-gray-700">{display(profile.movilidad)}</p>
              ) : (
                <input aria-label="Movilidad" placeholder="Movilidad" title="Movilidad" className="mt-1 w-full rounded border px-3 py-2" value={profile.movilidad || ''} onChange={(e) => setProfile(prev => ({ ...prev, movilidad: e.target.value }))} />
              )}
            </div>
            {!editing.other ? (
              <button className="text-blue-600 hover:underline" onClick={() => startEdit('other')}>Editar</button>
            ) : null}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Contacto de emergencia</p>
              {!editing.other ? (
                loading ? <FieldSkeleton width="h-4.5 h-4.5w-40" /> : <p className="text-gray-700">{display(profile.contactoEmergencia)}</p>
              ) : (
                <input aria-label="Contacto de emergencia" placeholder="Contacto de emergencia" title="Contacto de emergencia" className="mt-1 w-full rounded border px-3 py-2" value={profile.contactoEmergencia || ''} onChange={(e) => setProfile(prev => ({ ...prev, contactoEmergencia: e.target.value }))} />
              )}
            </div>
            {!editing.other ? (
              <button className="text-blue-600 hover:underline" onClick={() => startEdit('other')}>Editar</button>
            ) : null}
          </div>

          {editing.other ? (
            <div className="mt-4 flex gap-2">
              <button className="text-blue-600 hover:underline" onClick={async () => {
                const updates: Record<string, any> = {
                  status: profile.estadoCivil || null,
                  located: profile.direccion || null,
                  Movilidad: profile.movilidad || null,
                  numberE: profile.contactoEmergencia || null,
                }
                const r = await saveUpdates(updates)
                if (r.ok) cancelEdit('other')
              }}>Guardar</button>
              <button className="text-gray-500 hover:underline" onClick={() => cancelEdit('other')}>Cancelar</button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
