import { useState } from "react";
import "./App.css";
import { useKeyPress } from "./lib/use-keypress";

function App() {
  const [count, setCount] = useState(0);
  useKeyPress({
    key: "Enter",
    onPress: () => setCount((count) => count + 1),
    description: "Increment the count",
  });

  return <div>The count is {count}</div>;
}

export default App;
