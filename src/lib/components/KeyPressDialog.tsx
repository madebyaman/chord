import "./style.css";
import { useState, useMemo } from "react";
import { useGroupedHandlers } from "../hooks/use-handlers";
import Drawer from "./drawer";

interface KeyPressDialogProps {
  helpKey?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const KeyPressDialog = ({
  helpKey = "?",
  isOpen,
  onClose,
}: KeyPressDialogProps) => {
  const { handlers, groupedHandlers } = useGroupedHandlers();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter handlers based on search query
  const filteredHandlers = useMemo(() => {
    if (!searchQuery.trim()) return handlers;

    const query = searchQuery.toLowerCase();
    return handlers.filter(
      (handler) =>
        handler.description.toLowerCase().includes(query) ||
        handler.keySequence.some((key) => key.toLowerCase().includes(query)) ||
        handler.category?.toLowerCase().includes(query),
    );
  }, [handlers, searchQuery]);

  // Group filtered handlers by category
  const filteredGroupedHandlers = useMemo(() => {
    if (!searchQuery.trim()) return groupedHandlers;

    const groups = new Map<string, typeof handlers>();

    filteredHandlers.forEach((handler) => {
      const category = handler.category || "General";
      if (!groups.has(category)) {
        groups.set(category, []);
      }
      groups.get(category)!.push(handler);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredHandlers, groupedHandlers, searchQuery]);

  return (
    <Drawer.Root open={isOpen} onOpenChange={onClose}>
      <Drawer.Header>
        <Drawer.Title>Keyboard Shortcuts</Drawer.Title>
        <Drawer.Close />
      </Drawer.Header>
      <div className="px-5 pt-4">
        <input
          type="text"
          placeholder="Search shortcuts..."
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 mb-4 rounded border text-sm outline-none focus:ring-2 bg-white dark:bg-neutral-800 border-gray-300 dark:border-neutral-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-blue-500 dark:focus:ring-neutral-600"
        />
      </div>

      <Drawer.Content>
        {filteredHandlers.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            {searchQuery
              ? "No shortcuts match your search."
              : "No keyboard shortcuts registered yet."}
          </p>
        ) : (
          <div className="space-y-6">
            {filteredGroupedHandlers.map(([category, categoryHandlers]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold uppercase tracking-wide mb-2 text-gray-600 dark:text-gray-400">
                  {category}
                </h3>
                <ul className="space-y-0">
                  {categoryHandlers.map((handler) => (
                    <li
                      key={handler.keySequence.join("")}
                      className="py-3 flex justify-between items-center border-b last:border-b-0 border-gray-200 dark:border-neutral-800"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-200">
                        {handler.description}
                      </span>
                      <div className="flex gap-1">
                        {handler.keySequence.map((key, idx) => (
                          <kbd
                            key={idx}
                            className="px-2 py-1 rounded text-xs font-mono border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-neutral-800"
                          >
                            {key}
                          </kbd>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 text-xs text-gray-600 dark:text-gray-500">
          Press{" "}
          <kbd className="px-2 py-1 rounded text-xs font-mono border border-gray-300 dark:border-neutral-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-neutral-800">
            {helpKey}
          </kbd>{" "}
          to toggle this dialog
        </div>
      </Drawer.Content>
    </Drawer.Root>
  );
};
