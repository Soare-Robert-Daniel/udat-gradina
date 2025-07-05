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

import "./style.css";

const LABELS = {
  appTitle: "🌱 Grădină",
  appSubtitle: "Temporizator pentru udat",
  setTimerFor: "Setează temporizatorul pentru",
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
};

const GREENHOUSE_NUMS: number = 5;

interface Greenhouse {
  label: string;
  lastRun: Date | null;
  currentTime: number | null;
  targetTime: Date | null;
}

interface AppState {
  greenhouses: Record<string, Greenhouse>;
}

const defaultState: AppState = {
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

const TIMER_OPTIONS = [5, 10, 15, 20, 25, 30]; // minutes

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
            <button
              key={minutes}
              onClick={() => onSelectTimer(minutes)}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
            >
              {minutes} {LABELS.minutesShort}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-3 rounded-lg transition-colors text-sm"
        >
          {LABELS.cancel}
        </button>
      </div>
    </div>
  );
}

interface GreenhouseCardProps {
  id: string;
  greenhouse: Greenhouse;
  onClick: () => void;
}

function GreenhouseCard({ id, greenhouse, onClick }: GreenhouseCardProps) {
  const isRunning =
    greenhouse.currentTime !== null && greenhouse.currentTime > 0;
  const isCompleted = greenhouse.currentTime === 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-1 cursor-pointer transition-all hover:shadow-lg ${
        isRunning
          ? "ring-2 ring-blue-400"
          : isCompleted
          ? "ring-2 ring-green-400"
          : ""
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-800">{greenhouse.label}</h2>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isRunning
              ? "bg-blue-500"
              : isCompleted
              ? "bg-green-500"
              : "bg-gray-300"
          }`}
        />
      </div>

      <div className="space-y-1.5">
        {isRunning && (
          <div className="text-xs text-gray-600">
            <span className="font-medium">{LABELS.timeRemaining}</span>
            <div className="text-2xl font-mono text-red-600 font-bold">
              {formatTimeRemaining(greenhouse.currentTime!)}
            </div>
          </div>
        )}
        <div className="text-xs text-gray-600">
          <span className="font-medium">{LABELS.lastWatered}</span>
          <div className="text-gray-800 text-sm">
            {formatLastRun(greenhouse.lastRun)}
          </div>
        </div>

        {isCompleted && (
          <div className="text-green-600 font-medium text-sm">
            {LABELS.wateringCompleted}
          </div>
        )}

        {!isRunning && !isCompleted && (
          <div className="text-gray-500 text-xs">{LABELS.tapToStart}</div>
        )}
      </div>
    </div>
  );
}

export function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem("greenhouse-app-state-v1");
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
        return parsed;
      } catch {
        return defaultState;
      }
    }
    return defaultState;
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<string | null>(
    null
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("greenhouse-app-state", JSON.stringify(state));
  }, [state]);

  // Timer update effect
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prevState) => {
        const newState = { ...prevState };
        let hasChanges = false;

        Object.keys(newState.greenhouses).forEach((key) => {
          const greenhouse = newState.greenhouses[key];
          if (greenhouse.currentTime !== null && greenhouse.currentTime > 0) {
            newState.greenhouses[key] = {
              ...greenhouse,
              currentTime: greenhouse.currentTime - 1,
            };
            hasChanges = true;
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

      // If timer is completed, reset it
      if (greenhouse.currentTime === 0) {
        setState((prevState) => ({
          ...prevState,
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

      // If timer is running, do nothing (or you could pause/stop it)
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

  return (
    <div className="min-h-screen bg-gray-100 p-3">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-3">
          <h1 className="font-bold text-gray-800 mb-1 text-xs">
            {LABELS.appTitle}
          </h1>
          <p className="text-gray-600 text-xs">{LABELS.appSubtitle}</p>
        </div>

        <div className="space-y-3">
          {Object.entries(state.greenhouses).map(([id, greenhouse]) => (
            <GreenhouseCard
              key={id}
              id={id}
              greenhouse={greenhouse}
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
          selectedGreenhouse ? state.greenhouses[selectedGreenhouse].label : ""
        }
      />
    </div>
  );
}

render(<App />, document.getElementById("app"));
