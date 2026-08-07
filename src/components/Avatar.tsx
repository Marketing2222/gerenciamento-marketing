'use client'

const COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-pink-500',
  'bg-teal-500',
  'bg-orange-500',
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return (parts[0][0] || '?').toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function pickColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return COLORS[hash % COLORS.length]
}

interface AvatarProps {
  name: string
  url?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'
  className?: string
}

const SIZES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'w-5 h-5 text-[8px]',
  sm: 'w-6 h-6 text-[9px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-9 h-9 text-sm',
  xl: 'w-12 h-12 text-base',
  '2xl': 'w-20 h-20 text-2xl',
  '3xl': 'w-28 h-28 text-3xl',
}

export default function Avatar({ name, url, size = 'md', className = '' }: AvatarProps) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`rounded-full object-cover bg-slate-100 border border-slate-200 dark:border-slate-800 shrink-0 ${SIZES[size]} ${className}`}
      />
    )
  }

  return (
    <div
      className={`${pickColor(name)} rounded-full flex items-center justify-center text-white font-bold shrink-0 overflow-hidden ${SIZES[size]} ${className}`}
      title={name}
    >
      <span className="leading-none text-center block w-full">{getInitials(name)}</span>
    </div>
  )
}
