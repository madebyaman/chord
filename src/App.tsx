import { useState } from "react";
import "./App.css";
import { useKeyPress } from "./lib/use-keypress";

function App() {
  const [count, setCount] = useState(0);
  const [, rerender] = useState({});

  useKeyPress({
    key: "ctrl+s",
    onPress: () => setCount((count) => count + 1),
    description: "Increment the count",
  });
  useKeyPress({
    key: "Escape",
    onPress: () => setCount((count) => count - 1),
    description: "Increment the count",
  });

  return (
    <div>
      The count is {count}. <button onClick={() => rerender({})}>Unrelated change</button>
    </div>
  );
}

export default App;
