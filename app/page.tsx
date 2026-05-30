import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const { userId } = await auth()
  if (userId) redirect('/dashboard')

  return (
    <main className="noise min-h-screen flex flex-col" style={{ background: 'var(--ink)' }}>
      {/* Grid background */}
      <div className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(var(--muted) 1px, transparent 1px), linear-gradient(90deg, var(--muted) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }}
      />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <span className="text-2xl font-display font-800 tracking-tight" style={{ fontFamily: 'var(--font-display)', fontWeight: 800 }}>
          hide.
        </span>
        <div className="flex gap-4">
          <Link href="/sign-in"
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)' }}
          >
            entrar
          </Link>
          <Link href="/sign-up"
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{
              background: 'var(--accent)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontWeight: 500
            }}
          >
            começar
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-8"
            style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)', color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse-green" style={{ background: 'var(--accent)' }} />
            MVP — beta fechado
          </div>
        </div>

        <h1 className="animate-slide-up text-6xl md:text-8xl font-800 tracking-tight leading-none mb-6"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 800, animationDelay: '100ms', opacity: 0 }}>
          Esconde o teu<br />
          <span style={{ color: 'var(--accent)' }}>dinheiro</span><br />
          de ti mesmo.
        </h1>

        <p className="animate-slide-up text-lg max-w-md mb-10"
          style={{ color: 'var(--ghost)', fontFamily: 'var(--font-body)', animationDelay: '200ms', opacity: 0 }}>
          Bloqueia o dinheiro do aluguel, impostos ou qualquer compromisso.
          Não acedes até à data. Sem exceções.
        </p>

        <div className="animate-slide-up flex gap-4" style={{ animationDelay: '300ms', opacity: 0 }}>
          <Link href="/sign-up"
            className="px-8 py-4 rounded-xl text-base font-500 transition-all hover:scale-105"
            style={{
              background: 'var(--accent)',
              color: 'var(--ink)',
              fontFamily: 'var(--font-body)',
              fontWeight: 600
            }}>
            Criar cofre grátis
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-8 py-20 max-w-4xl mx-auto w-full">
        <h2 className="text-2xl font-700 mb-12 text-center" style={{ fontFamily: 'var(--font-display)', color: 'var(--ghost)' }}>
          como funciona
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: '01', title: 'Define o cofre', desc: 'Nome, valor, e a data em que o dinheiro deve estar disponível.' },
            { step: '02', title: 'Bloqueia', desc: 'O montante fica invisível. Não aparece no teu saldo disponível.' },
            { step: '03', title: 'Libera na data', desc: 'No dia certo, o cofre abre automaticamente. Nem antes, nem depois.' },
          ].map((item, i) => (
            <div key={i} className="p-6 rounded-2xl vault-glow"
              style={{ background: 'var(--locked)' }}>
              <div className="text-xs mb-4" style={{ color: 'var(--accent)', fontFamily: 'var(--font-body)' }}>{item.step}</div>
              <h3 className="text-lg font-700 mb-2" style={{ fontFamily: 'var(--font-display)' }}>{item.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--ghost)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 px-8 py-6 text-center text-xs" style={{ color: 'var(--muted)', fontFamily: 'var(--font-body)' }}>
        hide. — o teu dinheiro, no lugar certo, na hora certa.
      </footer>
    </main>
  )
}
