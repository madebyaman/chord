/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { KeyPressProvider, useKeyPressContext } from "./provider";
import { useKeyPress } from "../hooks/use-keypress";

describe("KeyPressProvider", () => {
  let user: ReturnType<typeof userEvent.setup>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    user = userEvent.setup();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("Basic rendering", () => {
    it("renders children without errors", () => {
      render(
        <KeyPressProvider>
          <div>Test Content</div>
        </KeyPressProvider>,
      );

      expect(screen.getByText("Test Content")).toBeInTheDocument();
    });

    it("throws error when useKeyPressContext is used outside provider", () => {
      const InvalidComponent = () => {
        useKeyPressContext();
        return <div>Invalid</div>;
      };

      expect(() => render(<InvalidComponent />)).toThrow(
        "useKeyPressContext must be used within a KeyPressProvider",
      );
    });
  });

  describe("conflictResolution prop", () => {
    it("default/warn mode: executes all handlers and logs console.warn", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: handler1,
        });

        useKeyPress({
          key: "k",
          description: "Second",
          onPress: handler2,
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider conflictResolution="warn">
          <TestComponent />
        </KeyPressProvider>,
      );

      // Should log warning
      expect(consoleWarnSpy).toHaveBeenCalled();

      // Both handlers should execute
      await user.keyboard("k");
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("firstWins mode: only first handler executes", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: handler1,
        });

        useKeyPress({
          key: "k",
          description: "Second",
          onPress: handler2,
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider conflictResolution="firstWins">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    it("lastWins mode: only last handler executes", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: handler1,
        });

        useKeyPress({
          key: "k",
          description: "Second",
          onPress: handler2,
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider conflictResolution="lastWins">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("error mode: throws error with component name, key, and description", () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "First handler",
          component: "Component1",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "Second handler",
          component: "Component2",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      expect(() =>
        render(
          <KeyPressProvider conflictResolution="error">
            <TestComponent />
          </KeyPressProvider>,
        ),
      ).toThrow();

      // Error should include relevant details
      const errorMessage = consoleErrorSpy.mock.calls[0]?.[0] || "";
      expect(errorMessage).toMatch(/k/);
      expect(errorMessage).toMatch(/Component1|Component2/);
      expect(errorMessage).toMatch(/First handler|Second handler/);
    });
  });

  describe("Warning messages", () => {
    it("includes component name in warning", () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          component: "MyComponent",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "Test 2",
          component: "OtherComponent",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/MyComponent/);
      expect(warningMessage).toMatch(/OtherComponent/);
    });

    it("includes key in warning", () => {
      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Test",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "mod+s",
          description: "Test 2",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/mod\+s|meta\+s|ctrl\+s/);
    });

    it("includes description in warning", () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Open search",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "Toggle sidebar",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/Open search/);
      expect(warningMessage).toMatch(/Toggle sidebar/);
    });
  });
});
