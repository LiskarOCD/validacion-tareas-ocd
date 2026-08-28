import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LockKeyhole, Mail, Loader2 } from 'lucide-react';
import { OcdLogo } from './OcdLogo';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export function LoginPage({
  onLoginSuccess,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState('');

  const handleSubmit = async (
    event: React.FormEvent
  ) => {
    event.preventDefault();

    setErrorMessage('');
    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      onLoginSuccess();
    } catch (error: any) {
      console.error(error);

      setErrorMessage(
        error?.message ===
          'Invalid login credentials'
          ? 'Correo o contraseña incorrectos.'
          : 'No se pudo iniciar sesión. Verificá tus datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

      <div className="w-full max-w-md">

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">

          <div className="bg-[#071D38] px-8 py-8 text-center">

            <div className="flex justify-center mb-5">
              <OcdLogo
                variant="pill"
                className="h-16"
              />
            </div>

            <h1 className="text-white text-xl font-bold">
              Validación de Tareas
            </h1>

            <p className="text-[#9ED9EA] text-sm mt-2">
              Auditoría Comercial OCD
            </p>

          </div>

          <form
            onSubmit={handleSubmit}
            className="p-8 space-y-5"
          >

            <div>
              <label className="block text-sm font-semibold text-[#0B2F5B] mb-2">
                Correo
              </label>

              <div className="relative">

                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="tu-correo@ocd.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B98BA]"
                />

              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#0B2F5B] mb-2">
                Contraseña
              </label>

              <div className="relative">

                <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2B98BA]"
                />

              </div>
            </div>

            {errorMessage && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2B98BA] hover:bg-[#2384A3] disabled:opacity-60 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >

              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Iniciar sesión'
              )}

            </button>

          </form>

          <div className="px-8 pb-6 text-center text-xs text-slate-400">
            Oeste Centro de Distribución
          </div>

        </div>

      </div>

    </div>
  );
}
