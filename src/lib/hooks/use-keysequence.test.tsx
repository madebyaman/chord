/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { render } from "vitest-browser-react";
import { useKeySequence } from "./use-keysequence";
import { KeyPressProvider, useKeyPressContext } from "../context/provider";
import type { ReactNode } from "react";
import * as React from "react";

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <KeyPressProvider>{children}</KeyPressProvider>
  );
};

// Helper to dispatch keyboard events
const dispatchKey = (
  key: string,
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  },
) => {
  const event = new KeyboardEvent("keydown", {
    key,
    ctrlKey: modifiers?.ctrl,
    shiftKey: modifiers?.shift,
    altKey: modifiers?.alt,
    metaKey: modifiers?.meta,
  });
  window.dispatchEvent(event);
};

describe("useKeySequence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Basic sequence functionality", () => {
    it("triggers when full sequence entered", async () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "g"
      dispatchKey("g");
      expect(onComplete).not.toHaveBeenCalled();

      // Press "h"
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not trigger for partial sequence", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press only "g"
      dispatchKey("g");
      expect(onComplete).not.toHaveBeenCalled();

      // Even after advancing timers
      vi.advanceTimersByTime(100);
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("order matters - wrong order doesn't trigger", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press in wrong order: "h", "g"
      dispatchKey("h");
      dispatchKey("g");

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Timeout behavior", () => {
    it("timeout clears sequence", async () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            timeout: 1000,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "g"
      dispatchKey("g");
      expect(onComplete).not.toHaveBeenCalled();

      // Wait more than timeout
      vi.advanceTimersByTime(1100);

      // Press "h" - should not trigger because sequence timed out
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("custom timeout works correctly", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            timeout: 500, // Custom timeout
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "g"
      dispatchKey("g");

      // Wait less than custom timeout but more than default
      vi.advanceTimersByTime(600);

      // Press "h" - should not trigger because custom timeout expired
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("sequence completes within timeout", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            timeout: 1000,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "g"
      dispatchKey("g");

      // Wait less than timeout
      vi.advanceTimersByTime(500);

      // Press "h" - should trigger because within timeout
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("buffer and timer clear after partial match timeout", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Three key sequence",
            timeout: 800,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "g", "h" (partial match)
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();

      // Wait for timeout to expire
      vi.advanceTimersByTime(900);

      // Press "e" - should NOT complete the sequence because buffer was cleared
      dispatchKey("e");
      expect(onComplete).not.toHaveBeenCalled();

      // Verify sequence works after reset by pressing full sequence
      dispatchKey("g");
      dispatchKey("h");
      dispatchKey("e");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Overlapping sequences", () => {
    it("longer overlapping sequence fires when completed", () => {
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete: onShortComplete,
          });

          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Go to home extended",
            onComplete: onLongComplete,
          });
        },
        { wrapper: createWrapper() },
      );

      // Press "g", "h", "e" - only longer sequence should fire
      dispatchKey("g");
      dispatchKey("h");
      dispatchKey("e");

      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).toHaveBeenCalledTimes(1);
    });

    it("shorter sequence fires if delay before next key", () => {
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            timeout: 1000,
            onComplete: onShortComplete,
          });

          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Go to home extended",
            timeout: 1000,
            onComplete: onLongComplete,
          });
        },
        { wrapper: createWrapper() },
      );

      // Press "g", "h"
      dispatchKey("g");
      dispatchKey("h");

      // Short sequence should fire immediately
      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).not.toHaveBeenCalled();

      // Wait and press "e" - should not trigger long sequence because buffer was cleared
      vi.advanceTimersByTime(1100);
      dispatchKey("e");

      expect(onLongComplete).not.toHaveBeenCalled();
      expect(onShortComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Timing-based overlapping sequences", () => {
    it("shorter sequence with longer timeout fires when longer sequence times out", () => {
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Short sequence",
            timeout: 500,
            onComplete: onShortComplete,
          });

          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Long sequence",
            timeout: 400,
            onComplete: onLongComplete,
          });
        },
        { wrapper: createWrapper() },
      );

      // Press "g", "h"
      dispatchKey("g");
      dispatchKey("h");

      // Wait for longer sequence to timeout (450ms > 400ms but < 500ms)
      vi.advanceTimersByTime(450);

      expect(onLongComplete).not.toHaveBeenCalled();
      expect(onShortComplete).toHaveBeenCalledTimes(1);
    });

    it("shorter sequence with shorter timeout fires after waiting for longer timeout", () => {
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Short sequence",
            timeout: 300,
            onComplete: onShortComplete,
          });

          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Long sequence",
            timeout: 1000,
            onComplete: onLongComplete,
          });
        },
        { wrapper: createWrapper() },
      );

      // Press "g", "h"
      dispatchKey("g");
      dispatchKey("h");

      // Wait for shorter sequence to fire (350ms > 300ms)
      vi.advanceTimersByTime(1050);
      expect(onShortComplete).toHaveBeenCalledTimes(1);
      expect(onLongComplete).not.toHaveBeenCalled();

      // Try to complete longer sequence - should fail because buffer was cleared
      dispatchKey("e");
      expect(onLongComplete).not.toHaveBeenCalled();
    });

    it("longer sequence fires when all keys pressed within both timeouts", () => {
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Short sequence",
            timeout: 400,
            onComplete: onShortComplete,
          });

          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Long sequence",
            timeout: 600,
            onComplete: onLongComplete,
          });
        },
        { wrapper: createWrapper() },
      );

      // Press "g", "h"
      dispatchKey("g");
      dispatchKey("h");

      // Wait 200ms (< both timeouts)
      vi.advanceTimersByTime(200);

      // Press "e" to complete longer sequence
      dispatchKey("e");

      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).toHaveBeenCalledTimes(1);
    });

    it("both sequences timeout when delay exceeds timeout values", () => {
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Short sequence",
            timeout: 500,
            onComplete: onShortComplete,
          });

          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Long sequence",
            timeout: 500,
            onComplete: onLongComplete,
          });
        },
        { wrapper: createWrapper() },
      );

      // Press "g"
      dispatchKey("g");

      // Wait longer than timeout
      vi.advanceTimersByTime(600);

      // Press "h" - should not trigger any sequence
      dispatchKey("h");

      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).not.toHaveBeenCalled();
    });
  });

  describe("Modifiers in sequence", () => {
    it("works with modifiers like ctrl+k followed by b", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["ctrl+k", "b"],
            description: "Toggle sidebar",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "ctrl+k"
      dispatchKey("k", { ctrl: true });
      expect(onComplete).not.toHaveBeenCalled();

      // Press "b"
      dispatchKey("b");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("works with meta key sequences", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["meta+k", "v"],
            description: "Open view",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "meta+k"
      dispatchKey("k", { meta: true });

      // Press "v"
      dispatchKey("v");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("multiple modifiers in sequence work correctly", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["ctrl+shift+k", "b"],
            description: "Complex sequence",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Press "ctrl+shift+k"
      dispatchKey("k", { ctrl: true, shift: true });

      // Press "b"
      dispatchKey("b");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Back-to-back sequences", () => {
    it("handles back-to-back sequences correctly", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // First sequence: "g", "h"
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Second sequence: "g", "h"
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it("buffer is cleared after successful match", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Complete sequence
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Press unrelated key
      dispatchKey("x");

      // Press "h" - should not trigger because buffer was cleared
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("enabled prop", () => {
    it("disabled sequence is ignored", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            enabled: false,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Try to trigger sequence
      dispatchKey("g");
      dispatchKey("h");

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("enabled=true allows sequence to work", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            enabled: true,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      dispatchKey("g");
      dispatchKey("h");

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("enabled defaults to true when not specified", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go to home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      dispatchKey("g");
      dispatchKey("h");

      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("description prop", () => {
    it("is included in getHandlers()", () => {
      const { result } = renderHook(
        () => {
          const context = useKeyPressContext();
          useKeySequence({
            sequence: ["g", "h"],
            description: "My custom sequence",
            onComplete: vi.fn(),
          });
          return context;
        },
        { wrapper: createWrapper() },
      );

      const handlers = result.current.getHandlers();
      const handler = handlers.find(
        (h) => h.description === "My custom sequence",
      );
      expect(handler).toBeDefined();
      expect(handler?.keySequence).toEqual(["g", "h"]);
    });
  });

  describe("category prop", () => {
    it('defaults to "General"', () => {
      const { result } = renderHook(
        () => {
          const context = useKeyPressContext();
          useKeySequence({
            sequence: ["g", "h"],
            description: "Test",
            onComplete: vi.fn(),
          });
          return context;
        },
        { wrapper: createWrapper() },
      );

      const handlers = result.current.getHandlers();
      const handler = handlers.find((h) => h.description === "Test");
      expect(handler?.category).toBe("General");
    });

    it("custom category is stored", () => {
      const { result } = renderHook(
        () => {
          const context = useKeyPressContext();
          useKeySequence({
            sequence: ["g", "h"],
            description: "Test",
            category: "Navigation",
            onComplete: vi.fn(),
          });
          return context;
        },
        { wrapper: createWrapper() },
      );

      const handlers = result.current.getHandlers();
      const handler = handlers.find((h) => h.description === "Test");
      expect(handler?.category).toBe("Navigation");
    });
  });

  describe("Lifecycle", () => {
    it("unregisters on unmount", () => {
      const onComplete = vi.fn();

      const { unmount } = renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Test",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Handler should work before unmount
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      unmount();

      // Handler should NOT work after unmount
      onComplete.mockClear();
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("re-registers when sequence changes", async () => {
      vi.useRealTimers(); // Disable fake timers - click() needs real timers to work

      const onComplete = vi.fn();

      function TestComponent() {
        const [sequence, setSequence] = React.useState<string[]>(["g", "h"]);

        useKeySequence({
          sequence,
          description: "Test",
          onComplete,
        });

        return (
          <button
            data-testid="change-sequence-btn"
            onClick={() => {
              setSequence(["j", "k"]);
              console.log("button clicked");
            }}
          >
            Change Sequence
          </button>
        );
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );
      console.log(
        "render component",
        screen.getByTestId("change-sequence-btn"),
      );

      // Change sequence by clicking button
      await screen.getByTestId("change-sequence-btn").click();
      console.log("button clicked");

      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();
      // New sequence should work
      dispatchKey("j");
      dispatchKey("k");
      expect(onComplete).toHaveBeenCalledTimes(1);

      vi.useFakeTimers(); // Restore fake timers for subsequent tests
    });
  });

  describe("Error handling", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Test",
            onComplete: vi.fn(),
          }),
        );
      }).toThrow();
    });
  });

  describe("Complex sequences", () => {
    it("handles three-key sequences", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Complex sequence",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      dispatchKey("g");
      expect(onComplete).not.toHaveBeenCalled();

      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();

      dispatchKey("e");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("handles four-key sequences", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "i", "t", "s"],
            description: "Git status",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      dispatchKey("g");
      dispatchKey("i");
      dispatchKey("t");
      expect(onComplete).not.toHaveBeenCalled();

      dispatchKey("s");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("wrong key in middle of sequence clears buffer", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h", "e"],
            description: "Three key sequence",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Start sequence correctly
      dispatchKey("g");
      dispatchKey("h");

      // Press wrong key
      dispatchKey("x");

      // Complete what would have been the sequence
      dispatchKey("e");

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Multiple sequences", () => {
    it("multiple independent sequences work correctly", () => {
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go home",
            onComplete: onComplete1,
          });

          useKeySequence({
            sequence: ["g", "i"],
            description: "Go issues",
            onComplete: onComplete2,
          });
        },
        { wrapper: createWrapper() },
      );

      // Trigger first sequence
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete1).toHaveBeenCalledTimes(1);
      expect(onComplete2).not.toHaveBeenCalled();

      // Trigger second sequence
      onComplete1.mockClear();
      dispatchKey("g");
      dispatchKey("i");
      expect(onComplete1).not.toHaveBeenCalled();
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });

    it("sequences with different starting keys work independently", () => {
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      renderHook(
        () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go home",
            onComplete: onComplete1,
          });

          useKeySequence({
            sequence: ["j", "k"],
            description: "Move down",
            onComplete: onComplete2,
          });
        },
        { wrapper: createWrapper() },
      );

      // Trigger first
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete1).toHaveBeenCalledTimes(1);
      expect(onComplete2).not.toHaveBeenCalled();

      // Trigger second
      dispatchKey("j");
      dispatchKey("k");
      expect(onComplete1).toHaveBeenCalledTimes(1);
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Sequence resets", () => {
    it("sequence resets after match", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go home",
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Complete sequence
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Try pressing "h" again (as if buffer wasn't cleared)
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(1); // Should still be 1, not 2

      // Complete sequence again
      dispatchKey("g");
      dispatchKey("h");
      expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it("sequence buffer clears on non-matching key", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go home",
            timeout: 500,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Start sequence
      dispatchKey("g");

      // Press non-matching key
      dispatchKey("x");

      // Press what would complete the sequence if buffer wasn't cleared
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("sequence buffer clears on partial match after timeout", () => {
      const onComplete = vi.fn();

      renderHook(
        () =>
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go home",
            timeout: 500,
            onComplete,
          }),
        { wrapper: createWrapper() },
      );

      // Start sequence
      dispatchKey("g");

      vi.advanceTimersByTime(600);

      // Press what would complete the sequence if buffer wasn't cleared
      dispatchKey("h");
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
