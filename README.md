# hide. 🔐

> Esconde o teu dinheiro de ti mesmo!

Bloqueia montantes até uma data específica. Sem acesso. Sem tentações.

---

## Stack

- **Next.js 14** (App Router)
- **Clerk** — autenticação
- **Supabase** — base de dados
- **Tailwind CSS** — estilos

---

## Setup em 5 minutos

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.local.example .env.local
```

Preenche com:

**Clerk** → https://clerk.com
- Cria uma app
- Copia `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` e `CLERK_SECRET_KEY`

**Supabase** → https://supabase.com
- Cria um projeto
- Copia `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Criar tabela no Supabase

No SQL Editor do Supabase, corre o ficheiro `supabase-schema.sql`.

### 4. Arrancar

```bash
npm run dev
```

Abre http://localhost:3000

---

## Funcionalidades MVP

- ✅ Login / registo com Clerk
- ✅ Criar cofre com nome, valor, data e categoria
- ✅ Dashboard com total bloqueado
- ✅ Countdown até à data de liberação
- ✅ Botão de emergência com cooldown de 60 segundos
- ✅ Histórico de cofres liberados

## Roadmap

- [ ] Open Banking (Nordigen) — detecção automática do salário
- [ ] Notificações push quando o cofre abre
- [ ] Custódia cripto (EURC na Solana)
- [ ] Modo empresa (IVA, salários, fornecedores)
- [ ] App mobile (React Native)

---

## Deploy

```bash
# Vercel (recomendado)
npx vercel

# Ou push para GitHub e conecta no Vercel dashboard
```

---

*hide. — o teu dinheiro, no lugar certo, na hora certa.*
