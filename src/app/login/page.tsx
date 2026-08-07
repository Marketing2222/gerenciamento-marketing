'use client'

import { useState } from 'react'
import { useUser } from '@/context/UserContext'
import { useData } from '@/context/DataContext'
import { LogIn, Key, Loader2, Sparkles, Database } from 'lucide-react'
import Avatar from '@/components/Avatar'

export default function LoginPage() {
  const { login } = useUser()
  const { users, loaded, seed } = useData()
  const [selectedUser, setSelectedUser] = useState<(typeof users)[number] | null>(null)
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [seeding, setSeeding] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState('')

  const handleSeed = async () => {
    setSeeding(true)
    setSeedSuccess('')
    setError('')
    try {
      await seed()
      setSeedSuccess('Banco de dados inicializado com sucesso!')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError('Erro ao rodar o seed: ' + message)
    } finally {
      setSeeding(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !pin) return

    setLoading(true)
    setError('')
    const res = await login(selectedUser.id, pin)
    setLoading(false)

    if (!res.success) {
      setError(res.error || 'PIN incorreto. Tente novamente.')
      setPin('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative overflow-hidden select-none">
      {/* Background gradients for premium feel */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-blue-900/20 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-violet-900/20 blur-[120px]" />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 mb-4 animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">
            Marketing Kanban
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Selecione seu perfil para acessar o gerenciador
          </p>
        </div>

        {error && (
          <div className="bg-red-950/50 border border-red-500/40 text-red-300 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        {seedSuccess && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 p-3 rounded-lg text-sm mb-6 text-center">
            {seedSuccess}
          </div>
        )}

        {!loaded ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
            <p className="text-slate-400 text-sm">Carregando usuários...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-slate-400 text-sm mb-4">
              Nenhum usuário cadastrado. Inicialize o banco de dados para começar.
            </p>
            <button
              onClick={handleSeed}
              disabled={seeding}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              {seeding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Database className="w-4 h-4" />
              )}
              {seeding ? 'Inicializando...' : 'Inicializar Banco de Dados'}
            </button>
          </div>
        ) : !selectedUser ? (
          <div className="grid grid-cols-2 gap-4">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u)}
                className="flex flex-col items-center p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700 transition duration-300 text-center group cursor-pointer"
              >
                <div className="relative mb-3">
                  <Avatar name={u.name} url={u.avatarUrl} size="2xl" className="border-2 border-slate-700 group-hover:border-blue-500 transition duration-300" />
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 opacity-0 group-hover:opacity-100 transition duration-300" />
                </div>
                <h3 className="font-semibold text-slate-200 text-sm group-hover:text-white line-clamp-1">
                  {u.name}
                </h3>
                <p className="text-slate-500 text-xs mt-1">
                  {u.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-800/40 border border-slate-800 rounded-xl mb-4">
              <Avatar name={selectedUser.name} url={selectedUser.avatarUrl} size="xl" className="border border-slate-700" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-200 text-sm truncate">
                  {selectedUser.name}
                </h3>
                <p className="text-slate-400 text-xs truncate">
                  {selectedUser.role === 'DESIGNER' ? 'Designer' : 'Gestor de Tráfego'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedUser(null)
                  setPin('')
                  setError('')
                }}
                className="text-xs text-blue-400 hover:text-blue-300 transition"
              >
                Alterar
              </button>
            </div>

            <div className="space-y-1">
              <label htmlFor="pin-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Digite seu PIN
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="pin-input"
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg outline-none text-slate-200 tracking-widest text-center text-lg placeholder-slate-700"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Dica: O PIN padrão definido pelo seed é <span className="font-mono font-bold text-slate-400">1234</span>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !pin}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800/80 text-white py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition duration-300 shadow-lg shadow-blue-600/10 cursor-pointer"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              Entrar
            </button>
          </form>
        )}
      </div>
    </div>
  )
}