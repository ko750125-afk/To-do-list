"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

interface TodoInputProps {
  onAdd: (text: string) => void;
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (trimmed) {
      onAdd(trimmed);
      setText("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="새 할일 추가..."
        maxLength={100}
        autoComplete="off"
        className="flex-1 h-12 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-[15px] text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none shadow-sm hover:border-zinc-300 dark:hover:border-zinc-700 focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-950/50 transition-all duration-150"
      />
      <button
        type="submit"
        className="h-12 px-5 bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-950 rounded-xl font-semibold text-sm cursor-pointer hover:bg-zinc-800 dark:hover:bg-zinc-100 active:scale-95 flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150"
      >
        <Plus size={16} strokeWidth={2.5} />
        추가
      </button>
    </form>
  );
}
