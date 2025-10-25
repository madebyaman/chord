import { useEffect, useState } from "react";
import { useKeyPressContext } from "../context/provider";

export const useKeyboardShortcuts = () => {
  const { instance } = useKeyPressContext();
  const [handlers, setHandlers] = useState(() => instance.handlers);

  useEffect(() => {
    const unsub = instance.subscribe(() => setHandlers(instance.handlers))
    return unsub
  } ,[instance])

  // Group handlers by category
  const groups = new Map<string, typeof handlers>();

  handlers.forEach((handler) => {
    const category = handler.category || "General";
    if (!groups.has(category)) {
      groups.set(category, []);
    }
    groups.get(category)!.push(handler);
  });

  const groupedHandlers = Array.from(groups.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  return {
    handlers,
    groupedHandlers,
  };
};
