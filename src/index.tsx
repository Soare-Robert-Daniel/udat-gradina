/**
 * Type of application: Tracking the time to water the greenhouse.
 *
 * Each greenhouse was its own timer that runs.
 *
 * UI: each greenhouse will represented by card with: title, lastRun as human readable date (use browser locales), current time as countdown to targetTime. When you click on card, you will have to choose the timer: 5 minutes, 10 minutes, 15 minutes, 20 minutes, 25 minutes, 30 minutes.
 *
 * Make the code to respect best practices for a Preact application. You an expoert in websites.
 *
 * Also make it mobile first with Tailwind v4.
 */

import { render } from "preact";
import { useState, useEffect, useCallback } from "preact/hooks";
import { twMerge } from "tailwind-merge";

import "./style.css";

const LABELS = {
  appTitle: "🌱 Grădină",
  appSubtitle: "Temporizator pentru udat",
  setTimerFor: "Alege timp pentru",
  cancel: "Anulează",
  lastWatered: "Udat ultima dată:",
  timeRemaining: "Timp rămas:",
  wateringCompleted: "✓ Udarea a fost finalizată!",
  tapToStart: "Apasă pentru a porni",
  never: "Niciodată",
  minutesShort: "min",
  solar1: "Solar Costica",
  solar2: "Solar Nea Ilie",
  solar3: "Solar Mare",
  solar4: "Solar Mic",
  solar5: "Solar Lung",
  history: "Istoric udări",
  duration: "Durată:",
  backToOverview: "Înapoi la privire generală",
};

const GREENHOUSE_NUMS: number = 5;

interface LogEntry {
  id: string;
  greenhouseId: string;
  date: Date;
  duration: number; // in minutes
  status: "completed" | "canceled";
}

interface Greenhouse {
  label: string;
  lastRun: Date | null;
  currentTime: number | null;
  targetTime: Date | null;
}

interface AppState {
  greenhouses: Record<string, Greenhouse>;
  activeTimer: string | null;
}

interface LogsState {
  entries: LogEntry[];
}

const defaultState: AppState = {
  activeTimer: null,
  greenhouses: Array(GREENHOUSE_NUMS)
    .fill({})
    .map((data, idx) => {
      return {
        label: LABELS[`solar${idx + 1}`],
        lastRun: null,
        currentTime: null,
        targetTime: null,
      };
    })
    .reduce((acc, data, idx) => {
      acc[`solar${idx}`] = data;
      return acc;
    }, {}),
};

const defaultLogsState: LogsState = {
  entries: [
    // Test data for first greenhouse
    {
      id: "log1",
      greenhouseId: "solar0",
      date: new Date(Date.now() - 2 * 60 * 60 * 1000),
      duration: 15,
      status: "completed",
    },
    {
      id: "log2",
      greenhouseId: "solar0",
      date: new Date(Date.now() - 6 * 60 * 60 * 1000),
      duration: 8,
      status: "canceled",
    },
    {
      id: "log3",
      greenhouseId: "solar0",
      date: new Date(Date.now() - 24 * 60 * 60 * 1000),
      duration: 10,
      status: "completed",
    },
  ],
};

const TIMER_OPTIONS = [5, 10, 15, 20, 25, 30]; // minutes

// Log management functions
function addLogEntry(logs: LogsState, entry: Omit<LogEntry, "id">): LogsState {
  const id = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newEntry: LogEntry = { ...entry, id };

  console.log(`Adding log entry for ${entry.greenhouseId}:`, newEntry);

  return {
    entries: [newEntry, ...logs.entries].slice(0, 1000), // Keep max 1000 entries
  };
}

