import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { addDays } from 'date-fns';
import { todayKey } from './utils';

export interface Todo {
  id: string;
  text: string;
  date: string; // YYYY-MM-DD — due date
  done: boolean;
  createdAt: string;
}

export type DueOption = 'today' | 'tomorrow' | 'date';

export function tomorrowKey(): string {
  return todayKey(addDays(new Date(), 1));
}

export function parseDateKey(date: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatTodoDate(date: string): string {
  return format(parseDateKey(date), 'EEE, d MMM', { locale: idLocale });
}

export function generateTodoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}