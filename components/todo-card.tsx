"use client";

import { useState, useRef, useEffect } from "react";
import { Todo } from "@/hooks/use-todos";
import { GripVertical, Pencil, Trash2, Check, Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, text: string) => void;
  onUpdateDate: (id: string, date: string | undefined) => void;
  // Drag & Drop
  onDragStart: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnter: (e: React.DragEvent<HTMLLIElement>, id: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

// 달력 계산 유틸리티
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export function TodoCard({
  todo,
  onToggle,
  onDelete,
  onUpdate,
  onUpdateDate,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
}: TodoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(todo.text);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // 커스텀 달력 팝오버 상태
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [viewDate, setViewDate] = useState(() => {
    const d = todo.dueDate ? new Date(todo.dueDate) : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // 달력 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCalendar]);

  const handleEditSubmit = () => {
    const trimmed = editText.trim();
    if (trimmed && trimmed !== todo.text) {
      onUpdate(todo.id, trimmed);
    } else {
      setEditText(todo.text);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleEditSubmit();
    if (e.key === "Escape") {
      setEditText(todo.text);
      setIsEditing(false);
    }
  };

  // 날짜 파싱 형식화: M/D(요일)
  const formatDueDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
    const weekday = weekdays[date.getDay()];
    
    return `${month}/${day}(${weekday})`;
  };

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(viewDate.year, viewDate.month);
    const firstDay = getFirstDayOfMonth(viewDate.year, viewDate.month);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    const todayStr = new Date().toISOString().split("T")[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const monthStr = String(viewDate.month + 1).padStart(2, "0");
      const dayStr = String(day).padStart(2, "0");
      const dateString = `${viewDate.year}-${monthStr}-${dayStr}`;
      
      const isSelected = todo.dueDate === dateString;
      const isToday = todayStr === dateString;

      cells.push(
        <button
          key={`day-${day}`}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUpdateDate(todo.id, dateString);
            setShowCalendar(false);
          }}
          className={`
            w-8 h-8 text-[11px] rounded-lg font-medium flex items-center justify-center transition-all cursor-pointer
            ${isSelected 
              ? "bg-indigo-600 text-white font-bold shadow-sm" 
              : isToday
                ? "bg-zinc-100 dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/50 dark:border-indigo-800/40"
                : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900"
            }
          `}
        >
          {day}
        </button>
      );
    }

    return cells;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("정말 이 할 일을 삭제하시겠습니까?")) {
      onDelete(todo.id);
    }
  };

  return (
    <li
      className={`
        todo-card group flex items-center gap-3 px-4 py-3 rounded-xl premium-card
        ${todo.done ? "opacity-75" : ""} 
        ${isDragging ? "border-dashed border-2 border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 opacity-40 shadow-inner scale-98" : ""}
        relative select-none transform transition-all duration-200
      `}
      draggable
      onDragStart={(e) => onDragStart(e, todo.id)}
      onDragEnter={(e) => onDragEnter(e, todo.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* 1. Drag Handle */}
      <div
        className="drag-handle text-zinc-300 dark:text-zinc-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        aria-hidden="true"
      >
        <GripVertical size={16} />
      </div>

      {/* 2. Custom Checkbox */}
      <div className="relative flex items-center justify-center shrink-0">
        <input
          type="checkbox"
          checked={todo.done}
          onChange={() => onToggle(todo.id)}
          className="peer appearance-none w-5 h-5 border border-zinc-300 dark:border-zinc-600 rounded-md cursor-pointer checked:bg-indigo-500 checked:border-indigo-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all duration-150"
          aria-label={todo.text}
        />
        <Check
          size={12}
          className="absolute text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity duration-150"
        />
      </div>

      {/* 3. 프리미엄 커스텀 달력 팝오버 (텍스트 생략하고 달력 아이콘만 표시) */}
      <div className="relative shrink-0" ref={calendarRef}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowCalendar(!showCalendar);
            const d = todo.dueDate ? new Date(todo.dueDate) : new Date();
            setViewDate({ year: d.getFullYear(), month: d.getMonth() });
          }}
          aria-label="날짜 지정"
          className={`
            flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold tracking-wide cursor-pointer transition-all duration-150 active:scale-95 border
            ${todo.dueDate 
              ? "bg-purple-50/80 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-950/70 text-purple-600 dark:text-purple-400 border-purple-200/50 dark:border-purple-900/40" 
              : "text-zinc-450 hover:text-zinc-700 dark:text-zinc-450 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-950/20 border-zinc-200/50 dark:border-zinc-800/40"
            }
          `}
        >
          <Calendar size={13} strokeWidth={2.4} />
          {todo.dueDate && (
            <span className="font-mono text-[11px] font-bold">
              {formatDueDate(todo.dueDate)}
            </span>
          )}
        </button>

        {showCalendar && (
          <div className="absolute left-0 mt-2 z-50 w-64 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl p-3.5 animate-in fade-in slide-in-from-top-1 duration-150">
            {/* 달력 헤더 */}
            <div className="flex justify-between items-center mb-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevMonth();
                }}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {viewDate.year}년 {viewDate.month + 1}월
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNextMonth();
                }}
                className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-1.5">
              <span>일</span>
              <span>월</span>
              <span>화</span>
              <span>수</span>
              <span>목</span>
              <span>금</span>
              <span>토</span>
            </div>

            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {renderDays()}
            </div>
            
            {/* 날짜 삭제 버튼 */}
            {todo.dueDate && (
              <div className="mt-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateDate(todo.id, undefined);
                    setShowCalendar(false);
                  }}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                >
                  날짜 삭제
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Todo Text / Input */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={handleKeyDown}
          maxLength={100}
          className="flex-1 min-w-0 bg-white dark:bg-zinc-950 border border-indigo-500 rounded-lg px-3 py-1 text-sm outline-none shadow-sm shadow-indigo-100 dark:shadow-none focus:ring-2 focus:ring-indigo-100 transition-all"
        />
      ) : (
        <span
          className={`flex-1 text-sm font-medium break-all pr-2 select-text leading-relaxed transition-all duration-200
            ${todo.done ? "line-through text-zinc-400 dark:text-zinc-600" : "text-zinc-800 dark:text-zinc-200"}
          `}
          onDoubleClick={() => setIsEditing(true)}
        >
          {todo.text}
        </span>
      )}

      {/* 5. Action Buttons (Edit & Delete) */}
      <div className="card-actions flex gap-1 items-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150">
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            aria-label={`${todo.text} 수정`}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={handleDeleteClick}
          aria-label={`${todo.text} 삭제`}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
