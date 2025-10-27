"use client";

import { useState } from "react";

export function FloatingHelpButton() {
  const [showHint, setShowHint] = useState(true);

  return (
    <div
      className="fixed bottom-8 right-8 z-40"
      onMouseEnter={() => setShowHint(true)}
      onMouseLeave={() => setShowHint(false)}
    >
      {/* Hint tooltip */}
      <div
        className={`absolute bottom-16 right-0 whitespace-nowrap transition-all duration-300 ${
          showHint ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
          Press <kbd className="bg-slate-800 px-2 py-1 rounded text-xs font-mono">?</kbd> for help
        </div>
      </div>

      {/* Help button */}
      <button
        className="relative w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center font-bold text-xl group"
        title="Press ? to see all keyboard shortcuts"
        aria-label="Show keyboard shortcuts"
      >
        ?
        {/* Pulsing ring animation */}
        <span className="absolute inset-0 rounded-full bg-blue-600 opacity-75 group-hover:opacity-0 animate-pulse" />
      </button>
    </div>
  );
}
