/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { render } from "vitest-browser-react";
import { useKeyPress } from "./use-keypress";
import { KeyPressProvider, useKeyPressContext } from "../context/provider";
import type { ReactNode } from "react";
import { useRef, useEffect, useState } from "react";
import { useKeySequence } from "./use-keysequence";

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <KeyPressProvider>{children}</KeyPressProvider>
  );
};

describe("useKeyPress", () => {
  describe("key prop", () => {
    it("simple key: registers and triggers handler", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Press K",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Simulate keydown event
      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("modifier key: mod+s", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "mod+s",
            description: "Save",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Simulate meta+s (on Mac)
      // const event = new KeyboardEvent("keydown", {
      //   key: "s",
      //   metaKey: true,
      // });
      // Simulate ctrl+s (on Win/Linux)
      const event = new KeyboardEvent("keydown", {
        key: "s",
        ctrlKey: true,
      });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("multiple modifiers: ctrl+shift+k", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "ctrl+shift+k",
            description: "Complex",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        shiftKey: true,
      });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("description prop", () => {
    it("is included in getHandlers()", () => {
      const { result } = renderHook(
        () => {
          const context = useKeyPressContext();
          useKeyPress({
            key: "k",
            description: "My custom description",
            onPress: vi.fn(),
          });
          return context;
        },
        { wrapper: createWrapper() },
      );

      const handlers = result.current.getHandlers();
      const handler = handlers.find(
        (h) => h.description === "My custom description",
      );
      expect(handler).toBeDefined();
    });
  });

  describe("onPress prop", () => {
    it("is called multiple times for multiple key presses", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event1 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event1);

      const event2 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event2);

      expect(onPress).toHaveBeenCalledTimes(2);
    });
  });

  describe("category prop", () => {
    it('defaults to "General"', () => {
      const { result } = renderHook(
        () => {
          const context = useKeyPressContext();
          useKeyPress({
            key: "k",
            description: "Test",
            onPress: vi.fn(),
          });
          return context;
        },
        { wrapper: createWrapper() },
      );

      const handlers = result.current.getHandlers();
      expect(handlers[0].category).toBe("General");
    });

    it("custom category is stored", () => {
      const { result } = renderHook(
        () => {
          const context = useKeyPressContext();
          useKeyPress({
            key: "k",
            description: "Test",
            category: "File",
            onPress: vi.fn(),
          });
          return context;
        },
        { wrapper: createWrapper() },
      );

      const handlers = result.current.getHandlers();
      expect(handlers[0].category).toBe("File");
    });
  });

  describe("enabled prop", () => {
    it("true: handler executes", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            enabled: true,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("false: handler doesn't register", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            enabled: false,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).not.toHaveBeenCalled();
    });

    it("undefined: defaults to true", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("preventDefault prop", () => {
    it("true: prevents character from appearing in input", async () => {
      const onPress = vi.fn();

      // Test component that renders input with useKeyPress
      function TestComponent() {
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, []);

        useKeyPress({
          key: "k",
          description: "Test",
          preventDefault: true,
          onPress,
        });

        return <input ref={inputRef} data-testid="test-input" />;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );
      const input = screen.getByTestId("test-input");

      await input.click();
      await input.fill("k");

      // Character should NOT appear because preventDefault was called
      await expect.element(input).toHaveValue("");
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("false: allows character to appear in input", async () => {
      const onPress = vi.fn();

      // Test component that renders input with useKeyPress
      function TestComponent() {
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, []);

        useKeyPress({
          key: "k",
          description: "Test",
          preventDefault: false,
          onPress,
        });

        return <input ref={inputRef} data-testid="test-input" />;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );
      const input = screen.getByTestId("test-input");

      await input.click();
      await input.fill("k");

      // Character SHOULD appear because preventDefault was not called
      await expect.element(input).toHaveValue("k");
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("doesn't work if useKeyPress is registered starting with same key", async () => {
      const onPress = vi.fn();

      // Test component that renders input with useKeyPress
      function TestComponent() {
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, []);

        useKeyPress({
          key: "k",
          description: "Test",
          preventDefault: true,
          onPress,
        });
        useKeySequence({
          sequence: ["k", "g"],
          description: "Test",
          onComplete: onPress,
          timeout: 200,
        });

        return <input ref={inputRef} data-testid="test-input" />;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );
      const input = screen.getByTestId("test-input");

      await input.click();
      await input.fill("k");

      await new Promise((res) => {
        setTimeout(() => res("ok"), 300);
      });

      // Character should NOT appear because preventDefault was called
      await expect.element(input).toHaveValue("k");
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("component prop", () => {
    it("is included in conflict warnings", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});

      renderHook(
        () => {
          useKeyPress({
            key: "k",
            description: "First",
            component: "MyComponent",
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "k",
            description: "Second",
            component: "OtherComponent",
            onPress: vi.fn(),
          });
        },
        { wrapper: createWrapper() },
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/MyComponent/);
      expect(warningMessage).toMatch(/OtherComponent/);

      consoleWarnSpy.mockRestore();
      vi.unstubAllGlobals();
    });
  });

  describe("eventType prop", () => {
    it("keydown (default)", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventType: "keydown",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("keyup", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventType: "keyup",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Keydown should not trigger
      const keydownEvent = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(keydownEvent);
      expect(onPress).not.toHaveBeenCalled();

      // Keyup should trigger
      const keyupEvent = new KeyboardEvent("keyup", { key: "k" });
      window.dispatchEvent(keyupEvent);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("keypress", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventType: "keypress",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keypress", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("Lifecycle", () => {
    it("unregisters on unmount", () => {
      const onPress = vi.fn();

      const { unmount } = renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Handler should work before unmount
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event1);
      expect(onPress).toHaveBeenCalledTimes(1);

      unmount();

      // Handler should NOT work after unmount
      onPress.mockClear();
      const event2 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event2);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("re-registers when key changes", async () => {
      const onPress = vi.fn();
      let currentKey = "k";

      const { rerender } = renderHook(
        () =>
          useKeyPress({
            key: currentKey,
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Test initial key
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event1);
      expect(onPress).toHaveBeenCalledTimes(1);

      // Change key
      currentKey = "j";
      rerender();

      await waitFor(() => {
        // Old key should not work
        onPress.mockClear();
        const event2 = new KeyboardEvent("keydown", { key: "k" });
        window.dispatchEvent(event2);
        expect(onPress).not.toHaveBeenCalled();

        // New key should work
        const event3 = new KeyboardEvent("keydown", { key: "j" });
        window.dispatchEvent(event3);
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    it("re-registers when description changes", () => {
      const onPress = vi.fn();
      let currentDescription = "First";

      const { rerender } = renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: currentDescription,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      currentDescription = "Second";
      rerender();

      // Handler should still work after description change
      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);
      expect(onPress).toHaveBeenCalled();
    });

    it("re-registers when callback changes", async () => {
      function TestComponent() {
        const [count, setCount] = useState(0);

        useKeyPress({
          key: "k",
          description: "Test",
          preventDefault: true,
          onPress: () => setCount(count + 1),
        });

        return <p data-testid="count">{count}</p>;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // dispatch key event
      const event = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event);

      // expect count to be 1
      await waitFor(() => {
        expect(screen.getByText(/1$/i)).toBeInTheDocument();
      });

      // dispatch another key event
      window.dispatchEvent(event);
      await waitFor(() => {
        expect(screen.getByText(/2$/i)).toBeInTheDocument();
      });
    });
  });

  describe("Error handling", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress: vi.fn(),
          }),
        );
      }).toThrow();
    });
  });

  describe("Advanced event handling", () => {
    it("listener is removed when last handler with same config unregisters", () => {
      const onPress1 = vi.fn();
      const onPress2 = vi.fn();

      const { unmount: unmount1 } = renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Handler 1",
            eventType: "keydown",
            onPress: onPress1,
          }),
        { wrapper: createWrapper() },
      );

      const { unmount: unmount2 } = renderHook(
        () =>
          useKeyPress({
            key: "j",
            description: "Handler 2",
            eventType: "keydown",
            onPress: onPress2,
          }),
        { wrapper: createWrapper() },
      );

      // Both should work
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event1);
      expect(onPress1).toHaveBeenCalledTimes(1);

      const event2 = new KeyboardEvent("keydown", { key: "j" });
      window.dispatchEvent(event2);
      expect(onPress2).toHaveBeenCalledTimes(1);

      // Unmount first handler
      unmount1();
      onPress1.mockClear();
      onPress2.mockClear();

      // First handler should not work, second should still work
      const event3 = new KeyboardEvent("keydown", { key: "k" });
      window.dispatchEvent(event3);
      expect(onPress1).not.toHaveBeenCalled();

      const event4 = new KeyboardEvent("keydown", { key: "j" });
      window.dispatchEvent(event4);
      expect(onPress2).toHaveBeenCalledTimes(1);

      // Unmount second handler
      unmount2();
      onPress2.mockClear();

      // Neither should work after both unmounted
      const event5 = new KeyboardEvent("keydown", { key: "j" });
      window.dispatchEvent(event5);
      expect(onPress2).not.toHaveBeenCalled();
    });

    it("should immediately run onPress if it doesn't interference with key sequence", async () => {
      const onPress = vi.fn();

      // Test component that renders input with useKeyPress
      function TestComponent() {
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, []);

        useKeyPress({
          key: "k",
          description: "Test",
          onPress,
        });
        useKeySequence({
          sequence: ["g", "h"],
          description: "Test",
          onComplete: onPress,
          timeout: 200,
        });

        return <input ref={inputRef} data-testid="test-input" />;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );
      const input = screen.getByTestId("test-input");

      await input.click();
      await input.fill("k");

      await waitFor(() => {
        expect(input).toHaveValue("k");
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    it("should wait for timeout of key sequence if it matches with key press key", async () => {
      const onPress = vi.fn();
      const onPress2 = vi.fn();

      // Test component that renders input with useKeyPress
      function TestComponent() {
        const inputRef = useRef<HTMLInputElement>(null);

        useEffect(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, []);

        useKeyPress({
          key: "g",
          description: "Test",
          onPress,
        });
        useKeySequence({
          sequence: ["g", "h"],
          description: "Test",
          onComplete: onPress2,
          timeout: 200,
        });

        return <input ref={inputRef} data-testid="test-input" />;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );
      const input = screen.getByTestId("test-input");

      await input.click();
      await input.fill("g");

      await waitFor(() => {
        expect(onPress).toBeCalledTimes(1);
        expect(onPress2).toBeCalledTimes(0);
      });
    });
  });
});
