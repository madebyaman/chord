import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { render } from "vitest-browser-react";
import { useGroupedHandlers } from "./use-handlers";
import { KeyPressProvider } from "../context/provider";
import { useKeyPress } from "./use-keypress";
import type { ReactNode } from "react";

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => (
    <KeyPressProvider>{children}</KeyPressProvider>
  );
};
describe("useGroupedHandlers", () => {
  it("returns handlers and groupedHandlers", () => {
    const { result } = renderHook(() => useGroupedHandlers(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toHaveProperty("handlers");
    expect(result.current).toHaveProperty("groupedHandlers");
    expect(Array.isArray(result.current.handlers)).toBe(true);
    expect(Array.isArray(result.current.groupedHandlers)).toBe(true);
  });

  it("groups handlers by category", async () => {
    const onPress = vi.fn();

    function TestComponent() {
      useKeyPress({
        key: "k",
        description: "First handler",
        category: "File",
        onPress,
      });

      useKeyPress({
        key: "j",
        description: "Second handler",
        category: "File",
        onPress,
      });

      useKeyPress({
        key: "n",
        description: "Third handler",
        category: "Edit",
        onPress,
      });

      const { groupedHandlers } = useGroupedHandlers();

      return (
        <div>
          <div data-testid="group-count">{groupedHandlers.length}</div>
          {groupedHandlers.map(([category, handlers]) => (
            <div key={category} data-testid={`category-${category}`}>
              {handlers.map((h) => (
                <div key={h.key} data-testid={`handler-${h.key}`}>
                  {h.description}
                </div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    const screen = render(
      <KeyPressProvider>
        <TestComponent />
      </KeyPressProvider>,
    );

    // Should have 2 categories
    await waitFor(() => {
      expect(screen.getByTestId("group-count")).toHaveTextContent("2");
    });

    // Should have File and Edit categories
    expect(screen.getByTestId("category-File")).toBeDefined();
    expect(screen.getByTestId("category-Edit")).toBeDefined();

    // File category should have 2 handlers
    const fileHandlers = screen
      .getByTestId("category-File")
      .querySelectorAll('[data-testid^="handler-"]');
    expect(fileHandlers.length).toBe(2);
    expect(fileHandlers[0]).toHaveTextContent("First handler");
    expect(fileHandlers[1]).toHaveTextContent("Second handler");

    // Edit category should have 1 handler
    const editHandlers = screen
      .getByTestId("category-Edit")
      .querySelectorAll('[data-testid^="handler-"]');
    expect(editHandlers.length).toBe(1);
    expect(editHandlers[0]).toHaveTextContent("Third handler");
  });

  it("defaults to 'General' category when no category is provided", async () => {
    const onPress = vi.fn();

    function TestComponent() {
      useKeyPress({
        key: "k",
        description: "No category handler",
        onPress,
      });

      const { groupedHandlers } = useGroupedHandlers();

      return (
        <div>
          <div data-testid="group-count">{groupedHandlers.length}</div>
          {groupedHandlers.length > 0 && (
            <>
              <div data-testid="category-name">{groupedHandlers[0][0]}</div>
              <div data-testid="handler-count">
                {groupedHandlers[0][1].length}
              </div>
              <div data-testid="handler-description">
                {groupedHandlers[0][1][0].description}
              </div>
            </>
          )}
        </div>
      );
    }

    const screen = render(
      <KeyPressProvider>
        <TestComponent />
      </KeyPressProvider>,
    );

    // Should have 1 category called "General"
    await waitFor(() => {
      expect(screen.getByTestId("group-count")).toHaveTextContent("1");
    });
    expect(screen.getByTestId("category-name")).toHaveTextContent("General");
    expect(screen.getByTestId("handler-count")).toHaveTextContent("1");
    expect(screen.getByTestId("handler-description")).toHaveTextContent(
      "No category handler",
    );
  });

  it("sorts categories alphabetically", async () => {
    const onPress = vi.fn();

    function TestComponent() {
      useKeyPress({
        key: "k",
        description: "Handler 1",
        category: "Zebra",
        onPress,
      });

      useKeyPress({
        key: "j",
        description: "Handler 2",
        category: "Apple",
        onPress,
      });

      useKeyPress({
        key: "n",
        description: "Handler 3",
        category: "Banana",
        onPress,
      });

      const { groupedHandlers } = useGroupedHandlers();

      return (
        <div>
          <div data-testid="group-count">{groupedHandlers.length}</div>
          {groupedHandlers.map(([category], idx) => (
            <div key={category} data-testid={`category-${idx}`}>
              {category}
            </div>
          ))}
        </div>
      );
    }

    const screen = render(
      <KeyPressProvider>
        <TestComponent />
      </KeyPressProvider>,
    );

    // Should have 3 categories in alphabetical order
    await waitFor(() => {
      expect(screen.getByTestId("group-count")).toHaveTextContent("3");
    });
    expect(screen.getByTestId("category-0")).toHaveTextContent("Apple");
    expect(screen.getByTestId("category-1")).toHaveTextContent("Banana");
    expect(screen.getByTestId("category-2")).toHaveTextContent("Zebra");
  });

  it("returns empty array when no handlers are registered", () => {
    const { result } = renderHook(() => useGroupedHandlers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.handlers).toEqual([]);
    expect(result.current.groupedHandlers).toEqual([]);
  });

  it("handles mixed categories with and without explicit category", async () => {
    const onPress = vi.fn();

    function TestComponent() {
      useKeyPress({
        key: "k",
        description: "Explicit category",
        category: "File",
        onPress,
      });

      useKeyPress({
        key: "j",
        description: "Default category",
        onPress,
      });

      const { groupedHandlers } = useGroupedHandlers();

      return (
        <div>
          <div data-testid="group-count">{groupedHandlers.length}</div>
          {groupedHandlers.map(([category, handlers]) => (
            <div key={category} data-testid={`category-${category}`}>
              <div data-testid={`${category}-count`}>{handlers.length}</div>
            </div>
          ))}
        </div>
      );
    }

    const screen = render(
      <KeyPressProvider>
        <TestComponent />
      </KeyPressProvider>,
    );

    // Should have 2 categories: File and General
    await waitFor(() => {
      expect(screen.getByTestId("group-count")).toHaveTextContent("2");
    });
    expect(screen.getByTestId("category-File")).toBeDefined();
    expect(screen.getByTestId("category-General")).toBeDefined();
    expect(screen.getByTestId("File-count")).toHaveTextContent("1");
    expect(screen.getByTestId("General-count")).toHaveTextContent("1");
  });

  it("throws when used outside provider", () => {
    expect(() => {
      renderHook(() => useGroupedHandlers());
    }).toThrow();
  });
});
