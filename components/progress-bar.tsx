"use client";

interface ProgressBarProps {
  done: number;
  total: number;
  percent: number;
}

export function ProgressBar({ done, total, percent }: ProgressBarProps) {
  const isComplete = percent === 100 && total > 0;

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between items-center text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wide">

        <span className="font-mono text-zinc-600 dark:text-zinc-400 tabular-nums">
          {done} / {total} ({percent}%)
        </span>
      </div>
      <div className="h-2 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden shadow-inner">
        <div
          style={{ width: `${percent}%` }}
          className={`h-full rounded-full transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isComplete 
              ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-[0_0_10px_rgba(34,197,94,0.3)]" 
              : "bg-gradient-to-r from-indigo-500 to-violet-400"
            }
          `}
        />
      </div>
    </div>
  );
}
