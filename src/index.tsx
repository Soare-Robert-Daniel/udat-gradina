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
  greenhouses: {
    solar1: {
      label: "Solar 1",
      lastRun: null,
      currentTime: null,
      targetTime: null,
    },
    solar2: {
      label: "Solar 2",
      lastRun: null,
      currentTime: null,
      targetTime: null,
    },
  },
};

const TIMER_OPTIONS = [5, 10, 15, 20, 25, 30]; // minutes

function formatTimeRemaining(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function formatLastRun(date: Date | null): string {
  if (!date) return 'Never';
  return new Intl.DateTimeFormat(navigator.language, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date);
}

interface TimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTimer: (minutes: number) => void;
  greenhouseName: string;
}

function TimerModal({ isOpen, onClose, onSelectTimer, greenhouseName }: TimerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          Set Timer for {greenhouseName}
        </h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {TIMER_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              onClick={() => onSelectTimer(minutes)}
              className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {minutes} min
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          Cancel
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
  const isRunning = greenhouse.currentTime !== null && greenhouse.currentTime > 0;
  const isCompleted = greenhouse.currentTime === 0;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all hover:shadow-lg ${
        isRunning ? 'ring-2 ring-blue-400' : isCompleted ? 'ring-2 ring-green-400' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{greenhouse.label}</h2>
        <div className={`w-3 h-3 rounded-full ${
          isRunning ? 'bg-blue-500' : isCompleted ? 'bg-green-500' : 'bg-gray-300'
        }`} />
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Last watered:</span>
          <div className="text-gray-800">{formatLastRun(greenhouse.lastRun)}</div>
        </div>
        
        {isRunning && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Time remaining:</span>
            <div className="text-2xl font-mono text-blue-600 font-bold">
              {formatTimeRemaining(greenhouse.currentTime!)}
            </div>
          </div>
        )}
        
        {isCompleted && (
          <div className="text-green-600 font-medium">
            ✓ Watering completed!
          </div>
        )}
        
        {!isRunning && !isCompleted && (
          <div className="text-gray-500 text-sm">
            Tap to start watering timer
          </div>
        )}
      </div>
    </div>
  );
}

export function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('greenhouse-app-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        Object.keys(parsed.greenhouses).forEach(key => {
          if (parsed.greenhouses[key].lastRun) {
            parsed.greenhouses[key].lastRun = new Date(parsed.greenhouses[key].lastRun);
          }
          if (parsed.greenhouses[key].targetTime) {
            parsed.greenhouses[key].targetTime = new Date(parsed.greenhouses[key].targetTime);
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
  const [selectedGreenhouse, setSelectedGreenhouse] = useState<string | null>(null);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('greenhouse-app-state', JSON.stringify(state));
  }, [state]);

  // Timer update effect
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prevState => {
        const newState = { ...prevState };
        let hasChanges = false;

        Object.keys(newState.greenhouses).forEach(key => {
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

  const handleGreenhouseClick = useCallback((id: string) => {
    const greenhouse = state.greenhouses[id];
    
    // If timer is completed, reset it
    if (greenhouse.currentTime === 0) {
      setState(prevState => ({
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
  }, [state.greenhouses]);

  const handleTimerSelect = useCallback((minutes: number) => {
    if (!selectedGreenhouse) return;
    
    const now = new Date();
    const targetTime = new Date(now.getTime() + minutes * 60 * 1000);
    
    setState(prevState => ({
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
  }, [selectedGreenhouse]);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setSelectedGreenhouse(null);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🌱 Greenhouse Watering
          </h1>
          <p className="text-gray-600">
            Track your greenhouse watering schedule
          </p>
        </div>
        
        <div className="space-y-4">
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
        greenhouseName={selectedGreenhouse ? state.greenhouses[selectedGreenhouse].label : ''}
      />
    </div>
  );
}

render(<App />, document.getElementById("app"));
