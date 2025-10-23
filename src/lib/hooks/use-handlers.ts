import { useKeyPressContext } from "../context/provider";

export const useGroupedHandlers = () => {
  const { instance } = useKeyPressContext();
  const handlers = instance.handlers;

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