function getGreenhouseLogs(logs: LogsState, greenhouseId: string): LogEntry[] {
  return logs.entries
    .filter((entry) => entry.greenhouseId === greenhouseId)
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

function getLatestRun(logs: LogsState, greenhouseId: string): Date | null {
  const greenhouseLogs = getGreenhouseLogs(logs, greenhouseId);
  return greenhouseLogs.length > 0 ? greenhouseLogs[0].date : null;
}

function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function formatLastRun(date: Date | null): string {
  if (!date) return LABELS.never;
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
}

interface HistoryItemProps {
  entry: LogEntry;
}

function Button({
  className = "",
  onClick,
  children,
  variant = "primary",
  compact = false,
}) {
  const variants = {
    primary: "bg-yellow-400 text-black",
    cancel: "bg-gray-500 text-white",
    success: "bg-green-500 text-white",
    danger: "bg-red-500 text-white",
    back: "bg-blue-500 text-white",
  };

  return (
    <button
      onClick={onClick}
      className={twMerge(
        `inline-block
		w-full
		font-bold 
		leading-none        
		text-center align-middle
		select-none
		appearance-none outline-none
		no-underline
		border-[1.6px] border-black
		shadow-[2px_2px_2px_rgba(187,187,187,1)]
		transition-colors
		hover:opacity-90`,
        compact ? "text-lg py-2 px-3 mb-1" : "text-2xl py-3 px-4 mb-2",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

function HistoryItem({ entry }: HistoryItemProps) {
  const isCanceled = entry.status === "canceled";

  return (
    <div className="p-2 odd:bg-gray-200">
      <div className="text-xl flex justify-between items-center">
        <div className=" text-gray-800">{formatLastRun(entry.date)}</div>
        <div
          className={` font-medium ${
            isCanceled ? "text-orange-600" : "text-green-600"
          }`}
        >
          {entry.duration} {LABELS.minutesShort}
        </div>
      </div>
    </div>
  );
}

interface HistorySectionProps {
  logs: LogEntry[];
}

function HistorySection({ logs }: HistorySectionProps) {
  // Take first 15 entries (already sorted)
  const displayedHistory = logs.slice(0, 15);

  if (displayedHistory.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-800 mb-3">{LABELS.history}</h2>
      <div className="">
        {displayedHistory.map((entry) => (
          <HistoryItem key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

interface TimerViewProps {
  greenhouse: Greenhouse;
  logs: LogEntry[];
  onCancel: () => void;
}

function TimerView({ greenhouse, logs, onCancel }: TimerViewProps) {
  const isRunning =
    greenhouse.currentTime !== null && greenhouse.currentTime > 0;
  const isCompleted = greenhouse.currentTime === 0;

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold text-gray-800 mb-2">
            {greenhouse.label}
          </h1>
        </div>

        {/* Timer Display */}
        <div className="mb-6 text-center">
          {isRunning && (
            <>
              <div className="text-8xl font-mono text-red-600 font-bold mb-4">
                {formatTimeRemaining(greenhouse.currentTime!)}
              </div>
            </>
          )}

          {isCompleted && (
            <div className="text-green-600 font-bold text-xl mb-4">
              {LABELS.wateringCompleted}
            </div>
          )}
        </div>

        {/* Cancel/Back Button */}
        <Button onClick={onCancel} variant={isCompleted ? "back" : "primary"}>
          {isCompleted ? `🡰 ${LABELS.backToOverview}` : `✖ ${LABELS.cancel}`}
        </Button>

        {/* History */}
        <HistorySection logs={logs} />
      </div>
    </div>
  );
}

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTimer: (minutes: number) => void;
  greenhouseName: string;
}

function TimerModal({
  isOpen,
  onClose,
  onSelectTimer,
  greenhouseName,
}: TimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white rounded-lg p-4 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-3 text-gray-800">
          {LABELS.setTimerFor} {greenhouseName}
        </h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {TIMER_OPTIONS.map((minutes) => (
            <Button
              key={minutes}
              onClick={() => onSelectTimer(minutes)}
              variant="success"
              compact
            >
              ⏱ {minutes} {LABELS.minutesShort}
            </Button>
          ))}
        </div>
        <Button onClick={onClose} variant="cancel" compact>
          ✖ {LABELS.cancel}
        </Button>
      </div>
    </div>
  );
}

interface GreenhouseCardProps {
  id: string;
  greenhouse: Greenhouse;
  lastRun: Date | null;
  onClick: () => void;
}

function GreenhouseCard({
  id,
  greenhouse,
  lastRun,
  onClick,
}: GreenhouseCardProps) {
  const isRunning =
    greenhouse.currentTime !== null && greenhouse.currentTime > 0;
  const isCompleted = greenhouse.currentTime === 0;

  return (
    <div className="not-last:border-b-4 not-last:pb-1">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-4xl font-bold text-gray-800">{greenhouse.label}</h2>
        <Button onClick={onClick} compact className="w-auto">
          ➜
        </Button>
      </div>

      <div className="space-y-1.5">
        <div className="text-lg text-gray-600">
          <span className="font-medium">{LABELS.lastWatered}</span>
          <div className="text-gray-800 text-2xl">{formatLastRun(lastRun)}</div>
        </div>

        {isCompleted && (
          <div className="text-green-600 font-medium text-2xl">
            {LABELS.wateringCompleted}
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("greenhouse-app-state-v2");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        Object.keys(parsed.greenhouses).forEach((key) => {
          if (parsed.greenhouses[key].lastRun) {
            parsed.greenhouses[key].lastRun = new Date(
              parsed.greenhouses[key].lastRun
            );
          }
          if (parsed.greenhouses[key].targetTime) {
            parsed.greenhouses[key].targetTime = new Date(
              parsed.greenhouses[key].targetTime
            );
          }
        });
        if (!parsed.activeTimer) {
          parsed.activeTimer = null;
        }
        return parsed;
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [logs, setLogs] = useState<LogsState>(() => {
    const saved = localStorage.getItem("greenhouse-logs-v1");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        parsed.entries = parsed.entries.map((entry: any) => ({
          ...entry,
          date: new Date(entry.date),
        }));
        return parsed;
      } catch {
        return defaultLogsState;
      }
    }
    return defaultLogsState;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<string | null>(
    null
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("greenhouse-app-state-v2", JSON.stringify(state));
  }, [state]);

  // Save logs to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("greenhouse-logs-v1", JSON.stringify(logs));
  }, [logs]);

  // Timer update effect
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prevState) => {
        const newState = { ...prevState };
        let hasChanges = false;

        Object.keys(newState.greenhouses).forEach((key) => {
          const greenhouse = newState.greenhouses[key];
          if (greenhouse.currentTime !== null && greenhouse.currentTime > 0) {
            const newTime = greenhouse.currentTime - 1;
            newState.greenhouses[key] = {
              ...greenhouse,
              currentTime: newTime,
            };
            hasChanges = true;

            // If timer just completed, add to logs
            if (newTime === 0 && greenhouse.targetTime && greenhouse.lastRun) {
              const duration = Math.round(
                (greenhouse.targetTime.getTime() -
                  greenhouse.lastRun.getTime()) /
                  (1000 * 60)
              );

              setLogs((prevLogs) =>
                addLogEntry(prevLogs, {
                  greenhouseId: key,
                  date: greenhouse.lastRun!,
                  duration,
                  status: "completed",
                })
              );
            }
          }
        });

        return hasChanges ? newState : prevState;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleGreenhouseClick = useCallback(
    (id: string) => {
      const greenhouse = state.greenhouses[id];

      // If timer is completed, reset it and go back to overview
      if (greenhouse.currentTime === 0) {
        setState((prevState) => ({
          ...prevState,
          activeTimer: null,
          greenhouses: {
            ...prevState.greenhouses,
            [id]: {
              ...prevState.greenhouses[id],
              currentTime: null,
              targetTime: null,
            },
          },
        }));
        return;
      }

      // If timer is running, do nothing (user is already in timer view)
      if (greenhouse.currentTime !== null && greenhouse.currentTime > 0) {
        return;
      }

      // Otherwise, open timer selection modal
      setSelectedGreenhouse(id);
      setModalOpen(true);
    },
    [state.greenhouses]
  );

  const handleTimerSelect = useCallback(
    (minutes: number) => {
      if (!selectedGreenhouse) return;

      const now = new Date();
      const targetTime = new Date(now.getTime() + minutes * 60 * 1000);

      setState((prevState) => ({
        ...prevState,
        activeTimer: selectedGreenhouse,
        greenhouses: {
          ...prevState.greenhouses,
          [selectedGreenhouse]: {
            ...prevState.greenhouses[selectedGreenhouse],
            lastRun: now,
            currentTime: minutes * 60,
            targetTime: targetTime,
          },
        },
      }));

      setModalOpen(false);
      setSelectedGreenhouse(null);
    },
    [selectedGreenhouse]
  );

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedGreenhouse(null);
  }, []);

  const handleTimerCancel = useCallback(() => {
    if (!state.activeTimer) return;

    const greenhouse = state.greenhouses[state.activeTimer];

    setState((prevState) => {
      const newState = { ...prevState };

      // If there was a running timer, add it to logs as a canceled run
      if (
        greenhouse.currentTime !== null &&
        greenhouse.currentTime > 0 &&
        greenhouse.lastRun &&
        greenhouse.targetTime
      ) {
        const totalDuration = Math.round(
          (greenhouse.targetTime.getTime() - greenhouse.lastRun.getTime()) /
            (1000 * 60)
        );
        const actualDuration =
          totalDuration - Math.round(greenhouse.currentTime / 60);

        setLogs((prevLogs) =>
          addLogEntry(prevLogs, {
            greenhouseId: state.activeTimer!,
            date: greenhouse.lastRun!,
            duration: actualDuration,
            status: "canceled",
          })
        );
      }

      // Reset greenhouse state
      newState.greenhouses[state.activeTimer] = {
        ...newState.greenhouses[state.activeTimer],
        currentTime: null,
        targetTime: null,
      };

      newState.activeTimer = null;
      return newState;
    });
  }, [state.activeTimer, state.greenhouses]);

  return (
    <>
      {state.activeTimer ? (
        <TimerView
          greenhouse={state.greenhouses[state.activeTimer]}
          logs={getGreenhouseLogs(logs, state.activeTimer)}
          onCancel={handleTimerCancel}
        />
      ) : (
        <div className="min-h-screen bg-gray-100 p-3">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-3 flex flex-row gap-1">
              <h1 className="font-bold text-gray-800 mb-1 text-xs">
                {LABELS.appTitle}
              </h1>
              <p className="text-gray-600 text-xs">➜ {LABELS.appSubtitle}</p>
            </div>

            <div className="space-y-3">
              {Object.entries(state.greenhouses).map(([id, greenhouse]) => (
                <GreenhouseCard
                  key={id}
                  id={id}
                  greenhouse={greenhouse}
                  lastRun={getLatestRun(logs, id)}
                  onClick={() => handleGreenhouseClick(id)}
                />
              ))}
            </div>
          </div>

          <TimerModal
            isOpen={modalOpen}
            onClose={handleModalClose}
            onSelectTimer={handleTimerSelect}
            greenhouseName={
              selectedGreenhouse
                ? state.greenhouses[selectedGreenhouse].label
                : ""
            }
          />
        </div>
      )}
    </>
  );
}

render(<App />, document.getElementById("app"));
