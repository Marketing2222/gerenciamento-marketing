'use client'

import React, { useState } from 'react'
import { X, Save, Plus, Trash2 } from 'lucide-react'

interface VideoScheduleModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ScheduleRow {
  id: string
  gravarEm: string
  publicadoEm: string
  setor: string
  colaborador: string
  topico: string
  tipoVideo: string
  assunto: string
  status: string
  videos: string
  bonus: string
  dataFolga: string
  fim: string
}

const mockData: ScheduleRow[] = [
  {
    id: '1',
    gravarEm: '2026-08-05',
    publicadoEm: '',
    setor: 'MARKETING',
    colaborador: 'LETYCYA',
    topico: 'MÊS DOS PAIS',
    tipoVideo: 'COM ROTEIRO',
    assunto: 'Campanha Mês dos Pais',
    status: 'Pronto',
    videos: '1 de 1',
    bonus: 'FOLGA',
    dataFolga: '2026-09-05',
    fim: '',
  },
  {
    id: '2',
    gravarEm: '2026-08-07',
    publicadoEm: '',
    setor: 'MARKETING',
    colaborador: 'LUÍS',
    topico: 'LIVE',
    tipoVideo: 'LIVE',
    assunto: 'Cliente em dias e Aniversariantes de Julho',
    status: 'Pronto',
    videos: '1 de 1',
    bonus: 'PIX',
    dataFolga: '',
    fim: '',
  },
]

export default function VideoScheduleModal({ isOpen, onClose }: VideoScheduleModalProps) {
  const [rows, setRows] = useState<ScheduleRow[]>(mockData)

  if (!isOpen) return null

  // Helper to handle input changes
  const updateRow = (id: string, field: keyof ScheduleRow, value: string) => {
    setRows(rows.map(row => row.id === id ? { ...row, [field]: value } : row))
  }

  const addRow = () => {
    const newRow: ScheduleRow = {
      id: Math.random().toString(36).substr(2, 9),
      gravarEm: '',
      publicadoEm: '',
      setor: 'MARKETING',
      colaborador: '',
      topico: '',
      tipoVideo: '',
      assunto: '',
      status: '',
      videos: '1 de 1',
      bonus: '',
      dataFolga: '',
      fim: '',
    }
    setRows([...rows, newRow])
  }

  const deleteRow = (id: string) => {
    setRows(rows.filter(row => row.id !== id))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      {/* Modal Container */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[1200px] flex flex-col shadow-2xl max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4 flex items-center justify-between shrink-0">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">
            Cronograma de Vídeos - Agosto
          </h2>
          <button
            onClick={onClose}
            className="text-blue-100 hover:text-white hover:bg-blue-700/50 p-1.5 rounded-lg transition"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content (Table) */}
        <div className="flex-1 overflow-auto p-4 bg-slate-50 dark:bg-[#080c17]">
          <div className="min-w-[1000px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-200/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Gravar em:</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Publicado em:</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Setor</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Colaborador</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[140px]">Tópico</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[120px]">Tipo de Vídeo</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold min-w-[200px]">Assunto</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Status</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[80px]">Vídeos</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Bônus</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Data Folga</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-800 font-bold w-[100px]">Fim</th>
                  <th className="p-2 font-bold w-[40px]"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <input type="date" value={row.gravarEm} onChange={(e) => updateRow(row.id, 'gravarEm', e.target.value)} className="w-full bg-transparent outline-none font-semibold text-slate-800 dark:text-slate-200" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <input type="date" value={row.publicadoEm} onChange={(e) => updateRow(row.id, 'publicadoEm', e.target.value)} className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <select value={row.setor} onChange={(e) => updateRow(row.id, 'setor', e.target.value)} className="w-full bg-transparent outline-none text-slate-500 dark:text-slate-400">
                        <option value="MARKETING">MARKETING</option>
                        <option value="VENDAS">VENDAS</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <select value={row.colaborador} onChange={(e) => updateRow(row.id, 'colaborador', e.target.value)} className="w-full bg-slate-700 text-white font-bold rounded px-1 outline-none">
                        <option value="">Selecione...</option>
                        <option value="LETYCYA">LETYCYA</option>
                        <option value="LUÍS">LUÍS</option>
                        <option value="ANA">ANA</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <input type="text" value={row.topico} onChange={(e) => updateRow(row.id, 'topico', e.target.value)} className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200" placeholder="Ex: LIVE" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <select value={row.tipoVideo} onChange={(e) => updateRow(row.id, 'tipoVideo', e.target.value)} className="w-full bg-transparent outline-none font-bold text-slate-800 dark:text-slate-200">
                        <option value="COM ROTEIRO">COM ROTEIRO</option>
                        <option value="LIVE" className="text-blue-500">LIVE</option>
                        <option value="REELS">REELS</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <input type="text" value={row.assunto} onChange={(e) => updateRow(row.id, 'assunto', e.target.value)} className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200" placeholder="Assunto do vídeo..." />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <select value={row.status} onChange={(e) => updateRow(row.id, 'status', e.target.value)} className="w-full bg-emerald-700 text-white font-bold rounded px-1 outline-none">
                        <option value="Pronto">Pronto</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Gravando">Gravando</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <select value={row.videos} onChange={(e) => updateRow(row.id, 'videos', e.target.value)} className="w-full bg-blue-700 text-white font-bold rounded px-1 outline-none">
                        <option value="1 de 1">1 de 1</option>
                        <option value="1 de 2">1 de 2</option>
                        <option value="2 de 2">2 de 2</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <select value={row.bonus} onChange={(e) => updateRow(row.id, 'bonus', e.target.value)} className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200">
                        <option value="">Nenhum</option>
                        <option value="FOLGA">FOLGA</option>
                        <option value="PIX">PIX</option>
                      </select>
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <input type="date" value={row.dataFolga} onChange={(e) => updateRow(row.id, 'dataFolga', e.target.value)} className="w-full bg-transparent outline-none font-bold text-slate-800 dark:text-slate-200" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200 dark:border-slate-800">
                      <input type="date" value={row.fim} onChange={(e) => updateRow(row.id, 'fim', e.target.value)} className="w-full bg-transparent outline-none text-slate-800 dark:text-slate-200" />
                    </td>
                    <td className="p-1.5 text-center">
                      <button onClick={() => deleteRow(row.id)} className="text-slate-400 hover:text-red-500 transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={addRow}
            className="mt-4 flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition px-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Linha
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#0c1220] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar
          </button>
        </div>

      </div>
    </div>
  )
}
