import { useKeyPressContext } from "../context/provider";

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

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: theme === "dark" ? "#1a1a1a" : "#ffffff",
          color: theme === "dark" ? "#ffffff" : "#000000",
          borderRadius: "8px",
          padding: "24px",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2 style={{ margin: 0 }}>Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: theme === "dark" ? "#ffffff" : "#000000",
            }}
          >
            ×
          </button>
        </div>

        {handlers.length === 0 ? (
          <p>No keyboard shortcuts registered yet.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {handlers.map((handler) => (
              <li
                key={handler.id}
                style={{
                  padding: "12px 0",
                  borderBottom: theme === "dark" ? "1px solid #333" : "1px solid #e5e5e5",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{handler.description}</span>
                <kbd
                  style={{
                    backgroundColor: theme === "dark" ? "#333" : "#f0f0f0",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontFamily: "monospace",
                    marginLeft: "16px",
                  }}
                >
                  {handler.key}
                </kbd>
              </li>
            ))}
          </ul>
        )}

        <div style={{ marginTop: "16px", fontSize: "12px", opacity: 0.7 }}>
          Press <kbd>{helpKey}</kbd> to toggle this dialog
        </div>
      </div>
    </div>
  );
};
