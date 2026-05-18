"use client";

import { useState } from "react";
import { useTodos } from "@/hooks/use-todos";
import { TodoInput } from "@/components/todo-input";
import { ProgressBar } from "@/components/progress-bar";
import { TodoCard } from "@/components/todo-card";
import { 
  ClipboardList, 
  Sparkles, 
  CheckCircle2, 
  Settings as SettingsIcon, 
  Smartphone, 
  Cloud, 
  Copy, 
  RefreshCw, 
  LogOut, 
  Check 
} from "lucide-react";

export default function Home() {
  const {
    todos,
    fixedExpenses,
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
    progress,
  } = useTodos();

  // 드래그 상태 관리
  const [draggingId, setDraggingId] = useState<string | null>(null);
  
  // 설정 모달 제어 상태
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"expenses" | "sync">("expenses");

  // 고정비 등록 폼 입력 상태
  const [expenseText, setExpenseText] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDay, setExpenseDay] = useState("");

  // 실시간 연동 코드 처리 상태
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [connectError, setConnectError] = useState("");

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, id: string) => {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLLIElement>, targetId: string) => {
    if (draggingId && draggingId !== targetId) {
      moveTodo(draggingId, targetId);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  const handleCopyCode = () => {
    if (!syncCode) return;
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConnect = async () => {
    setConnectError("");
    const trimmed = inputCode.trim();
    if (trimmed.length !== 6) {
      setConnectError("6자리 숫자를 올바르게 입력해 주세요.");
      return;
    }
    const success = await connectSyncCode(trimmed);
    if (success) {
      setInputCode("");
    } else {
      setConnectError("유효하지 않은 연동 코드입니다. 코드를 다시 확인해 주세요.");
    }
  };

  const handleCreateExpense = () => {
    const trimmedText = expenseText.trim();
    if (!trimmedText) return;

    const day = Math.max(1, Math.min(31, parseInt(expenseDay) || 1));
    const amount = expenseAmount ? parseInt(expenseAmount) : null;

    addFixedExpense(trimmedText, amount, day);
    
    // 입력 칸 초기화
    setExpenseText("");
    setExpenseAmount("");
    setExpenseDay("");
  };

  // 실질적인 할 일 갯수 파악
  const hasActiveTodos = todos.length > 0;

  // 오늘 할 일과 나중 일을 필터링하여 분리
  const todayTodos = todos.filter(t => t.today);
  const laterTodos = todos.filter(t => !t.today);

  return (
    <main className="flex-1 w-full max-w-lg mx-auto px-4 py-12 md:py-16 flex flex-col gap-6 relative">
      {/* 1. Header Card */}
      <header className="relative overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 flex flex-col gap-5">
        {/* 상단 포인트 컬러 그라데이션 장식선 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
        
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 dark:shadow-none">
              <CheckCircle2 size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-1.5">
                할일
                {progress.percent === 100 && progress.total > 0 && (
                  <Sparkles size={16} className="text-amber-500 animate-pulse" />
                )}
              </h1>
              <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold tracking-wider uppercase">
                Premium Dashboard
              </p>
            </div>
          </div>

          {/* 헤더 우측 인터랙티브 컨트롤 라인 */}
          <div className="flex items-center gap-2">
            {/* 실시간 연동 활성화 상태 뱃지 (미니멀) */}
            {syncCode && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-green-50/60 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-200/40 dark:border-green-900/30 rounded-xl text-[10px] font-bold select-none">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
                <span>연동 중</span>
              </div>
            )}

            {/* 설정 진입 톱니바퀴 버튼 */}
            <button
              onClick={() => {
                setActiveTab("expenses");
                setShowSettings(true);
              }}
              className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-850/50 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl flex items-center justify-center cursor-pointer active:scale-95 transition-all duration-150"
              title="설정 및 연동"
            >
              <SettingsIcon size={16} strokeWidth={2.3} />
            </button>
          </div>
        </div>

        {/* 프로그레스 바 컴포넌트 */}
        <ProgressBar
          done={progress.done}
          total={progress.total}
          percent={progress.percent}
        />
      </header>

      {/* 2. Todo Input Row */}
      <TodoInput onAdd={addTodo} />

      {/* 3. Todo List */}
      {hasActiveTodos ? (
        <div className="flex flex-col gap-1">
          {/* 오늘 할 일 영역 */}
          <ul className="flex flex-col gap-2.5 min-h-[10px]">
            {todayTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
                onUpdateDate={setTodoDueDate}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                isDragging={draggingId === todo.id}
              />
            ))}
            {todayTodos.length === 0 && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => {
                  if (draggingId) setTodoToday(draggingId, true);
                }}
                className="h-10 border border-dashed border-zinc-100 dark:border-zinc-800/40 rounded-xl transition-all"
              />
            )}
          </ul>

          {/* 고정된 보라색 가로 구분선 */}
          <div className="my-5 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)] dark:shadow-[0_0_10px_rgba(168,85,247,0.2)]" />

          {/* 나중에 처리할 일 영역 */}
          <ul className="flex flex-col gap-2.5 min-h-[10px]">
            {laterTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onUpdate={updateTodo}
                onUpdateDate={setTodoDueDate}
                onDragStart={handleDragStart}
                onDragEnter={handleDragEnter}
                onDragEnd={handleDragEnd}
                isDragging={draggingId === todo.id}
              />
            ))}
            {laterTodos.length === 0 && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={() => {
                  if (draggingId) setTodoToday(draggingId, false);
                }}
                className="h-10 border border-dashed border-zinc-100 dark:border-zinc-800/40 rounded-xl transition-all"
              />
            )}
          </ul>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-850/50 text-zinc-400 dark:text-zinc-500 rounded-full flex items-center justify-center mb-4 border border-zinc-100 dark:border-zinc-800 shadow-inner">
            <ClipboardList size={26} strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            등록된 할 일이 없습니다
          </h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 max-w-[200px]">
            새로운 계획이나 할 일을 추가하여 오늘 하루를 완성해 보세요.
          </p>
        </div>
      )}

      {/* 4. Swifter Action Buttons (Clear Completed) */}
      {progress.done > 0 && (
        <div className="flex justify-center mt-2">
          <button
            onClick={() => {
              if (confirm("완료된 모든 항목을 일괄 삭제할까요?")) {
                clearCompleted();
              }
            }}
            className="px-4 py-2 bg-transparent text-xs font-semibold text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800 rounded-xl cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-950/20 hover:border-red-200 dark:hover:border-red-900 hover:text-red-500 dark:hover:text-red-400 active:scale-97 transition-all duration-150"
          >
            완료 항목 일괄 삭제
          </button>
        </div>
      )}

      {/* 5. Premium Glassmorphism Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
              <div className="flex items-center gap-2">
                <SettingsIcon size={16} className="text-indigo-500" strokeWidth={2.5} />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">설정</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[11px] font-bold text-zinc-450 hover:text-zinc-600 dark:text-zinc-550 dark:hover:text-zinc-300 transition-colors cursor-pointer px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95"
              >
                닫기
              </button>
            </div>

            {/* Settings Content Tabs */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-850 px-5 gap-4">
              <button
                onClick={() => setActiveTab("expenses")}
                className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer select-none ${
                  activeTab === "expenses"
                    ? "border-indigo-500 text-indigo-650 dark:text-indigo-400"
                    : "border-transparent text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                고정비/고정입금 설정
              </button>
              <button
                onClick={() => setActiveTab("sync")}
                className={`py-3 text-xs font-bold border-b-2 transition-colors cursor-pointer select-none ${
                  activeTab === "sync"
                    ? "border-indigo-500 text-indigo-650 dark:text-indigo-400"
                    : "border-transparent text-zinc-450 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                모바일 기기 연동
              </button>
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              {activeTab === "expenses" ? (
                /* [고정비/고정입금 탭] */
                <div className="flex flex-col gap-4">
                  {/* 설명 배너 */}
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/50 dark:border-indigo-900/20 rounded-xl p-3.5 flex gap-2.5">
                    <Sparkles size={15} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed text-indigo-700 dark:text-indigo-350">
                      매월 말일이 되면, 아래에 설정한 모든 고정입금 항목이 **다음 달의 할 일 목록**으로 자동 등록됩니다. 등록일이 지나 앱을 열어도 누락 없이 똑같이 자동 생성됩니다.
                    </p>
                  </div>

                  {/* 고정비 추가 Form */}
                  <div className="flex flex-col gap-2.5 p-3.5 bg-zinc-50/60 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                    <span className="text-[10px] font-bold text-zinc-750 dark:text-zinc-350 uppercase tracking-wider">신규 고정비 항목 등록</span>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="예: 월세 이체, 적금 납입, 관리비 송금"
                        value={expenseText}
                        onChange={(e) => setExpenseText(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                      />
                      
                      <div className="flex gap-2">
                        {/* 금액 입력 */}
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="text"
                            placeholder="금액 (선택)"
                            value={expenseAmount}
                            onChange={(e) => setExpenseAmount(e.target.value.replace(/[^0-9]/g, ""))}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl pl-3 pr-7 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                          />
                          <span className="absolute right-3 text-[10px] font-bold text-zinc-400">원</span>
                        </div>
                        {/* 이체 희망 일자 */}
                        <div className="w-24 relative flex items-center">
                          <input
                            type="text"
                            maxLength={2}
                            placeholder="이체일"
                            value={expenseDay}
                            onChange={(e) => setExpenseDay(e.target.value.replace(/[^0-9]/g, ""))}
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl pl-3 pr-7 py-2 text-xs text-center outline-none focus:border-indigo-500 transition-colors"
                          />
                          <span className="absolute right-3 text-[10px] font-bold text-zinc-400">일</span>
                        </div>
                      </div>

                      <button
                        onClick={handleCreateExpense}
                        disabled={!expenseText.trim()}
                        className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-bold text-xs rounded-xl active:scale-98 transition-all disabled:opacity-40 cursor-pointer mt-1"
                      >
                        고정비 등록
                      </button>
                    </div>
                  </div>

                  {/* 등록된 고정비 리스트 */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 px-1 uppercase tracking-wider">등록된 항목 ({fixedExpenses.length})</span>
                    {fixedExpenses.length > 0 ? (
                      <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto pr-1">
                        {fixedExpenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="flex justify-between items-center p-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm"
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{expense.text}</span>
                              <span className="text-[10px] text-zinc-450 dark:text-zinc-550 font-bold">
                                매월 {expense.day}일 이체 {expense.amount !== null && `· ${expense.amount.toLocaleString()}원`}
                              </span>
                            </div>
                            <button
                              onClick={() => deleteFixedExpense(expense.id)}
                              className="px-2 py-1 text-[10px] font-bold text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold">등록된 고정비 항목이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* [모바일 기기 연동 탭] */
                <div className="flex flex-col gap-4">
                  {syncCode ? (
                    /* 이미 연동된 상태의 UI */
                    <div className="flex flex-col gap-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-zinc-555 dark:text-zinc-450 uppercase tracking-wider">내 연동 코드</span>
                        <div className="flex items-center gap-1.5 text-[10px] text-green-500 dark:text-green-450 font-bold">
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                          </span>
                          실시간 클라우드 동기화 중
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl py-2.5 px-4 flex items-center justify-center font-mono text-xl font-bold tracking-widest text-indigo-650 dark:text-indigo-400 shadow-inner">
                          {syncCode.slice(0, 3)} {syncCode.slice(3)}
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className="px-3.5 rounded-xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-950 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 cursor-pointer transition-colors active:scale-95"
                          title="복사하기"
                        >
                          {copied ? <Check size={15} className="text-green-500" /> : <Copy size={15} />}
                        </button>
                      </div>

                      <p className="text-[11px] leading-relaxed text-zinc-450 dark:text-zinc-500">
                        스마트폰이나 다른 기기에서 본 대시보드(설정 ➡️ 모바일 기기 연동)를 연 뒤, 위 **6자리 연동 코드**를 입력하면 동일한 할일 목록과 고정비가 기기 간에 완벽히 동기화됩니다.
                      </p>

                      <div className="flex justify-end pt-2 border-t border-zinc-150 dark:border-zinc-850 mt-1">
                        <button
                          onClick={() => {
                            if (confirm("연동을 해제하면 로컬 저장소 모드로 복귀합니다. 해제할까요?")) {
                              disconnectSync();
                            }
                          }}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 hover:text-red-650 dark:text-red-400 dark:hover:text-red-300 px-3 py-1.5 rounded-lg border border-red-200/50 dark:border-red-900/30 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer transition-all active:scale-95"
                        >
                          <LogOut size={11} />
                          <span>연동 해제</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* 연동 대기 상태의 UI */
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">신규 기기 연동 코드 발급</span>
                        <p className="text-[11px] text-zinc-450 dark:text-zinc-500 leading-relaxed">
                          새 연결 채널을 발급하여 스마트폰 앱이나 다른 스마트 기기와 투두 및 고정비 데이터를 실시간으로 완벽 연동합니다.
                        </p>
                        <button
                          onClick={generateSyncCode}
                          disabled={isSyncing}
                          className="mt-2.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-650 text-white font-bold text-xs shadow-sm hover:shadow active:scale-98 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          {isSyncing ? (
                            <RefreshCw size={12} className="animate-spin" />
                          ) : (
                            <Cloud size={13} strokeWidth={2.5} />
                          )}
                          <span>새 연동 채널 발급 (로컬 데이터 자동 업로드)</span>
                        </button>
                      </div>

                      <div className="relative flex items-center my-1.5">
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                        <span className="flex-shrink mx-3 text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">또는</span>
                        <div className="flex-grow border-t border-zinc-200 dark:border-zinc-800"></div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">기존 기기 코드와 연결</span>
                        <p className="text-[11px] text-zinc-450 dark:text-zinc-500 leading-relaxed">
                          다른 스마트폰이나 PC 화면에 노출된 6자리 연동 코드를 입력하여 할 일 및 고정비 목록을 실시간 동기화합니다.
                        </p>
                        <div className="flex gap-2 mt-2.5">
                          <input
                            type="text"
                            maxLength={6}
                            value={inputCode}
                            onChange={(e) => setInputCode(e.target.value.replace(/[^0-9]/g, ""))}
                            placeholder="6자리 연동 코드"
                            className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2 text-xs font-mono text-center tracking-widest outline-none focus:border-indigo-500 transition-colors"
                          />
                          <button
                            onClick={handleConnect}
                            disabled={isSyncing || inputCode.length !== 6}
                            className="px-4.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-bold transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                          >
                            연동하기
                          </button>
                        </div>
                        {connectError && (
                          <span className="text-[10px] text-red-500 font-semibold mt-1.5">{connectError}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    )}
  </main>
);
}
