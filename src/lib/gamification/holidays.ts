/**
 * Dias não úteis de São Luís/MA — usados pela nova regra de COMBO
 * (domingos e feriados não contam nem quebram a sequência de x7/x14/x20)
 * e pelo dia de Sprint Final (último dia do mês recuando sobre
 * domingos/feriados).
 *
 * Feriados fixos: nacionais (Lei 662/1949 + Consciência Negra Lei
 * 14.759/2023), estaduais (Lei 2.457/1964) e municipais de São Luís
 * (Lei 3.432/1996; Decreto 62.168/2025). Feriados móveis calculados pela
 * Páscoa (algoritmo de Meeus/Jones/Butcher): Carnaval (seg+ter),
 * Sexta-feira Santa e Corpus Christi.
 */

const FIXED_HOLIDAYS = new Set([
  '01-01', // Confraternização Universal (nacional)
  '04-21', // Tiradentes (nacional)
  '05-01', // Dia do Trabalho (nacional)
  '06-29', // Dia de São Pedro (municipal — São Luís)
  '07-28', // Adesão do Maranhão à Independência (estadual — MA)
  '09-08', // Natividade de N. Sra. / Aniversário de São Luís (municipal)
  '09-07', // Independência do Brasil (nacional)
  '10-12', // Nossa Senhora Aparecida (nacional)
  '11-02', // Finados (nacional)
  '11-15', // Proclamação da República (nacional)
  '11-20', // Dia da Consciência Negra (nacional)
  '12-08', // Nossa Senhora da Conceição (municipal)
  '12-25', // Natal (nacional)
])

function easterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function midnight(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

/** Feriado (nacional, estadual ou municipal de São Luís) na data. */
export function isHoliday(d: Date): boolean {
  const key = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  if (FIXED_HOLIDAYS.has(key)) return true

  const easter = easterSunday(d.getFullYear())
  const diff = Math.round((midnight(d) - midnight(easter)) / 86400000)
  return diff === -48 || diff === -47 || diff === -2 || diff === 60
}

/**
 * Domingo ou feriado — dia que não conta nem quebra o COMBO
 * (x7/x14/x20) e é pulado no cálculo do Sprint Final.
 */
export function isNonWorkDay(d: Date): boolean {
  return d.getDay() === 0 || isHoliday(d)
}

/** Último dia do mês (1-12) recuando sobre domingos/feriados. */
export function sprintDay(year: number, month: number): Date {
  const d = new Date(year, month, 0)
  let guard = 0
  while (isNonWorkDay(d) && guard < 10) {
    d.setDate(d.getDate() - 1)
    guard++
  }
  return d
}

/** A data é o dia de Sprint Final do seu mês? */
export function isSprintDate(d: Date): boolean {
  const s = sprintDay(d.getFullYear(), d.getMonth() + 1)
  return d.getFullYear() === s.getFullYear() && d.getMonth() === s.getMonth() && d.getDate() === s.getDate()
}
