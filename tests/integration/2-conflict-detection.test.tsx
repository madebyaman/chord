import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { KeyPressProvider, useKeyPress, useKeySequence } from "../../src/lib";

describe("Integration: Conflict Detection", () => {
  let user: ReturnType<typeof userEvent.setup>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    user = userEvent.setup();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("Duplicate Key Detection", () => {
    it("should detect when two components register the same key", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First handler",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second handler",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      // Should log a warning in development mode
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toMatch(/conflict/i);
      expect(consoleWarnSpy.mock.calls[0][0]).toMatch(/k/);
    });

    it("should detect conflicts with normalized shortcuts", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "mod+s",
          description: "First save",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "cmd+s", // Same as mod+s on Mac
          description: "Second save",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      // Should detect that mod+s and cmd+s are the same on Mac
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should detect conflicts with different modifier orders", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "shift+ctrl+k",
          description: "First",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "ctrl+shift+k", // Same shortcut, different order
          description: "Second",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should not detect conflict for different keys", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "K handler",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "j",
          description: "J handler",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      // Should not warn about conflicts
      expect(consoleWarnSpy).not.toHaveBeenCalled();
    });
  });

  describe("Console Warning Details", () => {
    it("should include component names in warning", () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          component: "Component1",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second",
          component: "Component2",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/Component1/);
      expect(warningMessage).toMatch(/Component2/);
    });

    it("should include key binding in warning", () => {
      const Component1 = () => {
        useKeyPress({
          key: "mod+s",
          description: "First",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "mod+s",
          description: "Second",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/mod\+s|meta\+s/);
    });

    it("should include descriptions in warning", () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "Open search",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Toggle sidebar",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/Open search/);
      expect(warningMessage).toMatch(/Toggle sidebar/);
    });
  });

  describe("Conflict Resolution Behavior", () => {
    it("should execute all handlers by default (warn mode)", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider conflictResolution="warn">
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("k");

      // Both handlers should be called
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should execute only first handler in firstWins mode", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider conflictResolution="firstWins">
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("k");

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    it("should execute only last handler in lastWins mode", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: handler1,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second",
          onPress: handler2,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider conflictResolution="lastWins">
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("k");

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should throw error in error mode", () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() =>
        render(
          <KeyPressProvider conflictResolution="error">
            <Component1 />
            <Component2 />
          </KeyPressProvider>
        )
      ).toThrow(/conflict/i);

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Help Modal Conflict Display", () => {
    it("should show conflicts in help modal with visual indicator", async () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First handler",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second handler",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      // Open help modal
      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(dialog).toBeInTheDocument();

        // Look for conflict indicators (e.g., red text, warning icon)
        const conflictElements = within(dialog).getAllByTestId("conflict-indicator");
        expect(conflictElements.length).toBeGreaterThan(0);
      });
    });

    it("should highlight conflicting shortcuts in red", async () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First handler",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second handler",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        const conflictRows = within(dialog).getAllByTestId("shortcut-row-conflict");

        // Check that conflicting rows have error/warning styling
        conflictRows.forEach((row) => {
          expect(row).toHaveClass(/conflict|error|warning/i);
        });
      });
    });

    it("should group conflicts together in modal", async () => {
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

      const Component3 = () => {
        useKeyPress({
          key: "j",
          description: "J handler",
          onPress: vi.fn(),
        });
        return null;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={true}>
          <Component1 />
          <Component2 />
          <Component3 />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");

        // Should have a conflicts section
        expect(within(dialog).getByTestId("conflicts-section")).toBeInTheDocument();

        // The conflicting 'k' shortcuts should be grouped
        const conflictGroup = within(dialog).getByTestId("conflict-group-k");
        expect(conflictGroup).toBeInTheDocument();

        // Should list both descriptions
        expect(within(conflictGroup).getByText("First K")).toBeInTheDocument();
        expect(within(conflictGroup).getByText("Second K")).toBeInTheDocument();
      });
    });

    it("should show conflict count in modal header", async () => {
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
          key: "k",
          description: "Second",
          onPress: vi.fn(),
        });
        return null;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        const header = within(dialog).getByRole("heading");

        // Should show conflict count
        expect(header.textContent).toMatch(/1.*conflict/i);
      });
    });

    it("should not show conflicts when showConflicts is false", async () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Second",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={false}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        expect(within(dialog).queryByTestId("conflicts-section")).not.toBeInTheDocument();
      });
    });
  });

  describe("Scope-based Conflicts", () => {
    it("should detect conflicts even with different scopes", () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "Global K",
          scope: "global",
          onPress: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Editor K",
          scope: "editor",
          onPress: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      // Should still warn about potential conflicts
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("should prefer more specific scope in scopePriority mode", async () => {
      const globalHandler = vi.fn();
      const editorHandler = vi.fn();

      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "Global K",
          scope: "global",
          onPress: globalHandler,
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "Editor K",
          scope: "editor",
          onPress: editorHandler,
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider conflictResolution="scopePriority" activeScope="editor">
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      await user.keyboard("k");

      // Editor scope should win
      expect(editorHandler).toHaveBeenCalledTimes(1);
      expect(globalHandler).not.toHaveBeenCalled();
    });
  });

  describe("Key Sequence Conflicts", () => {
    it("should detect conflicts in key sequences", () => {
      const Component1 = () => {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Go home",
          onComplete: vi.fn(),
        });
        return <div>Component 1</div>;
      };

      const Component2 = () => {
        useKeySequence({
          sequence: ["g", "h"],
          description: "Different home",
          onComplete: vi.fn(),
        });
        return <div>Component 2</div>;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
        </KeyPressProvider>
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleWarnSpy.mock.calls[0][0]).toMatch(/g.*h/);
    });
  });

  describe("Multiple Conflicts", () => {
    it("should detect and report multiple different conflicts", () => {
      const Component1 = () => {
        useKeyPress({
          key: "k",
          description: "K1",
          onPress: vi.fn(),
        });
        return null;
      };

      const Component2 = () => {
        useKeyPress({
          key: "k",
          description: "K2",
          onPress: vi.fn(),
        });
        return null;
      };

      const Component3 = () => {
        useKeyPress({
          key: "j",
          description: "J1",
          onPress: vi.fn(),
        });
        return null;
      };

      const Component4 = () => {
        useKeyPress({
          key: "j",
          description: "J2",
          onPress: vi.fn(),
        });
        return null;
      };

      render(
        <KeyPressProvider showConflicts={true}>
          <Component1 />
          <Component2 />
          <Component3 />
          <Component4 />
        </KeyPressProvider>
      );

      // Should have warned about both conflicts (k and j)
      expect(consoleWarnSpy.mock.calls.length).toBeGreaterThanOrEqual(2);
    });
  });
});
