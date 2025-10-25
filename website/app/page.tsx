"use client";

import { useState } from "react";
import {
  ShortcutsDialog,
  useKeyPress,
  useKeySequence,
} from "chord-keys";

export default function Home() {
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(false);

  // Counter category
  useKeyPress({
    key: "cmd+1",
    onPress: () => setCount((count) => count + 1),
    description: "Increment the count",
    category: "Counter",
    enabled,
  });
  useKeyPress({
    key: "cmd+0",
    onPress: () => setCount((count) => count - 1),
    description: "Decrement the count",
    category: "Counter",
  });
  useKeyPress({
    key: "cmd+r",
    onPress: () => setCount(0),
    preventDefault: true,
    description: "Reset counter to zero",
    category: "Counter",
  });

  // Navigation category
  useKeySequence({
    sequence: ["g", "h"],
    onComplete: () => console.log("Go to home"),
    description: "Navigate to home",
    category: "Navigation",
  });
  useKeySequence({
    sequence: ["g", "p"],
    onComplete: () => console.log("Go to profile"),
    description: "Navigate to profile",
    category: "Navigation",
  });
  useKeySequence({
    sequence: ["g", "s"],
    onComplete: () => console.log("Go to settings"),
    description: "Navigate to settings",
    category: "Navigation",
  });

  // Editor category
  useKeyPress({
    key: "cmd+s",
    onPress: () => console.log("Save"),
    description: "Save current document",
    category: "Editor",
  });
  useKeyPress({
    key: "cmd+shift+s",
    onPress: () => console.log("Save as"),
    description: "Save document as...",
    category: "Editor",
  });
  useKeyPress({
    key: "cmd+z",
    onPress: () => console.log("Undo"),
    description: "Undo last action",
    category: "Editor",
  });
  useKeyPress({
    key: "cmd+shift+z",
    onPress: () => console.log("Redo"),
    description: "Redo last action",
    category: "Editor",
  });

  // View category
  useKeyPress({
    key: "cmd+b",
    onPress: () => console.log("Toggle sidebar"),
    description: "Toggle sidebar visibility",
    category: "View",
  });
  useKeyPress({
    key: "cmd+\\",
    onPress: () => console.log("Toggle panel"),
    description: "Toggle bottom panel",
    category: "View",
  });

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold mb-4">Chord Keys Demo</h1>
      <p className="text-lg mb-8">
        Advanced keyboard shortcuts library for React
      </p>

      <div className="mb-4">
        <p className="text-2xl">The count is {count}</p>
        <button
          onClick={() => setEnabled(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Enable first shortcut
        </button>
      </div>

      <ShortCutDialog />
    </main>
  );
}

function ShortCutDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 mr-2"
      >
        Show Shortcuts
      </button>
      <ShortcutsDialog
        helpKey="?"
        theme="dark"
      />
      <button
        onClick={() => setShow(!show)}
        className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
      >
        Mount Another Hook
      </button>
      {show && <Watcher />}
    </>
  );
}

function Watcher() {
  useKeyPress({
    key: "cmd+2",
    onPress: () => console.log("hey"),
    description: "Log to console",
    category: "Debug",
  });
  useKeyPress({
    key: "cmd+shift+d",
    onPress: () => console.log("Debug mode"),
    description: "Toggle debug mode",
    category: "Debug",
  });

  return null;
}
