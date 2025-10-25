import "./style.css";
import { useState, useMemo } from "react";
import { useKeyboardShortcuts } from "../hooks/use-keyboard-shortcuts";
import Drawer from "./drawer";
import {
  Command,
  ArrowBigUp,
  CornerDownLeft,
  Delete,
  Option,
} from "lucide-react";

interface ShortcutsDialogProps {
  helpKey?: string;
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get icon for a single key part
const getKeyIcon = (key: string, size: number = 14) => {
  const lowerKey = key.toLowerCase();
  const iconProps = { className: "shrink-0", size, strokeWidth: 2 };

  if (
    lowerKey === "ctrl" ||
    lowerKey === "control" ||
    lowerKey === "cmd" ||
    lowerKey === "command" ||
    lowerKey === "⌘"
  ) {
    return <Command {...iconProps} />;
  }
  if (lowerKey === "shift" || lowerKey === "⇧") {
    return <ArrowBigUp {...iconProps} />;
  }
  if (lowerKey === "enter" || lowerKey === "return" || lowerKey === "↵") {
    return <CornerDownLeft {...iconProps} />;
  }
  if (lowerKey === "backspace" || lowerKey === "delete" || lowerKey === "⌫") {
    return <Delete {...iconProps} />;
  }
  if (lowerKey === "alt" || lowerKey === "option" || lowerKey === "⌥") {
    return <Option {...iconProps} />;
  }

  return null;
};

// Helper function to render a key combination (e.g., "cmd+shift+s")
const renderKeyCombo = (keyCombo: string, iconSize: number = 14) => {
  const parts = keyCombo.split("+");

  return parts.map((part, index) => {
    const icon = getKeyIcon(part.trim(), iconSize);
    const content = icon || part.trim().toUpperCase();

    return (
      <span key={index} className="key-combo-part">
        {content}
      </span>
    );
  });
};

export const ShortcutsDialog = ({
  helpKey = "?",
  isOpen,
  onClose,
}: ShortcutsDialogProps) => {
  const { handlers, groupedHandlers } = useKeyboardShortcuts();
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
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Header>
        <Drawer.Title>Keyboard Shortcuts</Drawer.Title>
        <Drawer.Close />
      </Drawer.Header>
      <div className="shortcuts-search-wrapper">
        <input
          type="text"
          placeholder="Search shortcuts..."
          autoFocus
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="shortcuts-search-input"
        />
      </div>

      <Drawer.Content>
        {filteredHandlers.length === 0 ? (
          <p className="shortcuts-empty">
            {searchQuery
              ? "No shortcuts match your search."
              : "No keyboard shortcuts registered yet."}
          </p>
        ) : (
          <div className="shortcuts-list">
            {filteredGroupedHandlers.map(([category, categoryHandlers]) => (
              <div key={category} className="shortcuts-category">
                <h3 className="shortcuts-category-title">
                  {category}
                </h3>
                <ul className="shortcuts-items">
                  {categoryHandlers.map((handler) => (
                    <li
                      key={handler.keySequence.join("")}
                      className="shortcuts-item"
                    >
                      <span className="shortcuts-item-description">
                        {handler.description}
                      </span>
                      <div className="shortcuts-item-keys">
                        {handler.keySequence.map((key, idx) => {
                          return (
                            <kbd
                              key={idx}
                              title={key}
                              className="shortcuts-kbd"
                            >
                              {renderKeyCombo(key)}
                            </kbd>
                          );
                        })}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <div className="shortcuts-footer">
          Press{" "}
          <kbd className="shortcuts-kbd shortcuts-kbd-small">
            {renderKeyCombo(helpKey, 11)}
          </kbd>{" "}
          to toggle this dialog
        </div>
      </Drawer.Content>
    </Drawer.Root>
  );
};
