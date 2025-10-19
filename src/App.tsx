import { useState } from "react";
import "./App.css";
import { KeyPressDialog, useKeyPress } from "./lib";

function App() {
  const [count, setCount] = useState(0);
  const [enabled, setEnabled] = useState(false);

  useKeyPress({
    key: "cmd+1",
    onPress: () => setCount((count) => count + 1),
    description: "Increment the count",
    enabled,
  });
  useKeyPress({
    key: "cmd+0",
    onPress: () => setCount((count) => count - 1),
    description: "Decrement the count",
  });

  return (
    <div>
      The count is {count}. <button onClick={() => setEnabled(true)}>Unrelated change</button>
      <ShortCutDialog />
    </div>
  );
}

function ShortCutDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [show, setShow] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Show Shortcuts</button>
      <KeyPressDialog helpKey="?" theme="dark" isOpen={isOpen} onClose={() => setIsOpen(false)} />
      <button onClick={() => setShow(!show)}>Mount Another hook</button>
      {show && <Watcher />}
    </>
  );
}

function Watcher() {
  useKeyPress({
    key: "cmd+2",
    onPress: () => console.log("hey"),
    description: "Log to console",
  });

  return null;
}

export default App;
