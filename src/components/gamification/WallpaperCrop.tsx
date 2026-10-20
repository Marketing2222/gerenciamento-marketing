'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { X, ZoomIn, Move } from 'lucide-react'

/**
 * Corta/zoom do papel de parede antes de aplicar.
 * Arraste a imagem, ajuste o zoom e aplique — sai um JPEG 1920x640 (alta qualidade).
 */
export default function WallpaperCrop({
  file,
  onCancel,
  onApply,
}: {
  file: File
  onCancel: () => void
  onApply: (cropped: File) => void
}) {
  const url = useMemo(() => URL.createObjectURL(file), [file])
  const frameRef = useRef<HTMLDivElement>(null)
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null)
  const [frame, setFrame] = useState({ w: 0, h: 0 })
  const [zoom, setZoom] = useState(1)
  const [rawPos, setRawPos] = useState<{ x: number; y: number } | null>(null)
  const dragRef = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)
  const [busy, setBusy] = useState(false)

  // Revisa o blob URL só nas saídas reais (cancelar/aplicar) — nunca no
  // cleanup, senão o StrictMode do dev revoga a imagem antes de exibir.
  const releaseUrl = () => {
    try {
      URL.revokeObjectURL(url)
    } catch {
      // já liberado
    }
  }

  const cancel = () => {
    releaseUrl()
    onCancel()
  }

  useEffect(() => {
    const img = new Image()
    img.onload = () => setNat({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => setNat({ w: 0, h: 0 })
    img.src = url
  }, [url])

  useEffect(() => {
    const el = frameRef.current
    if (!el) return
    const update = () => setFrame({ w: el.clientWidth, h: el.clientHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  // Tamanho exibido: zoom 1 = cobre o frame (cover); zoom > 1 = mais perto.
  const disp = useMemo(() => {
    if (!nat || nat.w <= 0 || nat.h <= 0 || !frame.w || !frame.h) return { w: 0, h: 0 }
    const cover = Math.max(frame.w / nat.w, frame.h / nat.h)
    const scale = cover * zoom
    return { w: nat.w * scale, h: nat.h * scale }
  }, [nat, frame, zoom])

  const clamp = (x: number, y: number) => {
    const minX = Math.min(0, frame.w - disp.w)
    const minY = Math.min(0, frame.h - disp.h)
    return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) }
  }

  // Posição derivada: centraliza no início e mantém a imagem cobrindo o frame.
  const pos = rawPos
    ? clamp(rawPos.x, rawPos.y)
    : disp.w
      ? { x: (frame.w - disp.w) / 2, y: (frame.h - disp.h) / 2 }
      : { x: 0, y: 0 }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y }
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current
    if (!d) return
    setRawPos(clamp(d.px + (e.clientX - d.sx), d.py + (e.clientY - d.sy)))
  }
  const onPointerUp = () => {
    dragRef.current = null
  }

  const apply = () => {
    if (!nat || !frame.w || busy) return
    setBusy(true)
    const OUT_W = 1920
    const OUT_H = 640
    const canvas = document.createElement('canvas')
    canvas.width = OUT_W
    canvas.height = OUT_H
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.onload = () => {
      if (!ctx) {
        setBusy(false)
        return
      }
      const k = OUT_W / frame.w
      ctx.drawImage(img, pos.x * k, pos.y * k, disp.w * k, disp.h * k)
      canvas.toBlob(
        (blob) => {
          setBusy(false)
          if (!blob) return
          releaseUrl()
          onApply(new File([blob], 'wallpaper.jpg', { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92
      )
    }
    img.onerror = () => setBusy(false)
    img.src = url
  }

  return (
    <div
      className="fixed inset-0 z-[100020] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={cancel}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
              Ajustar papel de parede
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Move className="w-3 h-3" /> Arraste para cortar · zoom para aproximar · recorte final 1920×640 px
            </p>
          </div>
          <button
            onClick={cancel}
            className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div
            ref={frameRef}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className="relative w-full aspect-[3/1] rounded-2xl overflow-hidden bg-slate-900 border border-slate-300 dark:border-slate-700 cursor-move touch-none select-none"
          >
            {disp.w > 0 ? (
              <img
                src={url}
                alt=""
                draggable={false}
                className="absolute max-w-none pointer-events-none"
                style={{ width: disp.w, height: disp.h, left: pos.x, top: pos.y }}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-slate-400">
                {nat && nat.w <= 0 ? 'Imagem inválida.' : 'Carregando imagem…'}
              </span>
            )}
            {/* guias de regra dos terços */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
              <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
              <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
              <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <ZoomIn className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-amber-500 cursor-pointer"
            />
            <span className="text-[11px] font-bold text-slate-400 w-10 text-right">
              {zoom.toFixed(1)}x
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={cancel}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={apply}
              disabled={busy || !nat || nat.w <= 0}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition cursor-pointer disabled:opacity-60"
            >
              {busy ? 'Aplicando…' : 'Aplicar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
