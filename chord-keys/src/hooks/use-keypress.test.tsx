/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { render } from "vitest-browser-react";
import { userEvent } from "@testing-library/user-event";
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
    it("simple key: registers and triggers handler", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Press K",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Real keyboard event
      await user.keyboard("k");

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("modifier key: mod+s", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Real keyboard event - ctrl+s (mod maps to ctrl on Linux)
      await user.keyboard("{Control>}s{/Control}");

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("multiple modifiers: ctrl+shift+k", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "ctrl+shift+k",
          description: "Complex",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Real keyboard event with multiple modifiers
      await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");

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

      const handlers = result.current.instance.handlers;
      const handler = handlers.find(
        (h) => h.description === "My custom description",
      );
      expect(handler).toBeDefined();
    });
  });

  describe("onPress prop", () => {
    it("is called multiple times for multiple key presses", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Real keyboard events
      await user.keyboard("k");
      await user.keyboard("k");

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

      const handlers = result.current.instance.handlers;
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

      const handlers = result.current.instance.handlers;
      expect(handlers[0].category).toBe("File");
    });
  });

  describe("enabled prop", () => {
    it("true: handler executes", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          enabled: true,
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("false: handler doesn't register", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          enabled: false,
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");

      expect(onPress).not.toHaveBeenCalled();
    });

    it("undefined: defaults to true", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");

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
    it("keydown (default)", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          eventType: "keydown",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Real keyboard event (triggers keydown)
      await user.keyboard("k");

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("keyup", () => {
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          eventType: "keyup",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
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

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          eventType: "keypress",
          onPress,
        });
        return <div>Test</div>;
      }

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      const event = new KeyboardEvent("keypress", { key: "k" });
      window.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("Lifecycle", () => {
    it("unregisters on unmount", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent() {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress,
        });
        return <div>Test</div>;
      }

      const { unmount } = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Handler should work before unmount
      await user.keyboard("k");
      expect(onPress).toHaveBeenCalledTimes(1);

      unmount();

      // Handler should NOT work after unmount
      onPress.mockClear();
      await user.keyboard("k");
      expect(onPress).not.toHaveBeenCalled();
    });

    it("does NOT re-register when component re-renders with same config values", () => {
      const consoleLogSpy = vi
        .spyOn(console, "log")
        .mockImplementation(() => {});
      const onPress = vi.fn();

      function TestComponent({ trigger }: { trigger: number }) {
        // Config object is recreated on every render, but values are same
        useKeyPress({
          key: "k",
          description: "Test",
          category: "Testing",
          onPress, // Same function reference
        });
        return <div>{trigger}</div>;
      }

      const { rerender } = render(
        <KeyPressProvider>
          <TestComponent trigger={1} />
        </KeyPressProvider>,
      );

      // Check initial registration
      const initialRegisterCalls = consoleLogSpy.mock.calls.filter(
        (call) => call[0] === "[REGISTER]: registering",
      ).length;

      expect(initialRegisterCalls).toBeGreaterThan(0);

      consoleLogSpy.mockClear();

      // Force re-render (config object reference changes, values don't)
      rerender(
        <KeyPressProvider>
          <TestComponent trigger={2} />
        </KeyPressProvider>,
      );

      // Should NOT see new [REGISTER] or [UNREGISTER] calls
      const registerCalls = consoleLogSpy.mock.calls.filter(
        (call) => call[0] === "[REGISTER]: registering",
      ).length;
      const unregisterCalls = consoleLogSpy.mock.calls.filter((call) =>
        call[0]?.toString().includes("[UNREGISTER]"),
      ).length;

      expect(registerCalls).toBe(0);
      expect(unregisterCalls).toBe(0);

      consoleLogSpy.mockRestore();
    });

    it("uses latest callback on each invocation even when callback changes", async () => {
      const user = userEvent.setup();

      function TestComponent() {
        const [count, setCount] = useState(0);

        // Callback changes every render (captures count in closure)
        // But should not cause re-registration
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: () => setCount((c) => c + 1),
        });

        return <div data-testid="count">{count}</div>;
      }

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Press key multiple times
      await user.keyboard("k");
      await waitFor(() =>
        expect(screen.getByTestId("count")).toHaveTextContent("1"),
      );

      await user.keyboard("k");
      await waitFor(() =>
        expect(screen.getByTestId("count")).toHaveTextContent("2"),
      );

      await user.keyboard("k");
      await waitFor(() =>
        expect(screen.getByTestId("count")).toHaveTextContent("3"),
      );

      // Count should increment correctly using latest closure
    });

    it("re-registers when key changes", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent({ keyBinding }: { keyBinding: string }) {
        useKeyPress({
          key: keyBinding,
          description: "Test",
          onPress,
        });
        return <div>Test</div>;
      }

      const { rerender } = render(
        <KeyPressProvider>
          <TestComponent keyBinding="k" />
        </KeyPressProvider>,
      );

      // Test initial key
      await user.keyboard("k");
      expect(onPress).toHaveBeenCalledTimes(1);

      // Change key
      rerender(
        <KeyPressProvider>
          <TestComponent keyBinding="j" />
        </KeyPressProvider>,
      );

      await waitFor(async () => {
        // Old key should not work
        onPress.mockClear();
        await user.keyboard("k");
        expect(onPress).not.toHaveBeenCalled();

        // New key should work
        await user.keyboard("j");
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    it("re-registers when description changes", async () => {
      const user = userEvent.setup();
      const onPress = vi.fn();

      function TestComponent({ description }: { description: string }) {
        useKeyPress({
          key: "k",
          description,
          onPress,
        });
        return <div>Test</div>;
      }

      const { rerender } = render(
        <KeyPressProvider>
          <TestComponent description="First" />
        </KeyPressProvider>,
      );

      rerender(
        <KeyPressProvider>
          <TestComponent description="Second" />
        </KeyPressProvider>,
      );

      // Handler should still work after description change
      await user.keyboard("k");
      expect(onPress).toHaveBeenCalled();
    });

    it("re-registers when callback changes", async () => {
      const user = userEvent.setup();

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

      // Real keyboard event
      await user.keyboard("k");

      // expect count to be 1
      await waitFor(() => {
        expect(screen.getByText(/1$/i)).toBeInTheDocument();
      });

      // Real keyboard event again
      await user.keyboard("k");
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
    it("listener is removed when last handler with same config unregisters", async () => {
      const user = userEvent.setup();
      const onPress1 = vi.fn();
      const onPress2 = vi.fn();

      function Component1() {
        useKeyPress({
          key: "k",
          description: "Handler 1",
          eventType: "keydown",
          onPress: onPress1,
        });
        return <div>Component1</div>;
      }

      function Component2() {
        useKeyPress({
          key: "j",
          description: "Handler 2",
          eventType: "keydown",
          onPress: onPress2,
        });
        return <div>Component2</div>;
      }

      const { unmount: unmount1 } = render(
        <KeyPressProvider>
          <Component1 />
        </KeyPressProvider>,
      );

      const { unmount: unmount2 } = render(
        <KeyPressProvider>
          <Component2 />
        </KeyPressProvider>,
      );

      // Both should work
      await user.keyboard("k");
      expect(onPress1).toHaveBeenCalledTimes(1);

      await user.keyboard("j");
      expect(onPress2).toHaveBeenCalledTimes(1);

      // Unmount first handler
      unmount1();
      onPress1.mockClear();
      onPress2.mockClear();

      // First handler should not work, second should still work
      await user.keyboard("k");
      expect(onPress1).not.toHaveBeenCalled();

      await user.keyboard("j");
      expect(onPress2).toHaveBeenCalledTimes(1);

      // Unmount second handler
      unmount2();
      onPress2.mockClear();

      // Neither should work after both unmounted
      await user.keyboard("j");
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
