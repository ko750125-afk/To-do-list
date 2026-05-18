"use client";

import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
  today: boolean; // 오늘 할 일 여부
  dueDate?: string; // 지정된 기한 날짜 (format: YYYY-MM-DD)
}

export interface FixedExpense {
  id: string;
  text: string;
  amount: number | null;
  day: number; // 매월 해당 일자 (1~31, 31일의 경우 말일로 자동 보정)
}

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [lastGeneratedMonth, setLastGeneratedMonth] = useState<string | null>(null);
  
  const [isMounted, setIsMounted] = useState(false);
  const [syncCode, setSyncCode] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false); // 연동 처리 중 여부

  // 1. SSR mismatch 방지용 Client 마운트 감지, 로컬스토리지 및 동기화 코드 로드
  useEffect(() => {
    setIsMounted(true);
    try {
      // 로컬 투두 데이터 불러오기
      const savedTodos = localStorage.getItem("todos");
      if (savedTodos) {
        setTodos(JSON.parse(savedTodos));
      }
      
      // 로컬 고정비 데이터 불러오기
      const savedExpenses = localStorage.getItem("fixed_expenses");
      if (savedExpenses) {
        setFixedExpenses(JSON.parse(savedExpenses));
      }

      // 로컬 마지막 생성 달 정보 불러오기
      const savedGeneratedMonth = localStorage.getItem("last_generated_month");
      if (savedGeneratedMonth) {
        setLastGeneratedMonth(savedGeneratedMonth);
      }

      // 저장된 동기화 코드 불러오기
      const savedSyncCode = localStorage.getItem("sync_code");
      if (savedSyncCode) {
        setSyncCode(savedSyncCode);
      }
    } catch (e) {
      console.error("[Storage] Failed to load initial state:", e);
    }
  }, []);

  // 2. 동기화 코드가 존재할 경우, Firestore 실시간 바인딩 리스너 작동 (onSnapshot)
  useEffect(() => {
    if (!isMounted || !syncCode) return;

    // 격리 규칙: 컬렉션명은 "앱이름_폴더명" (todo_todo-app)
    const docRef = doc(db, "todo_todo-app", syncCode);
    
    setIsSyncing(true);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        setIsSyncing(false);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data) {
            if (Array.isArray(data.todos)) {
              setTodos(data.todos);
              localStorage.setItem("todos", JSON.stringify(data.todos));
            }
            if (Array.isArray(data.fixedExpenses)) {
              setFixedExpenses(data.fixedExpenses);
              localStorage.setItem("fixed_expenses", JSON.stringify(data.fixedExpenses));
            }
            if (data.lastGeneratedMonth !== undefined) {
              setLastGeneratedMonth(data.lastGeneratedMonth);
              if (data.lastGeneratedMonth) {
                localStorage.setItem("last_generated_month", data.lastGeneratedMonth);
              } else {
                localStorage.removeItem("last_generated_month");
              }
            }
          }
        }
      },
      (err) => {
        setIsSyncing(false);
        console.error("[Firestore] Sync Listener Error:", err);
      }
    );

    return () => unsubscribe();
  }, [syncCode, isMounted]);

  // 3. 투두 데이터 영속성 유지 (로컬스토리지 + 활성화 시 Firestore 동시 업로드)
  const saveTodos = useCallback((newTodos: Todo[]) => {
    setTodos(newTodos);
    try {
      localStorage.setItem("todos", JSON.stringify(newTodos));
    } catch (e) {
      console.error("[Storage] Failed to save todos:", e);
    }

    // 동기화 코드가 켜져 있는 상태라면 클라우드에도 즉시 반영
    if (syncCode) {
      const docRef = doc(db, "todo_todo-app", syncCode);
      setDoc(
        docRef,
        {
          todos: newTodos,
          updatedAt: new Date().toISOString(),
          syncCode: syncCode,
        },
        { merge: true }
      ).catch((err) => {
        console.error("[Firestore] Failed to save todos to cloud:", err);
      });
    }
  }, [syncCode]);

  // 3.5 고정비 데이터 영속성 유지
  const saveFixedExpenses = useCallback((newExpenses: FixedExpense[]) => {
    setFixedExpenses(newExpenses);
    try {
      localStorage.setItem("fixed_expenses", JSON.stringify(newExpenses));
    } catch (e) {
      console.error("[Storage] Failed to save fixed expenses:", e);
    }

    if (syncCode) {
      const docRef = doc(db, "todo_todo-app", syncCode);
      setDoc(
        docRef,
        {
          fixedExpenses: newExpenses,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      ).catch((err) => {
        console.error("[Firestore] Failed to save fixed expenses to cloud:", err);
      });
    }
  }, [syncCode]);

  // 4. 고정비 자동 리스트업 감지 엔진
  useEffect(() => {
    if (!isMounted || fixedExpenses.length === 0) return;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0~11
    const currentDate = today.getDate();

    // 이번 달의 마지막 일자 구하기
    const lastDayOfCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // 자동 등록 기준 설정:
    // 만약 오늘이 이번 달의 말일(last day)이면 -> 다음 달의 고정비를 미리 생성 (예: 오늘이 5/31이면 target은 6월)
    // 만약 오늘이 이번 달의 말일이 아니면 -> 이번 달의 고정비가 생성되었는지 검사 (예: 오늘이 6/1이면 target은 6월)
    let targetYear = currentYear;
    let targetMonth = currentMonth;

    if (currentDate === lastDayOfCurrentMonth) {
      // 말일이므로 다음 달을 생성 대상으로 삼음
      targetMonth = currentMonth + 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }

    const targetMonthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;

    // 이미 이번 달(혹은 타겟 달)에 생성 완료했다면 스킵
    if (lastGeneratedMonth === targetMonthKey) return;

    // 등록 대상 고정비를 할일 카드로 전환
    const newTodosToAdd: Todo[] = fixedExpenses.map((expense) => {
      // 타겟 달의 실제 최대 일자 구하기 (31일 지정인데 해당 월이 30일까지인 경우 보정)
      const maxDayInTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const targetDay = Math.min(expense.day, maxDayInTargetMonth);

      const dueDateString = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
      const amountText = expense.amount !== null ? ` [${expense.amount.toLocaleString()}원]` : "";

      return {
        id: `fixed-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        text: `[고정비] ${expense.text}${amountText}`,
        done: false,
        createdAt: new Date().toISOString(),
        today: false, // 나중에 할 일 목록으로 기본 등록 (필요시 끌어다 놓기 가능)
        dueDate: dueDateString,
      };
    });

    if (newTodosToAdd.length > 0) {
      const updatedTodos = [...todos, ...newTodosToAdd];
      
      // 로컬 상태 갱신
      setTodos(updatedTodos);
      setLastGeneratedMonth(targetMonthKey);

      // 로컬 스토리지 보존
      localStorage.setItem("todos", JSON.stringify(updatedTodos));
      localStorage.setItem("last_generated_month", targetMonthKey);

      // 클라우드 동기화 갱신
      if (syncCode) {
        const docRef = doc(db, "todo_todo-app", syncCode);
        setDoc(
          docRef,
          {
            todos: updatedTodos,
            lastGeneratedMonth: targetMonthKey,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch((err) => {
          console.error("[Firestore] Failed to sync auto generated fixed expense todos:", err);
        });
      }
    }
  }, [isMounted, todos, fixedExpenses, lastGeneratedMonth, syncCode]);

  // 5. 기기 간 연동 비즈니스 로직

  // 신규 동기화 연동 코드 생성 (6자리 난수)
  const generateSyncCode = useCallback(async () => {
    try {
      setIsSyncing(true);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const docRef = doc(db, "todo_todo-app", code);
      
      // 현재 로컬 데이터셋을 클라우드 초기값으로 보존
      await setDoc(docRef, {
        todos: todos,
        fixedExpenses: fixedExpenses,
        lastGeneratedMonth: lastGeneratedMonth,
        updatedAt: new Date().toISOString(),
        syncCode: code,
      });

      setSyncCode(code);
      localStorage.setItem("sync_code", code);
      setIsSyncing(false);
      return code;
    } catch (err) {
      setIsSyncing(false);
      console.error("[Firestore] Generate sync code failed:", err);
      throw err;
    }
  }, [todos, fixedExpenses, lastGeneratedMonth]);

  // 기존 기기 연동 코드에 연결
  const connectSyncCode = useCallback(async (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return false;

    try {
      setIsSyncing(true);
      const docRef = doc(db, "todo_todo-app", trimmed);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data) {
          if (Array.isArray(data.todos)) {
            setTodos(data.todos);
            localStorage.setItem("todos", JSON.stringify(data.todos));
          }
          if (Array.isArray(data.fixedExpenses)) {
            setFixedExpenses(data.fixedExpenses);
            localStorage.setItem("fixed_expenses", JSON.stringify(data.fixedExpenses));
          }
          if (data.lastGeneratedMonth !== undefined) {
            setLastGeneratedMonth(data.lastGeneratedMonth);
            if (data.lastGeneratedMonth) {
              localStorage.setItem("last_generated_month", data.lastGeneratedMonth);
            }
          }
        }
        setSyncCode(trimmed);
        localStorage.setItem("sync_code", trimmed);
        setIsSyncing(false);
        return true;
      }
      setIsSyncing(false);
      return false; // 해당 코드가 없음
    } catch (err) {
      setIsSyncing(false);
      console.error("[Firestore] Connect sync code failed:", err);
      return false;
    }
  }, []);

  // 기기 연동 해제
  const disconnectSync = useCallback(() => {
    setSyncCode(null);
    localStorage.removeItem("sync_code");
  }, []);


  // 6. CRUD 핵심 인터페이스 정의
  const addTodo = useCallback((text: string) => {
    if (!text.trim()) return;
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: text.trim(),
      done: false,
      createdAt: new Date().toISOString(),
      today: false,
    };
    saveTodos([...todos, newTodo]);
  }, [todos, saveTodos]);

  const updateTodo = useCallback((id: string, text: string) => {
    const nextTodos = todos.map(t => 
      t.id === id ? { ...t, text: text.trim() } : t
    );
    saveTodos(nextTodos);
  }, [todos, saveTodos]);

  const deleteTodo = useCallback((id: string) => {
    const nextTodos = todos.filter(t => t.id !== id);
    saveTodos(nextTodos);
  }, [todos, saveTodos]);

  const toggleTodo = useCallback((id: string) => {
    const nextTodos = todos.map(t =>
      t.id === id ? { ...t, done: !t.done } : t
    );
    saveTodos(nextTodos);
  }, [todos, saveTodos]);

  const setTodoToday = useCallback((id: string, today: boolean) => {
    const nextTodos = todos.map(t =>
      t.id === id ? { ...t, today } : t
    );
    saveTodos(nextTodos);
  }, [todos, saveTodos]);

  const setTodoDueDate = useCallback((id: string, dueDate: string | undefined) => {
    const nextTodos = todos.map(t =>
      t.id === id ? { ...t, dueDate } : t
    );
    saveTodos(nextTodos);
  }, [todos, saveTodos]);

  const clearCompleted = useCallback(() => {
    const nextTodos = todos.filter(t => !t.done);
    saveTodos(nextTodos);
  }, [todos, saveTodos]);

  const moveTodo = useCallback((activeId: string, overId: string) => {
    const activeIndex = todos.findIndex(t => t.id === activeId);
    const overIndex = todos.findIndex(t => t.id === overId);
    if (activeIndex === -1 || overIndex === -1) return;

    const nextTodos = [...todos];
    const [removed] = nextTodos.splice(activeIndex, 1);
    
    const targetToday = nextTodos[overIndex > activeIndex ? overIndex - 1 : overIndex]?.today ?? todos[overIndex].today;
    removed.today = targetToday;

    nextTodos.splice(overIndex, 0, removed);
    saveTodos(nextTodos);
  }, [todos, saveTodos]);


  // 고정비 항목 CRUD
  const addFixedExpense = useCallback((text: string, amount: number | null, day: number) => {
    if (!text.trim()) return;
    const newExpense: FixedExpense = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      text: text.trim(),
      amount,
      day: Math.max(1, Math.min(31, day)),
    };
    saveFixedExpenses([...fixedExpenses, newExpense]);
  }, [fixedExpenses, saveFixedExpenses]);

  const deleteFixedExpense = useCallback((id: string) => {
    const nextExpenses = fixedExpenses.filter(e => e.id !== id);
    saveFixedExpenses(nextExpenses);
  }, [fixedExpenses, saveFixedExpenses]);


  // 7. 상태 연산값 가공
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    todos: isMounted ? todos : [],
    fixedExpenses: isMounted ? fixedExpenses : [],
    lastGeneratedMonth,
    isMounted,
    syncCode,
    isSyncing,
    generateSyncCode,
    connectSyncCode,
    disconnectSync,
    addTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
    setTodoToday,
    setTodoDueDate,
    clearCompleted,
    moveTodo,
    addFixedExpense,
    deleteFixedExpense,
    progress: {
      total,
      done,
      percent,
    }
  };
}
