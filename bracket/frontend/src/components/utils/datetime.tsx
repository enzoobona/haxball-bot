import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export function DateTime({ datetime }: { datetime: string }) {
  const date = parseISO(datetime);
  return <time dateTime={datetime}>{format(date, "d 'de' LLLL yyyy, HH:mm", { locale: es })}</time>;
}

export function Time({ datetime }: { datetime: string }) {
  const date = parseISO(datetime);
  return <time dateTime={datetime}>{format(date, 'HH:mm')}</time>;
}

export function formatTime(datetime: string) {
  return format(parseISO(datetime), 'HH:mm');
}

export function formatDayLabel(datetime: string) {
  return format(parseISO(datetime), "EEEE d 'de' LLLL", { locale: es });
}

// Devuelve un número (negativo, 0 o positivo) para poder usarlo directamente en `sort`.
export function compareDateTime(datetime1: string, datetime2: string) {
  return parseISO(datetime1).getTime() - parseISO(datetime2).getTime();
}
