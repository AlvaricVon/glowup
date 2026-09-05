import { useState } from 'react';
import { CalendarDays, Check, ClipboardList, Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  formatTodoDate,
  generateTodoId,
  tomorrowKey,
  type DueOption,
  type Todo,
} from '../lib/todos';
import { todayKey } from '../lib/utils';

const STORAGE_KEY = 'glowup-todos';

function resolveDate(option: DueOption, custom: string): string {
  if (option === 'tomorrow') return tomorrowKey();
  if (option === 'date') return custom || todayKey();
  return todayKey();
}

function DuePicker({
  value,
  onChange,
  date,
  onDateChange,
}: {
  value: DueOption;
  onChange: (v: DueOption) => void;
  date: string;
  onDateChange: (v: string) => void;
}) {
  const chip = (id: DueOption, label: string) => (
    <button
      type="button"
      onClick={() => onChange(id)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
        value === id
          ? 'bg-brand-500 text-white'
          : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {chip('today', 'Hari ini')}
        {chip('tomorrow', 'Besok')}
        {chip('date', 'Pilih tanggal')}
      </div>
      {value === 'date' && (
        <input
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
        />
      )}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-200 bg-white/50 px-4 py-8 text-center dark:border-neutral-800 dark:bg-neutral-900/40">
      <p className="text-sm text-neutral-400">{text}</p>
    </div>
  );
}

export function Todos() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(STORAGE_KEY, []);
  const [text, setText] = useState('');
  const [due, setDue] = useState<DueOption>('today');
  const [customDate, setCustomDate] = useState(todayKey());

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDue, setEditDue] = useState<DueOption>('today');
  const [editDate, setEditDate] = useState(todayKey());

  const today = todayKey();
  const tomorrow = tomorrowKey();

  const addTodo = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setTodos((prev) => [
      ...prev,
      { id: generateTodoId(), text: trimmed, date: resolveDate(due, customDate), done: false, createdAt: new Date().toISOString() },
    ]);
    setText('');
  };

  const toggleDone = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDue(todo.date === today ? 'today' : todo.date === tomorrow ? 'tomorrow' : 'date');
    setEditDate(todo.date);
  };

  const saveEdit = () => {
    if (editingId === null) return;
    const id = editingId;
    const trimmed = editText.trim();
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, text: trimmed || t.text, date: resolveDate(editDue, editDate) }
          : t,
      ),
    );
    setEditingId(null);
  };

  const clearDone = () => {
    setTodos((prev) => prev.filter((t) => !t.done));
  };

  const overdue = todos.filter((t) => !t.done && t.date < today);
  const todayTodos = todos.filter((t) => !t.done && t.date === today);
  const tomorrowTodos = todos.filter((t) => !t.done && t.date === tomorrow);
  const scheduled = todos
    .filter((t) => !t.done && t.date > tomorrow)
    .sort((a, b) => a.date.localeCompare(b.date));
  const doneTodos = todos.filter((t) => t.done);

  const renderRow = (todo: Todo, isOverdue: boolean) => {
    const isEditing = editingId === todo.id;
    return (
      <div
        key={todo.id}
        className={`rounded-xl border p-3 transition-colors ${
          isEditing
            ? 'border-brand-300 bg-white/80 dark:border-brand-700 dark:bg-neutral-900/80'
            : todo.done
              ? 'border-neutral-200/60 bg-white/50 opacity-60 dark:border-neutral-800/60 dark:bg-neutral-900/40'
              : 'border-neutral-200/80 bg-white/70 dark:border-neutral-800/70 dark:bg-neutral-900/60'
        }`}
      >
        {isEditing ? (
          <div className="space-y-2">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit();
                if (e.key === 'Escape') setEditingId(null);
              }}
              autoFocus
              placeholder="Tulis catatan..."
              className="w-full rounded-xl border border-neutral-200 bg-cream-50 px-3 py-2 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
            />
            <DuePicker value={editDue} onChange={setEditDue} date={editDate} onDateChange={setEditDate} />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
              >
                <Check size={13} /> Simpan
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-neutral-200 py-2 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <X size={13} /> Batal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <button
              type="button"
              onClick={() => toggleDone(todo.id)}
              aria-label={todo.done ? 'Tandai belum selesai' : 'Tandai selesai'}
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                todo.done
                  ? 'border-brand-500 bg-brand-500'
                  : 'border-neutral-300 hover:border-brand-400 dark:border-neutral-600'
              }`}
            >
              {todo.done && <Check size={13} className="text-white" />}
            </button>

            <div className="min-w-0 flex-1">
              <p
                className={`break-words text-sm ${
                  todo.done
                    ? 'text-neutral-400 line-through'
                    : 'font-medium text-neutral-900 dark:text-neutral-100'
                }`}
              >
                {todo.text}
              </p>
              <span
                className={`mt-1 inline-block text-[11px] font-medium ${
                  isOverdue ? 'text-red-500' : 'text-neutral-400'
                }`}
              >
                {formatTodoDate(todo.date)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => startEdit(todo)}
                aria-label="Edit catatan"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 dark:hover:bg-neutral-800 dark:hover:text-neutral-200"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => removeTodo(todo.id)}
                aria-label="Hapus catatan"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/40"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const section = (title: string, icon: React.ReactNode, list: Todo[], overdueOnly = false) => {
    if (list.length === 0) return null;
    return (
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 px-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
          {icon}
          {title}
          <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            {list.length}
          </span>
        </h2>
        <div className="space-y-2">{list.map((t) => renderRow(t, overdueOnly))}</div>
      </section>
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-5 px-4 pb-28 pt-6">
      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
          Catatan Harian
        </p>
        <div className="flex items-center gap-2">
          <ClipboardList size={28} className="text-brand-500" />
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-100">To-Do</h1>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">Tulis dulu, baru dikerjain. Ganti catatan WA lu.</p>
      </header>

      {/* Add form */}
      <form
        onSubmit={addTodo}
        className="space-y-3 rounded-xl border border-neutral-200/80 bg-white/70 p-4 dark:border-neutral-800/70 dark:bg-neutral-900/60"
      >
        <div className="relative">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mau ngapain nih...?"
            className="w-full rounded-xl border border-neutral-200 bg-cream-50 py-3 pl-4 pr-4 text-sm text-neutral-900 placeholder-neutral-400 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-400/20 dark:border-neutral-800 dark:bg-neutral-950/60 dark:text-neutral-100"
          />
        </div>
        <DuePicker value={due} onChange={setDue} date={customDate} onDateChange={setCustomDate} />
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white transition-colors hover:bg-brand-600"
        >
          <Plus size={18} />
          Tambah
        </button>
      </form>

      {todos.length === 0 ? (
        <EmptyState text="Belum ada catatan. Tulis dulu yang mau dikerjain." />
      ) : (
        <>
          {section('Terlambat', <Clock size={12} />, overdue, true)}
          {section('Hari Ini', <CalendarDays size={12} />, todayTodos)}
          {section('Besok', <CalendarDays size={12} />, tomorrowTodos)}
          {section('Sesuai Tanggal', <CalendarDays size={12} />, scheduled)}

          {doneTodos.length > 0 && (
            <section className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-500">
                  <Check size={12} />
                  Selesai
                  <span className="rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-bold text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                    {doneTodos.length}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={clearDone}
                  className="flex items-center gap-1 text-[11px] font-semibold text-neutral-400 transition-colors hover:text-red-500"
                >
                  <Trash2 size={12} />
                  Bersihkan
                </button>
              </div>
              <div className="space-y-2">{doneTodos.map((t) => renderRow(t, false))}</div>
            </section>
          )}
        </>
      )}

      <p className="px-2 pt-2 text-center text-[11px] text-neutral-400">GlowUp To-Do · Catatan disimpan di perangkat</p>
    </div>
  );
}