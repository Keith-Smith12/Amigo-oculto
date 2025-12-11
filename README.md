# 🎁 Amigo Oculto

Uma aplicação web moderna para organizar o teu amigo oculto de forma simples e divertida!

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-Database-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## ✨ Funcionalidades

- 👥 **Gestão de Amigos** - Adiciona e organiza a tua lista de amigos
- 🎁 **Ideias de Presentes** - Guarda ideias de presentes para cada amigo
- 👪 **Criação de Grupos** - Cria grupos para organizar eventos de amigo oculto
- 🎲 **Sorteio Automático** - Faz o sorteio de forma justa e automática
- 📝 **Lista de Desejos** - Partilha a tua wishlist com o grupo
- 🔐 **Autenticação Segura** - Login com email/password ou Google

## 🚀 Começar

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Conta no [Supabase](https://supabase.com)

### Instalação

1. **Clona o repositório**
```bash
cd amigo-oculto
```

2. **Instala as dependências**
```bash
npm install
```

3. **Configura o Supabase**

   - Cria um novo projeto no [Supabase](https://supabase.com)
   - Vai a SQL Editor e executa o schema em `supabase/schema.sql`
   - Copia as credenciais do projeto

4. **Configura as variáveis de ambiente**
```bash
cp .env.local.example .env.local
```

Edita o ficheiro `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

5. **Inicia o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Abre no browser**
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
amigo-oculto/
├── src/
│   ├── app/                 # App Router (Next.js 14)
│   │   ├── amigos/         # Página de gestão de amigos
│   │   ├── grupos/         # Página de grupos
│   │   ├── presentes/      # Página de ideias de presentes
│   │   ├── sorteio/        # Página de sorteio
│   │   ├── wishlist/       # Página de lista de desejos
│   │   ├── login/          # Página de login
│   │   ├── registar/       # Página de registo
│   │   ├── layout.tsx      # Layout principal
│   │   ├── page.tsx        # Página inicial
│   │   └── globals.css     # Estilos globais
│   ├── components/         # Componentes reutilizáveis
│   ├── lib/                # Utilitários e configurações
│   │   └── supabase.ts     # Cliente Supabase
│   └── types/              # Tipos TypeScript
│       ├── index.ts
│       └── database.ts     # Tipos do Supabase
├── public/                 # Assets estáticos
├── supabase/
│   └── schema.sql          # Schema da base de dados
├── tailwind.config.ts      # Configuração Tailwind
├── next.config.js          # Configuração Next.js
└── package.json
```

## 🗄️ Schema da Base de Dados

O projeto usa as seguintes tabelas no Supabase:

- **users** - Informação dos utilizadores
- **friends** - Lista de amigos de cada utilizador
- **gift_ideas** - Ideias de presentes por amigo
- **groups** - Grupos de amigo oculto
- **group_members** - Participantes de cada grupo
- **draw_results** - Resultados dos sorteios
- **wishlists** - Listas de desejos dos utilizadores

## 🎨 Tecnologias

- **[Next.js 14](https://nextjs.org/)** - Framework React com App Router
- **[Supabase](https://supabase.com/)** - Backend as a Service (Postgres + Auth)
- **[Tailwind CSS](https://tailwindcss.com/)** - Framework CSS utilitário
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript tipado
- **[React Icons](https://react-icons.github.io/react-icons/)** - Ícones
- **[React Hot Toast](https://react-hot-toast.com/)** - Notificações

## 📝 Scripts Disponíveis

```bash
npm run dev      # Servidor de desenvolvimento
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificar código
```

## 🔒 Segurança

- Autenticação gerida pelo Supabase Auth
- Row Level Security (RLS) nas tabelas
- Passwords encriptadas
- Variáveis de ambiente para credenciais sensíveis

## 🤝 Contribuir

Contribuições são bem-vindas! Por favor:

1. Faz fork do projeto
2. Cria uma branch para a tua feature (`git checkout -b feature/nova-feature`)
3. Commit das alterações (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abre um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Vê o ficheiro [LICENSE](LICENSE) para mais detalhes.

## 🎄 Feito com ❤️

Criado para tornar o Natal mais especial e organizado!

---

**Boas Festas!** 🎅🎁🎄# Amigo-oculto
