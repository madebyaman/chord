/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { render } from "vitest-browser-react";
import { useKeyPress } from "./use-keypress";
import { useKeyboardShortcuts } from "./use-keyboard-shortcuts";
import { KeyPressProvider  } from "../context/provider";
import type { ReactNode } from "react";
import { useState } from "react";

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <KeyPressProvider>{children}</KeyPressProvider>
  );
};

describe("useKeyboardShortcuts", () => {
  describe("Return shape", () => {
    it("returns handlers and groupedHandlers", () => {
      const { result } = renderHook(
        () => {
          useKeyPress({
            key: "k",
            description: "Test",
            onPress: vi.fn(),
          });
          return useKeyboardShortcuts();
        },
        { wrapper: createWrapper() },
      );

      expect(result.current).toHaveProperty("handlers");
      expect(result.current).toHaveProperty("groupedHandlers");
      expect(Array.isArray(result.current.handlers)).toBe(true);
      expect(Array.isArray(result.current.groupedHandlers)).toBe(true);
    });

    it("handlers array contains HandlerInfo objects", () => {
      const { result } = renderHook(
        () => {
          useKeyPress({
            key: "k",
            description: "Test shortcut",
            category: "Testing",
            onPress: vi.fn(),
          });
          return useKeyboardShortcuts();
        },
        { wrapper: createWrapper() },
      );

      expect(result.current.handlers.length).toBeGreaterThan(0);
      const handler = result.current.handlers[0];
      expect(handler).toHaveProperty("keySequence");
      expect(handler).toHaveProperty("description");
      expect(handler).toHaveProperty("category");
      expect(handler).toHaveProperty("component");
    });
  });

  describe("Grouping by category", () => {
    it("groups handlers by category", () => {
      const { result } = renderHook(
        () => {
          useKeyPress({
            key: "mod+s",
            description: "Save",
            category: "File",
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "mod+o",
            description: "Open",
            category: "File",
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "mod+c",
            description: "Copy",
            category: "Edit",
            onPress: vi.fn(),
          });

          return useKeyboardShortcuts();
        },
        { wrapper: createWrapper() },
      );

      const { groupedHandlers } = result.current;

      // Should have 2 groups: File and Edit
      expect(groupedHandlers.length).toBe(2);

      // Check File category has 2 handlers
      const fileGroup = groupedHandlers.find(([category]) => category === "File");
      expect(fileGroup).toBeDefined();
      expect(fileGroup?.[1].length).toBe(2);

      // Check Edit category has 1 handler
      const editGroup = groupedHandlers.find(([category]) => category === "Edit");
      expect(editGroup).toBeDefined();
      expect(editGroup?.[1].length).toBe(1);
    });

    it("sorts categories alphabetically", () => {
      const { result } = renderHook(
        () => {
          useKeyPress({
            key: "z",
            description: "Zebra",
            category: "Zebra",
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "a",
            description: "Apple",
            category: "Apple",
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "m",
            description: "Middle",
            category: "Middle",
            onPress: vi.fn(),
          });

          return useKeyboardShortcuts();
        },
        { wrapper: createWrapper() },
      );

      const { groupedHandlers } = result.current;
      const categories = groupedHandlers.map(([category]) => category);

      expect(categories).toEqual(["Apple", "Middle", "Zebra"]);
    });

    it('uses "General" as default category', () => {
      const { result } = renderHook(
        () => {
          useKeyPress({
            key: "k",
            description: "Test",
            // No category specified
            onPress: vi.fn(),
          });

          return useKeyboardShortcuts();
        },
        { wrapper: createWrapper() },
      );

      const { handlers, groupedHandlers } = result.current;

      // Handler should have "General" category
      expect(handlers[0].category).toBe("General");

      // Should be grouped under "General"
      const generalGroup = groupedHandlers.find(
        ([category]) => category === "General",
      );
      expect(generalGroup).toBeDefined();
      expect(generalGroup?.[1].length).toBe(1);
    });
  });

  describe("Filtering disabled shortcuts", () => {
    it("doesn't include handlers with enabled: false", () => {
      const { result } = renderHook(
        () => {
          useKeyPress({
            key: "k",
            description: "Enabled",
            enabled: true,
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "j",
            description: "Disabled",
            enabled: false,
            onPress: vi.fn(),
          });

          return useKeyboardShortcuts();
        },
        { wrapper: createWrapper() },
      );

      const { handlers } = result.current;

      // Should only have 1 handler (the enabled one)
      expect(handlers.length).toBe(1);
      expect(handlers[0].description).toBe("Enabled");
    });
  });

  describe("Dynamic updates", () => {
    it("adds handler when component mounts", async () => {
      const App = () => {
        const [showComponent, setShowComponent] = useState(false);

        const TestComponent = () => {
          useKeyPress({
            key: "k",
            description: "New shortcut",
            onPress: vi.fn(),
          });

          return null;
        };

        const HookConsumer = () => {
          const { handlers } = useKeyboardShortcuts();
          return (
            <div>
              <button onClick={() => setShowComponent(true)}>Mount</button>
              <div data-testid="count">{handlers.length}</div>
            </div>
          );
        };

        return (
          <KeyPressProvider>
            <HookConsumer />
            {showComponent && <TestComponent />}
          </KeyPressProvider>
        );
      };

      const screen = render(<App />);

      // Initially no shortcuts
      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("0");
      });

      // Mount component
      await screen.getByRole("button", { name: "Mount" }).click();

      // Now should have 1 shortcut
      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("1");
      });
    });

    it("removes handler when component unmounts", async () => {
      const App = () => {
        const [showComponent, setShowComponent] = useState(true);

        const TestComponent = () => {
          useKeyPress({
            key: "k",
            description: "Temporary shortcut",
            onPress: vi.fn(),
          });

          return null;
        };

        const HookConsumer = () => {
          const { handlers } = useKeyboardShortcuts();
          return (
            <div>
              <button onClick={() => setShowComponent(false)}>Unmount</button>
              <div data-testid="count">{handlers.length}</div>
            </div>
          );
        };

        return (
          <KeyPressProvider>
            <HookConsumer />
            {showComponent && <TestComponent />}
          </KeyPressProvider>
        );
      };

      const screen = render(<App />);

      // Initially 1 shortcut
      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("1");
      });

      // Unmount component
      await screen.getByRole("button", { name: "Unmount" }).click();

      // Now should have 0 shortcuts
      await waitFor(() => {
        expect(screen.getByTestId("count")).toHaveTextContent("0");
      });
    });

    it("updates groupedHandlers when handlers change", async () => {
      const App = () => {
        const [showSecond, setShowSecond] = useState(false);

        const Component1 = () => {
          useKeyPress({
            key: "k",
            description: "First",
            category: "File",
            onPress: vi.fn(),
          });

          return null;
        };

        const Component2 = () => {
          useKeyPress({
            key: "j",
            description: "Second",
            category: "Edit",
            onPress: vi.fn(),
          });

          return null;
        };

        const HookConsumer = () => {
          const { groupedHandlers } = useKeyboardShortcuts();
          return (
            <div>
              <button onClick={() => setShowSecond(true)}>Add Second</button>
              <div data-testid="groups">{groupedHandlers.length}</div>
            </div>
          );
        };

        return (
          <KeyPressProvider>
            <Component1 />
            {showSecond && <Component2 />}
            <HookConsumer />
          </KeyPressProvider>
        );
      };

      const screen = render(<App />);

      // Initially 1 group (File)
      await waitFor(() => {
        expect(screen.getByTestId("groups")).toHaveTextContent("1");
      });

      // Add second component
      await screen.getByRole("button", { name: "Add Second" }).click();

      // Now should have 2 groups (File and Edit)
      await waitFor(() => {
        expect(screen.getByTestId("groups")).toHaveTextContent("2");
      });
    });
  });
});
