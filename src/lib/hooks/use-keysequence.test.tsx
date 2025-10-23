/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { render } from "vitest-browser-react";
import { userEvent } from "@testing-library/user-event";
import { useKeySequence } from "./use-keysequence";
import { KeyPressProvider, useKeyPressContext } from "../context/provider";
import type { ReactNode } from "react";
import * as React from "react";

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <KeyPressProvider>{children}</KeyPressProvider>
  );
};

describe("useKeySequence", () => {

  describe("Basic sequence functionality", () => {
    it("triggers when full sequence entered", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g"
      await user.keyboard("g");
      expect(onComplete).not.toHaveBeenCalled();

      // Press "h"
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("does not trigger for partial sequence", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press only "g"
      await user.keyboard("g");
      expect(onComplete).not.toHaveBeenCalled();

      // Wait a bit to ensure it still doesn't trigger
      await new Promise((res) => setTimeout(res, 100));
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("order matters - wrong order doesn't trigger", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press in wrong order: "h", "g"
      await user.keyboard("h");
      await user.keyboard("g");

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Timeout behavior", () => {
    it("timeout clears sequence", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          timeout: 1000,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g"
      await user.keyboard("g");
      expect(onComplete).not.toHaveBeenCalled();

      // Wait more than timeout (real wait)
      await new Promise((res) => setTimeout(res, 1100));

      // Press "h" - should not trigger because sequence timed out
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("custom timeout works correctly", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          timeout: 500, // Custom timeout
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g"
      await user.keyboard("g");

      // Wait longer than custom timeout (real wait)
      await new Promise((res) => setTimeout(res, 600));

      // Press "h" - should not trigger because custom timeout expired
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("sequence completes within timeout", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          timeout: 1000,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g"
      await user.keyboard("g");

      // Wait less than timeout (real wait)
      await new Promise((res) => setTimeout(res, 500));

      // Press "h" - should trigger because within timeout
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("buffer and timer clear after partial match timeout", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h", "e"],
          description: "Three key sequence",
          timeout: 800,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g", "h" (partial match)
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();

      // Wait for timeout to expire (real wait)
      await new Promise((res) => setTimeout(res, 900));

      // Press "e" - should NOT complete the sequence because buffer was cleared
      await user.keyboard("e");
      expect(onComplete).not.toHaveBeenCalled();

      // Verify sequence works after reset by pressing full sequence
      await user.keyboard("g");
      await user.keyboard("h");
      await user.keyboard("e");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Overlapping sequences", () => {
    it("longer overlapping sequence fires when completed", async () => {
      const user = userEvent.setup();
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g", "h", "e" - only longer sequence should fire
      await user.keyboard("g");
      await user.keyboard("h");
      await user.keyboard("e");

      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).toHaveBeenCalledTimes(1);
    });

    it("shorter sequence fires if delay before next key", async () => {
      const user = userEvent.setup();
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g", "h"
      await user.keyboard("g");
      await user.keyboard("h");

      // Short sequence should fire immediately
      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).not.toHaveBeenCalled();

      // Wait and press "e" (real wait)
      await new Promise((res) => setTimeout(res, 1100));
      await user.keyboard("e");

      expect(onLongComplete).not.toHaveBeenCalled();
      expect(onShortComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Timing-based overlapping sequences", () => {
    it("shorter sequence with longer timeout fires when longer sequence times out", async () => {
      const user = userEvent.setup();
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g", "h"
      await user.keyboard("g");
      await user.keyboard("h");

      // Wait for longer sequence to timeout (real wait: 450ms > 400ms but < 500ms)
      await new Promise((res) => setTimeout(res, 450));

      expect(onLongComplete).not.toHaveBeenCalled();
      expect(onShortComplete).toHaveBeenCalledTimes(1);
    });

    it("shorter sequence with shorter timeout fires after waiting for longer timeout", async () => {
      const user = userEvent.setup();
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g", "h"
      await user.keyboard("g");
      await user.keyboard("h");

      // Wait for shorter sequence to fire (real wait: 1050ms)
      await new Promise((res) => setTimeout(res, 1050));
      expect(onShortComplete).toHaveBeenCalledTimes(1);
      expect(onLongComplete).not.toHaveBeenCalled();

      // Try to complete longer sequence - should fail because buffer was cleared
      await user.keyboard("e");
      expect(onLongComplete).not.toHaveBeenCalled();
    });

    it("longer sequence fires when all keys pressed within both timeouts", async () => {
      const user = userEvent.setup();
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g", "h"
      await user.keyboard("g");
      await user.keyboard("h");

      // Wait 200ms (real wait, < both timeouts)
      await new Promise((res) => setTimeout(res, 200));

      // Press "e" to complete longer sequence
      await user.keyboard("e");

      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).toHaveBeenCalledTimes(1);
    });

    it("both sequences timeout when delay exceeds timeout values", async () => {
      const user = userEvent.setup();
      const onShortComplete = vi.fn();
      const onLongComplete = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "g"
      await user.keyboard("g");

      // Wait longer than timeout (real wait)
      await new Promise((res) => setTimeout(res, 600));

      // Press "h" - should not trigger any sequence
      await user.keyboard("h");

      expect(onShortComplete).not.toHaveBeenCalled();
      expect(onLongComplete).not.toHaveBeenCalled();
    });
  });

  describe("Modifiers in sequence", () => {
    it("works with modifiers like ctrl+k followed by b", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["ctrl+k", "b"],
          description: "Toggle sidebar",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "ctrl+k"
      await user.keyboard("{Control>}k{/Control}");
      expect(onComplete).not.toHaveBeenCalled();

      // Press "b"
      await user.keyboard("b");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("works with meta key sequences", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["meta+k", "v"],
          description: "Open view",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "meta+k"
      await user.keyboard("{Meta>}k{/Meta}");

      // Press "v"
      await user.keyboard("v");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("multiple modifiers in sequence work correctly", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["ctrl+shift+k", "b"],
          description: "Complex sequence",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press "ctrl+shift+k"
      await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");

      // Press "b"
      await user.keyboard("b");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("Back-to-back sequences", () => {
    it("handles back-to-back sequences correctly", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // First sequence: "g", "h"
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Second sequence: "g", "h"
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it("buffer is cleared after successful match", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Complete sequence
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Press unrelated key
      await user.keyboard("x");

      // Press "h" - should not trigger because buffer was cleared
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  describe("enabled prop", () => {
    it("disabled sequence is ignored", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          enabled: false,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Try to trigger sequence
      await user.keyboard("g");
      await user.keyboard("h");

      expect(onComplete).not.toHaveBeenCalled();
    });

    it("enabled=true allows sequence to work", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          enabled: true,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("g");
      await user.keyboard("h");

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("enabled defaults to true when not specified", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go to home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("g");
      await user.keyboard("h");

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

      const handlers = result.current.instance.handlers;
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

      const handlers = result.current.instance.handlers;
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

      const handlers = result.current.instance.handlers;
      const handler = handlers.find((h) => h.description === "Test");
      expect(handler?.category).toBe("Navigation");
    });
  });

  describe("Lifecycle", () => {
    it("unregisters on unmount", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Test",
          onComplete,
        });
        return <div>Test</div>;
      }

      const { unmount } = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Handler should work before unmount
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      unmount();

      // Handler should NOT work after unmount
      onComplete.mockClear();
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("re-registers when sequence changes", async () => {
      const user = userEvent.setup();
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

      // Change sequence by clicking button
      await screen.getByTestId("change-sequence-btn").click();

      // Old sequence should not work
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();

      // New sequence should work
      await user.keyboard("j");
      await user.keyboard("k");
      expect(onComplete).toHaveBeenCalledTimes(1);
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
    it("handles three-key sequences", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h", "e"],
          description: "Complex sequence",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("g");
      expect(onComplete).not.toHaveBeenCalled();

      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();

      await user.keyboard("e");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("handles four-key sequences", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "i", "t", "s"],
          description: "Git status",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("g");
      await user.keyboard("i");
      await user.keyboard("t");
      expect(onComplete).not.toHaveBeenCalled();

      await user.keyboard("s");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("wrong key in middle of sequence clears buffer", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h", "e"],
          description: "Three key sequence",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Start sequence correctly
      await user.keyboard("g");
      await user.keyboard("h");

      // Press wrong key
      await user.keyboard("x");

      // Complete what would have been the sequence
      await user.keyboard("e");

      expect(onComplete).not.toHaveBeenCalled();
    });
  });

  describe("Multiple sequences", () => {
    it("multiple independent sequences work correctly", async () => {
      const user = userEvent.setup();
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Trigger first sequence
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete1).toHaveBeenCalledTimes(1);
      expect(onComplete2).not.toHaveBeenCalled();

      // Trigger second sequence
      onComplete1.mockClear();
      await user.keyboard("g");
      await user.keyboard("i");
      expect(onComplete1).not.toHaveBeenCalled();
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });

    it("sequences with different starting keys work independently", async () => {
      const user = userEvent.setup();
      const onComplete1 = vi.fn();
      const onComplete2 = vi.fn();

      function TestComponent() {
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
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Trigger first
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete1).toHaveBeenCalledTimes(1);
      expect(onComplete2).not.toHaveBeenCalled();

      // Trigger second
      await user.keyboard("j");
      await user.keyboard("k");
      expect(onComplete1).toHaveBeenCalledTimes(1);
      expect(onComplete2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Sequence resets", () => {
    it("sequence resets after match", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go home",
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Complete sequence
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1);

      // Try pressing "h" again (as if buffer wasn't cleared)
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(1); // Should still be 1, not 2

      // Complete sequence again
      await user.keyboard("g");
      await user.keyboard("h");
      expect(onComplete).toHaveBeenCalledTimes(2);
    });

    it("sequence buffer clears on non-matching key", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go home",
          timeout: 500,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Start sequence
      await user.keyboard("g");

      // Press non-matching key
      await user.keyboard("x");

      // Press what would complete the sequence if buffer wasn't cleared
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();
    });

    it("sequence buffer clears on partial match after timeout", async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();

      function TestComponent() {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go home",
          timeout: 500,
          onComplete,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Start sequence
      await user.keyboard("g");

      // Wait longer than timeout (real wait)
      await new Promise((res) => setTimeout(res, 600));

      // Press what would complete the sequence if buffer wasn't cleared
      await user.keyboard("h");
      expect(onComplete).not.toHaveBeenCalled();
    });
  });
});
