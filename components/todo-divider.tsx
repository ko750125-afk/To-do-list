"use client";

import { GripVertical, AlertCircle } from "lucide-react";
import { Todo } from "@/hooks/use-todos";

interface TodoDividerProps {
  todo: Todo;
  onDragStart: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnter: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

export function TodoDivider({
  todo,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}: TodoDividerProps) {
  return (
    <li
      className={`
        flex items-center gap-3 py-4 select-none relative group transform transition-all duration-200
        ${isDragging ? "opacity-30 scale-98" : ""}
      `}
      draggable
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDragEnter={(e) => onDragEnter(e, todo.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 1. Drag Handle (보라색 포인트 컬러 적용) */}
      <div
        className="drag-handle text-purple-400 dark:text-purple-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-950/20 transition-colors"
        aria-hidden="true"
      >
        <GripVertical size={16} />
      </div>

      {/* 2. Purple Horizontal Line with Glowing Badge */}
      <div className="flex-1 flex items-center relative">
        {/* 보라색 그라데이션 & 빛나는 섀도우 처리된 가로줄 */}
        <div className="flex-1 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.45)] dark:shadow-[0_0_10px_rgba(168,85,247,0.3)]" />
        
        {/* 가로줄 중앙에 위치한 미니멀한 알림 배지 */}
        <div className="absolute left-6 -top-2.5 flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-900/50 rounded-full tracking-wider shadow-sm select-none">
          <AlertCircle size={10} className="text-purple-500" />
          <span>위: 오늘 할 일 | 아래: 나중에</span>
        </div>
      </div>
    </li>
  );
}
