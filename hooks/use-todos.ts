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

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([]);
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
          if (data && Array.isArray(data.todos)) {
            setTodos(data.todos);
            localStorage.setItem("todos", JSON.stringify(data.todos));
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

  // 4. 기기 간 연동 비즈니스 로직

  // 신규 동기화 연동 코드 생성 (6자리 난수)
  const generateSyncCode = useCallback(async () => {
    try {
      setIsSyncing(true);
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const docRef = doc(db, "todo_todo-app", code);
      
      // 현재 로컬 투두 데이터를 클라우드 초기값으로 밀어넣기
      await setDoc(docRef, {
        todos: todos,
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
  }, [todos]);

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
        if (data && Array.isArray(data.todos)) {
          setTodos(data.todos);
          localStorage.setItem("todos", JSON.stringify(data.todos));
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


  // 5. CRUD 핵심 인터페이스 정의
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

  // 6. 상태 연산값 가공
  const total = todos.length;
  const done = todos.filter(t => t.done).length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return {
    todos: isMounted ? todos : [],
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
    progress: {
      total,
      done,
      percent,
    }
  };
}
