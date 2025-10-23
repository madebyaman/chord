import "./style.css";
import { useKeyPressContext } from "../context/provider";
import Drawer from "./drawer";

interface KeyPressDialogProps {
  helpKey?: string;
  theme?: "light" | "dark";
  isOpen: boolean;
  onClose: () => void;
}

export const KeyPressDialog = ({
  helpKey = "?",
  theme = "light",
  isOpen,
  onClose,
}: KeyPressDialogProps) => {
  const chordCore = useKeyPressContext();
  const handlers = chordCore.getHandlers();

  return (
    <Drawer open={isOpen} setOpen={onClose} title="Keyboard Shortcuts">
      {handlers.length === 0 ? (
        <p className="text-gray-100">No keyboard shortcuts registered yet.</p>
      ) : (
        <ul className="space-y-0">
          {handlers.map((handler) => (
            <li
              key={handler.keySequence.join("")}
              className="py-3 flex justify-between items-center"
            >
              <span className="text-gray-200 text-sm">
                {handler.description}
              </span>
              {handler.keySequence.map((s) => (
                <kbd className="border-neutral-800 border text-gray-200 px-2 py-1 rounded text-xs font-mono ml-2">
                  {s}
                </kbd>
              ))}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 text-xs text-gray-500">
        Press{" "}
        <kbd className="border-neutral-800 border text-gray-200 px-2 py-1 rounded text-xs font-mono">
          {helpKey}
        </kbd>{" "}
        to toggle this dialog
      </div>
    </Drawer>
  );
};
