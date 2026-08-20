'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Save, Plus, Trash2, CheckCircle2, ChevronDown, Edit2 } from 'lucide-react'

// ================= TYPES =================
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
  pago: boolean
}

type ColumnOptions = {
  setor: string[]
  colaborador: string[]
  tipoVideo: string[]
  status: string[]
  videos: string[]
  bonus: string[]
}

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// ================= MOCK DATA =================
const initialOptions: ColumnOptions = {
  setor: ['MARKETING', 'VENDAS'],
  colaborador: ['LETYCYA', 'LUÍS', 'ANA'],
  tipoVideo: ['COM ROTEIRO', 'LIVE', 'REELS'],
  status: ['Pronto', 'Pendente', 'Gravando', 'Não gravou', 'Editando'],
  videos: ['1 de 1', '1 de 2', '2 de 2'],
  bonus: ['FOLGA', 'PIX'],
}

const defaultRows: ScheduleRow[] = [
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
    pago: false
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
    pago: false
  },
]

// ================= HELPERS =================
const getStatusColor = (status: string) => {
  const s = status.toLowerCase()
  if (s.includes('pendente')) return 'bg-yellow-500 text-white'
  if (s.includes('editando')) return 'bg-blue-500 text-white'
  if (s.includes('pronto')) return 'bg-emerald-600 text-white'
  if (s.includes('não gravou')) return 'bg-red-500 text-white'
  return 'bg-slate-600 text-white' // default/gravando
}

// ================= COMPONENTS =================

