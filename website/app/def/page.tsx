"use client"

import { useKeyPress, useKeyboardShortcuts } from "chord-keys";
import { use, useState } from "react";

export default function Page()  {
  const [enabled, setEnabled] = useState(false)
  const [count, setCount] = useState(1)
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
  useKeyPress({
    key: "g",
    onPress: () => setCount(count + 1),
    description: "Toggle debug mode",
    enabled,
    category: "Debug",
  });
  const {handlers} = useKeyboardShortcuts()

  return (<div>
    <pre>{JSON.stringify(handlers, null, 2)}</pre>;
    <button onClick={() => setEnabled(true)}>Enable</button>
    <p>{count}</p>
  </div>);
}
