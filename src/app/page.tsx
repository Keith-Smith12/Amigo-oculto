'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FaGift, FaUsers, FaUserFriends, FaRandom, FaListAlt, FaSnowflake } from 'react-icons/fa';
import { supabase } from '@/lib/supabase';
import { User } from '@/types/database';
import AdSense from '@/components/AdSense';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setUser(data);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: <FaUserFriends className="w-8 h-8" />,
      title: 'Gerir Amigos',
      description: 'Adiciona e organiza a tua lista de amigos para o amigo oculto.',
      href: '/amigos',
      color: 'bg-blue-500',
    },
    {
      icon: <FaGift className="w-8 h-8" />,
      title: 'Ideias de Presentes',
      description: 'Guarda ideias de presentes para cada amigo.',
      href: '/presentes',
      color: 'bg-pink-500',
    },
    {
      icon: <FaUsers className="w-8 h-8" />,
      title: 'Criar Grupos',
      description: 'Cria grupos para organizar o teu amigo oculto.',
      href: '/grupos',
      color: 'bg-green-500',
    },
    {
      icon: <FaRandom className="w-8 h-8" />,
      title: 'Sortear',
      description: 'Faz o sorteio automático do amigo oculto.',
      href: '/sorteio',
      color: 'bg-purple-500',
    },
    {
      icon: <FaListAlt className="w-8 h-8" />,
      title: 'Lista de Desejos',
      description: 'Partilha a tua lista de desejos com o grupo.',
      href: '/wishlist',
      color: 'bg-yellow-500',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 via-red-700 to-green-700">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-white"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-600 via-red-700 to-green-700">
      {/* Snowflakes decoration */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <FaSnowflake
            key={i}
            className="absolute text-white/20 animate-bounce-slow"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              fontSize: `${Math.random() * 20 + 10}px`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 py-6 px-4">
        <nav className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <FaGift className="w-8 h-8 text-yellow-400" />
            <span className="text-2xl font-bold text-white">Amigo Oculto</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <span className="text-white/80">Olá, {user.name}!</span>
                <Link
                  href="/perfil"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                >
                  Perfil
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-white hover:text-yellow-400 transition"
                >
                  Entrar
                </Link>
                <Link
                  href="/registar"
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-semibold rounded-lg transition"
                >
                  Registar
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in">
            🎁 Amigo Oculto
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 animate-slide-up">
            Organiza o teu amigo oculto de forma simples e divertida!
            Adiciona amigos, cria grupos e faz o sorteio automaticamente.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {user ? (
              <Link
                href="/grupos"
                className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Criar Grupo
              </Link>
            ) : (
              <>
                <Link
                  href="/registar"
                  className="px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all"
                >
                  Começar Agora
                </Link>
                <Link
                  href="/como-funciona"
                  className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl transition-all"
                >
                  Como Funciona?
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Funcionalidades
          </h2>
          
          {/* AdSense Banner */}
          <div className="mb-8 flex justify-center">
            <AdSense 
              adSlot="1234567890" 
              className="w-full max-w-[728px] h-[90px]"
              style={{ width: '728px', height: '90px' }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Link
                key={index}
                href={user ? feature.href : '/login'}
                className="group p-6 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all hover:transform hover:-translate-y-2 hover:shadow-xl"
              >
                <div
                  className={`${feature.color} w-16 h-16 rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-white/70">{feature.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 py-16 px-4 bg-black/20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Como Funciona?
          </h2>
          
          {/* AdSense Square Ad */}
          <div className="mb-8 flex justify-center">
            <AdSense 
              adSlot="0987654321" 
              className="w-full max-w-[336px] h-[280px]"
              style={{ width: '336px', height: '280px' }}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Regista-te', desc: 'Cria a tua conta gratuita' },
              { step: '2', title: 'Adiciona Amigos', desc: 'Adiciona os participantes' },
              { step: '3', title: 'Cria um Grupo', desc: 'Organiza o evento' },
              { step: '4', title: 'Sorteia!', desc: 'Faz o sorteio automático' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-yellow-500 rounded-full flex items-center justify-center text-2xl font-bold text-gray-900 mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 border-t border-white/10">
        <div className="max-w-6xl mx-auto text-center text-white/60">
          <p>
            🎄 Amigo Oculto © {new Date().getFullYear()} - Feito com ❤️ para tornar o Natal mais especial
          </p>
        </div>
      </footer>
    </main>
  );
}