const AssuntoPopover = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative w-full h-full" ref={popoverRef}>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full text-left truncate px-2 py-1.5 rounded-lg border border-transparent hover:border-blue-500/50 hover:bg-blue-500/5 transition text-slate-800 dark:text-slate-200"
      >
        {value || <span className="text-slate-400 italic">Adicionar assunto...</span>}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-[120] w-[300px] bg-white dark:bg-[#111625] border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in p-2">
          <textarea
            autoFocus
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-[120px] bg-transparent outline-none text-slate-800 dark:text-slate-200 resize-none text-sm p-1"
            placeholder="Escreva os detalhes do assunto aqui..."
          />
          <div className="flex justify-end mt-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const ManageOptionsModal = ({ 
  isOpen, 
  columnName, 
  options, 
  onClose, 
  onSave 
}: { 
  isOpen: boolean, 
  columnName: keyof ColumnOptions | null, 
  options: string[], 
  onClose: () => void, 
  onSave: (newOptions: string[]) => void 
}) => {
  const [localOptions, setLocalOptions] = useState<string[]>([])
  const [newOption, setNewOption] = useState('')

  useEffect(() => {
    if (isOpen) setLocalOptions([...options])
  }, [isOpen, options])

  if (!isOpen || !columnName) return null

  const handleAdd = () => {
    if (newOption.trim() && !localOptions.includes(newOption.trim())) {
      setLocalOptions([...localOptions, newOption.trim()])
      setNewOption('')
    }
  }

  const handleDelete = (opt: string) => {
    setLocalOptions(localOptions.filter(o => o !== opt))
  }

  const colNamesMap: Record<keyof ColumnOptions, string> = {
    setor: 'Setor',
    colaborador: 'Colaborador',
    tipoVideo: 'Tipo de Vídeo',
    status: 'Status',
    videos: 'Vídeos',
    bonus: 'Bônus'
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
        <div className="bg-slate-100 dark:bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h3 className="font-bold text-slate-800 dark:text-slate-200">
            Gerenciar {colNamesMap[columnName]}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 flex-1 overflow-y-auto max-h-[300px]">
          <div className="flex gap-2 mb-4">
            <input 
              type="text" 
              value={newOption} 
              onChange={e => setNewOption(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="Nova opção..."
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-500"
            />
            <button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-lg text-sm font-semibold transition"><Plus className="w-4 h-4" /></button>
          </div>
          <div className="space-y-2">
            {localOptions.map(opt => (
              <div key={opt} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{opt}</span>
                <button onClick={() => handleDelete(opt)} className="text-slate-400 hover:text-red-500 transition"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
            {localOptions.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Nenhuma opção configurada.</p>}
          </div>
        </div>
        <div className="px-4 py-3 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition">Cancelar</button>
          <button onClick={() => { onSave(localOptions); onClose() }} className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition">Salvar Opções</button>
        </div>
      </div>
    </div>
  )
}

const PasswordModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [pwd, setPwd] = useState('')
  const [error, setError] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validação simulada (Senha provisória: 1234)
    if (pwd === '1234') {
      onSuccess()
      setPwd('')
      setError(false)
      onClose()
    } else {
      setError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-xs flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        <form onSubmit={handleSubmit} className="p-5">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">Autorização Necessária</h3>
            <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Digite a senha do colaborador para confirmar o pagamento/conclusão.</p>
          <input 
            type="password"
            autoFocus
            value={pwd}
            onChange={(e) => { setPwd(e.target.value); setError(false) }}
            placeholder="Senha (1234)"
            className={`w-full bg-slate-50 dark:bg-slate-800 border ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'} rounded-lg px-3 py-2 text-sm outline-none mb-2 text-slate-800 dark:text-slate-200`}
          />
          {error && <span className="text-[10px] text-red-500 font-medium">Senha incorreta. Tente "1234".</span>}
          
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition">Cancelar</button>
            <button type="submit" className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition">Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  )
}


// ================= MAIN MODAL =================
export default function VideoScheduleModal({ isOpen, onClose }: VideoScheduleModalProps) {
  const [title, setTitle] = useState('CRONOGRAMA DE VÍDEOS')
  const [selectedMonth, setSelectedMonth] = useState('Agosto')
  const [monthData, setMonthData] = useState<Record<string, ScheduleRow[]>>({
    'Agosto': defaultRows
  })
  
  const [optionsMap, setOptionsMap] = useState<ColumnOptions>(initialOptions)
  
  // Modals state
  const [manageCol, setManageCol] = useState<keyof ColumnOptions | null>(null)
  const [passwordRowId, setPasswordRowId] = useState<string | null>(null)

  if (!isOpen) return null

  const rows = monthData[selectedMonth] || []

  // Helpers
  const updateRow = (id: string, field: keyof ScheduleRow, value: any) => {
    const updated = rows.map(row => row.id === id ? { ...row, [field]: value } : row)
    setMonthData(prev => ({ ...prev, [selectedMonth]: updated }))
  }

  const addRow = () => {
    const newRow: ScheduleRow = {
      id: Math.random().toString(36).substring(2, 9),
      gravarEm: '', publicadoEm: '', setor: optionsMap.setor[0] || '', colaborador: '', topico: '', 
      tipoVideo: optionsMap.tipoVideo[0] || '', assunto: '', status: optionsMap.status[0] || '', 
      videos: optionsMap.videos[0] || '', bonus: optionsMap.bonus[0] || '', dataFolga: '', fim: '', pago: false
    }
    setMonthData(prev => ({ ...prev, [selectedMonth]: [...rows, newRow] }))
  }

  const deleteRow = (id: string) => {
    setMonthData(prev => ({ ...prev, [selectedMonth]: rows.filter(r => r.id !== id) }))
  }

  const handleSelectChange = (rowId: string, col: keyof ColumnOptions, val: string) => {
    if (val === '__manage__') {
      setManageCol(col)
    } else {
      updateRow(rowId, col, val)
    }
  }

  const renderSelect = (rowId: string, col: keyof ColumnOptions, currentValue: string, extraClass: string = '') => (
    <select 
      value={currentValue} 
      onChange={(e) => handleSelectChange(rowId, col, e.target.value)} 
      className={`w-full bg-transparent outline-none rounded-lg px-2 py-1.5 cursor-pointer appearance-none ${extraClass}`}
    >
      <option value="" className="text-slate-500 bg-white dark:bg-slate-800">Selecione...</option>
      {optionsMap[col].map(opt => (
        <option key={opt} value={opt} className="text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 font-medium">
          {opt}
        </option>
      ))}
      <option value="__manage__" className="text-blue-600 bg-blue-50 dark:bg-blue-900/30 font-bold border-t border-slate-200">
        + Gerenciar Opções...
      </option>
    </select>
  )

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8">
      {/* Container */}
      <div className="bg-white dark:bg-[#0c1220] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-[1400px] flex flex-col shadow-2xl h-full max-h-full overflow-hidden">
        
        {/* Header (Dynamic) */}
        <div className="bg-blue-600 px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
            {/* Editable Title */}
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)}
              className="text-lg sm:text-xl font-black text-white uppercase tracking-wider bg-transparent outline-none border-b-2 border-transparent focus:border-white/50 transition w-full sm:w-[300px]"
            />
            <div className="h-4 w-px bg-white/20 hidden sm:block" />
            
            {/* Month Selector */}
            <div className="relative flex items-center">
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="appearance-none bg-blue-700/50 hover:bg-blue-700 border border-blue-500 text-white font-bold px-4 py-1.5 pr-8 rounded-xl outline-none cursor-pointer transition shadow-inner"
              >
                {MONTHS.map(m => <option key={m} value={m} className="text-slate-800 bg-white">{m}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-white absolute right-3 pointer-events-none" />
            </div>
          </div>

          <button onClick={onClose} className="text-blue-100 hover:text-white hover:bg-blue-700/50 p-2 rounded-xl transition absolute top-4 right-4 sm:relative sm:top-0 sm:right-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 bg-slate-50 dark:bg-[#080c17]">
          <div className="min-w-[1200px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111625] shadow-sm">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <th className="p-3 font-bold w-[120px]">Gravar em:</th>
                  <th className="p-3 font-bold w-[120px]">Publicado em:</th>
                  <th className="p-3 font-bold w-[140px]">Setor</th>
                  <th className="p-3 font-bold w-[150px]">Colaborador</th>
                  <th className="p-3 font-bold w-[160px]">Tópico</th>
                  <th className="p-3 font-bold w-[140px]">Tipo de Vídeo</th>
                  <th className="p-3 font-bold min-w-[200px]">Assunto</th>
                  <th className="p-3 font-bold w-[140px]">Status</th>
                  <th className="p-3 font-bold w-[100px]">Vídeos</th>
                  <th className="p-3 font-bold w-[120px]">Bônus</th>
                  <th className="p-3 font-bold w-[120px]">Data Folga</th>
                  <th className="p-3 font-bold w-[120px]">Fim</th>
                  <th className="p-3 font-bold w-[80px] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center py-10 text-slate-400 font-medium">Nenhum vídeo cadastrado para {selectedMonth}.</td>
                  </tr>
                )}
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition group">
                    <td className="p-2">
                      <input type="date" value={row.gravarEm} onChange={e => updateRow(row.id, 'gravarEm', e.target.value)} className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-2 py-1.5 outline-none font-semibold text-slate-800 dark:text-slate-200 transition" />
                    </td>
                    <td className="p-2">
                      <input type="date" value={row.publicadoEm} onChange={e => updateRow(row.id, 'publicadoEm', e.target.value)} className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-slate-200 transition" />
                    </td>
                    
                    <td className="p-2 relative">
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 transition bg-white dark:bg-slate-900 overflow-hidden">
                        {renderSelect(row.id, 'setor', row.setor, 'text-slate-600 dark:text-slate-300 font-medium')}
                      </div>
                    </td>
                    <td className="p-2 relative">
                       <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 transition bg-slate-700 dark:bg-slate-800 overflow-hidden">
                        {renderSelect(row.id, 'colaborador', row.colaborador, 'text-white font-bold')}
                      </div>
                    </td>

                    <td className="p-2">
                      <input type="text" value={row.topico} onChange={e => updateRow(row.id, 'topico', e.target.value)} className="w-full bg-transparent border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-2 py-1.5 outline-none text-slate-800 dark:text-slate-200 transition" placeholder="Ex: MÊS DOS PAIS" />
                    </td>
                    
                    <td className="p-2 relative">
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 transition bg-white dark:bg-slate-900 overflow-hidden">
                        {renderSelect(row.id, 'tipoVideo', row.tipoVideo, 'text-slate-800 dark:text-slate-200 font-bold')}
                      </div>
                    </td>

                    <td className="p-2">
                      <AssuntoPopover value={row.assunto} onChange={(val) => updateRow(row.id, 'assunto', val)} />
                    </td>

                    <td className="p-2 relative">
                      <div className={`border border-transparent rounded-lg hover:brightness-110 transition shadow-sm overflow-hidden ${getStatusColor(row.status)}`}>
                        {renderSelect(row.id, 'status', row.status, 'font-bold text-center text-white')}
                      </div>
                    </td>

                    <td className="p-2 relative">
                      <div className="border border-blue-600 rounded-lg bg-blue-600 hover:bg-blue-500 transition shadow-sm overflow-hidden">
                        {renderSelect(row.id, 'videos', row.videos, 'font-bold text-center text-white')}
                      </div>
                    </td>
                    
                    <td className="p-2 relative">
                      <div className="border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-400 transition bg-white dark:bg-slate-900 overflow-hidden">
                        {renderSelect(row.id, 'bonus', row.bonus, 'text-slate-800 dark:text-slate-200 font-semibold')}
                      </div>
                    </td>

                    <td className="p-2">
                      <input type="date" value={row.dataFolga} onChange={e => updateRow(row.id, 'dataFolga', e.target.value)} className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-2 py-1.5 outline-none font-bold text-slate-800 dark:text-slate-200 transition" />
                    </td>
                    <td className="p-2">
                      <input type="date" value={row.fim} onChange={e => updateRow(row.id, 'fim', e.target.value)} className="w-full bg-slate-100/50 dark:bg-slate-900/50 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 rounded-lg px-2 py-1.5 outline-none font-bold text-slate-800 dark:text-slate-200 transition" />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center justify-center gap-2">
                        {/* Check (Pago/Concluído) */}
                        <button 
                          onClick={() => {
                            if (!row.pago) {
                              setPasswordRowId(row.id) // Pede senha para aprovar
                            } else {
                              setPasswordRowId(row.id) // Pede senha para desaprovar também
                            }
                          }}
                          className={`p-1.5 rounded-lg transition ${row.pago ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 shadow-inner' : 'text-slate-300 hover:bg-emerald-50 hover:text-emerald-500 dark:hover:bg-slate-800'}`}
                          title={row.pago ? "Concluído/Pago (Clique para revogar)" : "Marcar como Concluído/Pago"}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${row.pago ? 'fill-current text-emerald-100 dark:text-emerald-900' : ''}`} />
                        </button>

                        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        
                        <button onClick={() => deleteRow(row.id)} className="p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 rounded-lg transition" title="Excluir Linha">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button onClick={addRow} className="mt-6 flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 dark:bg-blue-900/20 dark:hover:bg-blue-600 border border-blue-200 dark:border-transparent rounded-xl transition px-4 py-2 shadow-sm">
            <Plus className="w-4 h-4" />
            Adicionar Nova Linha
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white dark:bg-[#0c1220] border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition">
            Fechar
          </button>
          <button onClick={onClose} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2">
            <Save className="w-4 h-4" />
            Salvar Cronograma
          </button>
        </div>

      </div>

      {/* Internal Modals */}
      <ManageOptionsModal 
        isOpen={manageCol !== null}
        columnName={manageCol}
        options={manageCol ? optionsMap[manageCol] : []}
        onClose={() => setManageCol(null)}
        onSave={(newOpts) => {
          if (manageCol) {
             setOptionsMap(prev => ({ ...prev, [manageCol]: newOpts }))
          }
        }}
      />

      <PasswordModal 
        isOpen={passwordRowId !== null}
        onClose={() => setPasswordRowId(null)}
        onSuccess={() => {
          if (passwordRowId) {
            const row = rows.find(r => r.id === passwordRowId)
            if (row) updateRow(passwordRowId, 'pago', !row.pago)
          }
        }}
      />
    </div>
  )
}
