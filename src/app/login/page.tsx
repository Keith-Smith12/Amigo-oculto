'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaGift, FaEnvelope, FaLock, FaGoogle, FaSpinner } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Por favor, preenche todos os campos');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou password incorretos');
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        toast.success('Login efetuado com sucesso!');
        router.push('/grupos');
        router.refresh();
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Erro ao fazer login. Tenta novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        toast.error('Erro ao fazer login com Google');
        console.error('Google login error:', error);
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Erro ao fazer login com Google');
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Por favor, insere o teu email');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        toast.error('Erro ao enviar email de recuperação');
        return;
      }

      toast.success('Email de recuperação enviado! Verifica a tua caixa de entrada.');
      setShowForgotPassword(false);
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Erro ao enviar email de recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-6xl opacity-10">🎁</div>
        <div className="absolute top-20 right-20 text-4xl opacity-10">🎄</div>
        <div className="absolute bottom-20 left-20 text-5xl opacity-10">⭐</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-10">🎅</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white">
            <FaGift className="w-10 h-10 text-yellow-400" />
            <span className="text-3xl font-bold">Amigo Oculto</span>
          </Link>
          <p className="text-white/80 mt-2">
            {showForgotPassword ? 'Recuperar password' : 'Entra na tua conta'}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8">
          {showForgotPassword ? (
            /* Forgot Password Form */
            <form onSubmit={handleForgotPassword} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o-teu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    A enviar...
                  </>
                ) : (
                  'Enviar email de recuperação'
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowForgotPassword(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-red-600 transition"
              >
                ← Voltar ao login
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="o-teu@email.com"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-red-600 hover:text-red-800 transition"
                >
                  Esqueceste a password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    A entrar...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">ou continua com</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3"
              >
                <FaGoogle className="text-red-500" />
                Continuar com Google
              </button>
            </form>
          )}

          {/* Register Link */}
          {!showForgotPassword && (
            <p className="mt-6 text-center text-sm text-gray-600">
              Ainda não tens conta?{' '}
              <Link href="/registar" className="text-red-600 hover:text-red-800 font-semibold transition">
                Regista-te aqui
              </Link>
            </p>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-white/80 hover:text-white transition text-sm">
            ← Voltar à página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
