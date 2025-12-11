"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FaGift,
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import toast from "react-hot-toast";
import { supabase } from "@/lib/supabase";

export default function RegistarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    confirmEmail: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "O nome é obrigatório";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "O nome deve ter pelo menos 2 caracteres";
    }

    if (!formData.email.trim()) {
      newErrors.email = "O email é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    if (!formData.confirmEmail.trim()) {
      newErrors.confirmEmail = "Confirma o teu email";
    } else if (formData.email !== formData.confirmEmail) {
      newErrors.confirmEmail = "Os emails não coincidem";
    }

    if (!formData.password) {
      newErrors.password = "A password é obrigatória";
    } else if (formData.password.length < 6) {
      newErrors.password = "A password deve ter pelo menos 6 caracteres";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirma a tua password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "As passwords não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      });

      if (authError) {
        throw authError;
      }

      if (authData.user) {
        // Create user profile in users table
        const { error: profileError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
        });

        if (profileError) {
          console.error("Profile creation error:", profileError);
          // Continue anyway as the auth user was created
        }

        toast.success("Conta criada com sucesso! Bem-vindo ao Amigo Oculto!");

        // Redirecionar direto para o dashboard (sem necessidade de confirmação de email)
        router.push("/grupos");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      if (error.message.includes("already registered")) {
        toast.error("Este email já está registado");
      } else {
        toast.error(error.message || "Erro ao criar conta. Tenta novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <FaGift className="w-10 h-10 text-yellow-400" />
            <span className="text-3xl font-bold text-white">Amigo Oculto</span>
          </Link>
        </div>

        {/* Registration Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white text-center mb-6">
            Criar Conta
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Nome
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="O teu nome"
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${
                    errors.name ? "border-red-400" : "border-white/20"
                  } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-300">{errors.name}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="o.teu@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${
                    errors.email ? "border-red-400" : "border-white/20"
                  } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-300">{errors.email}</p>
              )}
            </div>

            {/* Confirm Email Field */}
            <div>
              <label
                htmlFor="confirmEmail"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Confirmar Email
              </label>
              <div className="relative">
                <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  id="confirmEmail"
                  name="confirmEmail"
                  value={formData.confirmEmail}
                  onChange={handleChange}
                  placeholder="o.teu@email.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/10 border ${
                    errors.confirmEmail ? "border-red-400" : "border-white/20"
                  } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition`}
                />
              </div>
              {errors.confirmEmail && (
                <p className="mt-1 text-sm text-red-300">
                  {errors.confirmEmail}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border ${
                    errors.password ? "border-red-400" : "border-white/20"
                  } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-300">{errors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-white/80 mb-1"
              >
                Confirmar Password
              </label>
              <div className="relative">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-12 py-3 bg-white/10 border ${
                    errors.confirmPassword
                      ? "border-red-400"
                      : "border-white/20"
                  } rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-300">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  A criar conta...
                </span>
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">ou</span>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-white/80">
            Já tens conta?{" "}
            <Link
              href="/login"
              className="text-yellow-400 hover:text-yellow-300 font-semibold transition"
            >
              Entra aqui
            </Link>
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-white/60 text-sm mt-6">
          Ao criar conta, aceitas os nossos{" "}
          <Link href="/termos" className="underline hover:text-white">
            Termos de Serviço
          </Link>{" "}
          e{" "}
          <Link href="/privacidade" className="underline hover:text-white">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </main>
  );
}
