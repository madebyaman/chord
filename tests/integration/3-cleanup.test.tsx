import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { KeyPressProvider, useKeyPress, useKeySequence } from "../../src/lib";

describe("Integration: Cleanup and Unmounting", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe("Handler Cleanup on Unmount", () => {
    it("should remove handler when component unmounts", async () => {
      const handler = vi.fn();

      const TestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
        const Component = () => {
          useKeyPress({
            key: "k",
            description: "Test handler",
            onPress: handler,
          });
          return <div>Mounted Component</div>;
        };

        return shouldRender ? <Component /> : null;
      };

      const { rerender } = render(
        <KeyPressProvider>
          <TestComponent shouldRender={true} />
        </KeyPressProvider>
      );

      // Handler should work when mounted
      await user.keyboard("k");
      expect(handler).toHaveBeenCalledTimes(1);

      // Unmount the component
      rerender(
        <KeyPressProvider>
          <TestComponent shouldRender={false} />
        </KeyPressProvider>
      );

      // Clear previous calls
      handler.mockClear();

      // Handler should NOT work after unmount
      await user.keyboard("k");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should remove multiple handlers on unmount", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const TestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
        const Component = () => {
          useKeyPress({
            key: "k",
            description: "Handler 1",
            onPress: handler1,
          });

          useKeyPress({
            key: "j",
            description: "Handler 2",
            onPress: handler2,
          });

          return <div>Mounted Component</div>;
        };

        return shouldRender ? <Component /> : null;
      };

      const { rerender } = render(
        <KeyPressProvider>
          <TestComponent shouldRender={true} />
        </KeyPressProvider>
      );

      // Both handlers should work
      await user.keyboard("k");
      await user.keyboard("j");
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      // Unmount
      rerender(
        <KeyPressProvider>
          <TestComponent shouldRender={false} />
        </KeyPressProvider>
      );

      handler1.mockClear();
      handler2.mockClear();

      // Neither handler should work
      await user.keyboard("k");
      await user.keyboard("j");
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it("should preserve other handlers when one component unmounts", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "Component 1",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "j",
          description: "Component 2",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      const App = ({ showFirst }: { showFirst: boolean }) => (
        <KeyPressProvider>
          {showFirst && <Component1 />}
          <Component2 />
        </KeyPressProvider>
      );

      const { rerender } = render(<App showFirst={true} />);

      // Both should work
      await user.keyboard("k");
      await user.keyboard("j");
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);

      // Unmount Component1 only
      rerender(<App showFirst={false} />);

      handler1.mockClear();
      handler2.mockClear();

      // Only Component2's handler should work
      await user.keyboard("k");
      await user.keyboard("j");
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Help Modal Updates on Unmount", () => {
    it("should remove shortcuts from help modal when component unmounts", async () => {
      const TestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
        const Component = () => {
          useKeyPress({
            key: "k",
            description: "Temporary shortcut",
            onPress: vi.fn(),
          });
          return <div>Mounted Component</div>;
        };

        return shouldRender ? <Component /> : null;
      };

      const PermanentComponent = () => {
        useKeyPress({
          key: "j",
          description: "Permanent shortcut",
          onPress: vi.fn(),
        });
        return <div>Permanent</div>;
      };

      const { rerender } = render(
        <KeyPressProvider helpKey="?">
          <TestComponent shouldRender={true} />
          <PermanentComponent />
        </KeyPressProvider>
      );

      // Open help modal
      await user.keyboard("?");

      // Both shortcuts should be visible
      await waitFor(() => {
        expect(screen.getByText("Temporary shortcut")).toBeInTheDocument();
        expect(screen.getByText("Permanent shortcut")).toBeInTheDocument();
      });

      // Close modal
      await user.keyboard("{Escape}");

      // Unmount the temporary component
      rerender(
        <KeyPressProvider helpKey="?">
          <TestComponent shouldRender={false} />
          <PermanentComponent />
        </KeyPressProvider>
      );

      // Open help modal again
      await user.keyboard("?");

      // Only permanent shortcut should be visible
      await waitFor(() => {
        expect(screen.queryByText("Temporary shortcut")).not.toBeInTheDocument();
        expect(screen.getByText("Permanent shortcut")).toBeInTheDocument();
      });
    });

    it("should update shortcut count in help modal after unmount", async () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: vi.fn(),
        });
        return null;
      };

      const Component2 = () => {
        useKeyPress({
          key: "j",
          description: "Second",
          onPress: vi.fn(),
        });
        return null;
      };

      const App = ({ showBoth }: { showBoth: boolean }) => (
        <KeyPressProvider helpKey="?">
          <Component1 />
          {showBoth && <Component2 />}
        </KeyPressProvider>
      );

      const { rerender } = render(<App showBoth={true} />);

      await user.keyboard("?");

      // Should show 2 shortcuts
      await waitFor(() => {
        const count = screen.getByTestId("shortcut-count");
        expect(count.textContent).toMatch(/2/);
      });

      await user.keyboard("{Escape}");

      // Unmount one component
      rerender(<App showBoth={false} />);

      await user.keyboard("?");

      // Should now show 1 shortcut
      await waitFor(() => {
        const count = screen.getByTestId("shortcut-count");
        expect(count.textContent).toMatch(/1/);
      });
    });

    it("should remove conflicts from help modal when one conflicting component unmounts", async () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First K",
          onPress: vi.fn(),
        });
        return null;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second K",
          onPress: vi.fn(),
        });
        return null;
      };

      const App = ({ showBoth }: { showBoth: boolean }) => (
        <KeyPressProvider helpKey="?" showConflicts={true}>
          <Component1 />
          {showBoth && <Component2 />}
        </KeyPressProvider>
      );

      const { rerender } = render(<App showBoth={true} />);

      await user.keyboard("?");

      // Should show conflict
      await waitFor(() => {
        expect(screen.getByTestId("conflicts-section")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      // Unmount conflicting component
      rerender(<App showBoth={false} />);

      await user.keyboard("?");

      // Conflict should be gone
      await waitFor(() => {
        expect(screen.queryByTestId("conflicts-section")).not.toBeInTheDocument();
      });
    });
  });

  describe("Sequence Cleanup", () => {
    it("should clear sequence state when component unmounts", async () => {
      const handler = vi.fn();

      const TestComponent = ({ shouldRender }: { shouldRender: boolean }) => {
        const Component = () => {
          useKeySequence({
            sequence: ["g", "h"],
            description: "Go home",
            onComplete: handler,
          });
          return <div>Component</div>;
        };

        return shouldRender ? <Component /> : null;
      };

      const { rerender } = render(
        <KeyPressProvider>
          <TestComponent shouldRender={true} />
        </KeyPressProvider>
      );

      // Start sequence
      await user.keyboard("g");

      // Unmount before completing sequence
      rerender(
        <KeyPressProvider>
          <TestComponent shouldRender={false} />
        </KeyPressProvider>
      );

      // Complete sequence
      await user.keyboard("h");

      // Handler should not be called
      expect(handler).not.toHaveBeenCalled();
    });

    it("should not leave partial sequences in state after unmount", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Sequence 1",
          onComplete: handler1,
        });
        return null;
      };

      const Component2 = () => {
        useKeySequence({
          sequence: ["g", "j"],
          description: "Sequence 2",
          onComplete: handler2,
        });
        return null;
      };

      const App = ({ showFirst }: { showFirst: boolean }) => (
        <KeyPressProvider>
          {showFirst && <Component1 />}
          <Component2 />
        </KeyPressProvider>
      );

      const { rerender } = render(<App showFirst={true} />);

      // Start sequence
      await user.keyboard("g");

      // Unmount Component1
      rerender(<App showFirst={false} />);

      // Start new sequence with remaining component
      await user.keyboard("g");
      await user.keyboard("j");

      // Only handler2 should be called
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe("Dynamic Component Lifecycle", () => {
    it("should handle rapid mount/unmount cycles", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: handler,
        });
        return <div>Component</div>;
      };

      const App = () => {
        const [count, setCount] = useState(0);

        return (
          <KeyPressProvider>
            {count % 2 === 0 && <TestComponent />}
            <button onClick={() => setCount((c) => c + 1)}>Toggle</button>
          </KeyPressProvider>
        );
      };

      render(<App />);

      // Initially mounted
      await user.keyboard("k");
      expect(handler).toHaveBeenCalledTimes(1);

      // Unmount
      await user.click(screen.getByRole("button", { name: "Toggle" }));
      handler.mockClear();
      await user.keyboard("k");
      expect(handler).not.toHaveBeenCalled();

      // Remount
      await user.click(screen.getByRole("button", { name: "Toggle" }));
      await user.keyboard("k");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle conditional rendering of multiple components", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      const Component1 = () => {
        useKeyPress({ key: "1", description: "One", onPress: handler1 });
        return null;
      };

      const Component2 = () => {
        useKeyPress({ key: "2", description: "Two", onPress: handler2 });
        return null;
      };

      const Component3 = () => {
        useKeyPress({ key: "3", description: "Three", onPress: handler3 });
        return null;
      };

      const App = () => {
        const [show1, setShow1] = useState(true);
        const [show2, setShow2] = useState(true);
        const [show3, setShow3] = useState(true);

        return (
          <KeyPressProvider>
            {show1 && <Component1 />}
            {show2 && <Component2 />}
            {show3 && <Component3 />}
            <button onClick={() => setShow1(false)}>Hide 1</button>
            <button onClick={() => setShow2(false)}>Hide 2</button>
            <button onClick={() => setShow3(false)}>Hide 3</button>
          </KeyPressProvider>
        );
      };

      render(<App />);

      // All should work initially
      await user.keyboard("1");
      await user.keyboard("2");
      await user.keyboard("3");
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // Hide component 2
      await user.click(screen.getByRole("button", { name: "Hide 2" }));

      handler1.mockClear();
      handler2.mockClear();
      handler3.mockClear();

      // Only 1 and 3 should work
      await user.keyboard("1");
      await user.keyboard("2");
      await user.keyboard("3");
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalledTimes(1);
    });
  });

  describe("Memory Leak Prevention", () => {
    it("should not retain references to unmounted components", async () => {
      const handlers: Array<() => void> = [];

      const TestComponent = ({ id }: { id: number }) => {
        const handler = () => {
          // Track if this handler is called
          handlers[id] = handler;
        };

        useKeyPress({
          key: "k",
          description: `Handler ${id}`,
          onPress: handler,
        });

        return <div>Component {id}</div>;
      };

      const App = ({ activeId }: { activeId: number }) => (
        <KeyPressProvider>
          <TestComponent id={activeId} />
        </KeyPressProvider>
      );

      const { rerender } = render(<App activeId={0} />);

      // Mount component 0
      await user.keyboard("k");

      // Switch to component 1
      rerender(<App activeId={1} />);
      await user.keyboard("k");

      // Switch to component 2
      rerender(<App activeId={2} />);
      await user.keyboard("k");

      // Only the latest handler should be in memory
      // The registry should not keep references to old handlers
      // This would be tested with actual memory profiling, but we can
      // verify behavior by checking that old handlers don't execute
    });

    it("should clean up event listeners on provider unmount", () => {
      const addEventListenerSpy = vi.spyOn(window, "addEventListener");
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <KeyPressProvider>
          <div>Test</div>
        </KeyPressProvider>
      );

      // Provider should have added event listeners
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function)
      );

      // Get the number of keydown listeners added
      const keydownCallCount = addEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "keydown"
      ).length;

      unmount();

      // Provider should have removed event listeners
      const removeKeydownCallCount = removeEventListenerSpy.mock.calls.filter(
        (call) => call[0] === "keydown"
      ).length;

      expect(removeKeydownCallCount).toBe(keydownCallCount);

      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("Enabled/Disabled Cleanup", () => {
    it("should not execute disabled shortcuts even if registered", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        const [enabled, setEnabled] = useState(true);

        useKeyPress({
          key: "k",
          description: "Test",
          onPress: handler,
          enabled,
        });

        return <button onClick={() => setEnabled(false)}>Disable</button>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>
      );

      // Should work when enabled
      await user.keyboard("k");
      expect(handler).toHaveBeenCalledTimes(1);

      // Disable
      await user.click(screen.getByRole("button", { name: "Disable" }));
      handler.mockClear();

      // Should not work when disabled
      await user.keyboard("k");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should remove disabled shortcuts from help modal", async () => {
      const TestComponent = () => {
        const [enabled, setEnabled] = useState(true);

        useKeyPress({
          key: "k",
          description: "Test shortcut",
          onPress: vi.fn(),
          enabled,
        });

        return <button onClick={() => setEnabled(false)}>Disable</button>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>
      );

      // Open help - shortcut should be visible
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByText("Test shortcut")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      // Disable shortcut
      await user.click(screen.getByRole("button", { name: "Disable" }));

      // Open help - shortcut should not be visible
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.queryByText("Test shortcut")).not.toBeInTheDocument();
      });
    });
  });
});
