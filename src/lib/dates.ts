// dueDate é uma data sem horário ("YYYY-MM-DD" ou ISO "....T00:00:00.000Z").
// new Date(iso) interpreta como UTC e, em fusos negativos (ex: UTC-3),
// desloca a exibição para o dia anterior. Aqui sempre montamos a Date em horário local.
export function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number)
  const local = new Date(y, (m || 1) - 1, d || 1)
  return isNaN(local.getTime()) ? new Date(dateStr) : local
}

export function formatDateOnly(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
  return parseDateOnly(dateStr).toLocaleDateString('pt-BR', options)
}
