"use client";

import React, { useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebaseClient';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

export default function DebugAuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<null | { ok: boolean; code?: string; message?: string }>(null);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    try {
      const auth = getFirebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email, password);
      console.log('signed in', cred.user);
      const idToken = await cred.user.getIdToken();

      // Enviar idToken al API para crear sesión en el servidor
      const resp = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      const json = await resp.json().catch(() => ({}));
      console.log('/api/auth/login response', resp, json);
      setResult({ ok: resp.ok, code: String(resp.status), message: JSON.stringify(json) });
    } catch (err: any) {
      console.error('signIn error', err);
      setResult({ ok: false, code: err.code, message: err.message });
    }
  };

  const handleResendVerification = async () => {
    try {
      const auth = getFirebaseAuth();
      const user = auth.currentUser;
      if (!user) {
        setResult({ ok: false, message: 'No user currently signed in' });
        return;
      }
      await sendEmailVerification(user);
      setResult({ ok: true, message: 'Verification email sent' });
    } catch (err: any) {
      console.error('sendEmailVerification error', err);
      setResult({ ok: false, code: err.code, message: err.message });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Debug Firebase Auth (Cliente)</h1>
      <p className="mt-2">Ingresa el email y contraseña que creaste en Firebase Auth para ver el error exacto.</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-sm">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className="border p-2 w-full" />
        </div>
        <div>
          <label className="block text-sm">Password</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="border p-2 w-full" />
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white">Probar login</button>
      </form>

      {result && (
        <div className="mt-4">
          <h3 className="font-medium">Resultado</h3>
          <pre className="bg-gray-100 p-3 mt-2">{JSON.stringify(result, null, 2)}</pre>
          {result && result.message && result.message.includes('Email not verified') && (
            <div className="mt-3">
              <button onClick={handleResendVerification} className="px-3 py-2 bg-yellow-500 text-black">Reenviar correo de verificación</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
