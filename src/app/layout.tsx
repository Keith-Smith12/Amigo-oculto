import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Amigo Oculto | Secret Santa',
  description: 'Organize seu amigo oculto de forma fácil e divertida! Crie grupos, adicione amigos, faça o sorteio e gerencie listas de presentes.',
  keywords: ['amigo oculto', 'secret santa', 'sorteio', 'presentes', 'natal', 'amigos'],
  authors: [{ name: 'Amigo Oculto App' }],
  openGraph: {
    title: 'Amigo Oculto | Secret Santa',
    description: 'Organize seu amigo oculto de forma fácil e divertida!',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-christmas-red/10 via-white to-christmas-green/10">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          {children}
        </div>
      </body>
    </html>
  );
}
