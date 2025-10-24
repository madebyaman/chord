/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { KeyPressProvider } from "../context/provider";
import { useKeyPress } from "../hooks/use-keypress";
import { useState } from "react";

describe("ShortcutsDialog", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe("Opening/Closing", () => {
    it("opens when helpKey is pressed", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("closes when escape is pressed", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when helpKey is pressed again", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      // Open
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close with same key
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when backdrop is clicked", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const backdrop = screen.getByTestId("modal-backdrop");
      await user.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("closes when X button is clicked", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Displaying shortcuts", () => {
    it("displays shortcuts with keys and descriptions", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save file",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "My shortcut",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        // Check that descriptions are displayed
        expect(screen.getByText("Save file")).toBeInTheDocument();
        expect(screen.getByText("My shortcut")).toBeInTheDocument();
        // Check that keys are displayed
        expect(screen.getByText("k")).toBeInTheDocument();
      });
    });

    it('shows "No shortcuts" when empty', async () => {
      render(
        <KeyPressProvider helpKey="?">
          <div>Test</div>
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByText(/no keyboard shortcuts/i)).toBeInTheDocument();
      });
    });
  });

  describe("Category organization", () => {
    it("groups shortcuts by category", async () => {
      const TestComponent = () => {
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

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByText("File")).toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });

    it("displays category headers", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          category: "Navigation",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        const categoryHeader = screen.getByText("Navigation");
        expect(categoryHeader).toBeInTheDocument();
        expect(categoryHeader.tagName).toMatch(/h3|h4|header/i);
      });
    });

    it('uses "General" as default category', async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByText("General")).toBeInTheDocument();
      });
    });

    it("filters shortcuts by category prop", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          category: "File",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "mod+c",
          description: "Copy",
          category: "Edit",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "Navigate",
          category: "Navigation",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?" category="File">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        // Should show File category shortcuts
        expect(screen.getByText("Save")).toBeInTheDocument();
        // Should NOT show other categories
        expect(screen.queryByText("Copy")).not.toBeInTheDocument();
        expect(screen.queryByText("Navigate")).not.toBeInTheDocument();
      });
    });
  });

  describe("showConflicts prop", () => {
    it("displays conflicts section with indicators when true", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "Second",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={true}>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByTestId("conflicts-section")).toBeInTheDocument();
        const indicators = screen.getAllByTestId("conflict-indicator");
        expect(indicators.length).toBeGreaterThan(0);
      });
    });

    it("hides conflicts section when false", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "First",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "k",
          description: "Second",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?" showConflicts={false}>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.queryByTestId("conflicts-section")).not.toBeInTheDocument();
      });
    });
  });

  describe("Dynamic updates", () => {
    it("adds shortcut when component mounts", async () => {
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

        return (
          <KeyPressProvider helpKey="?">
            <button onClick={() => setShowComponent(true)}>Mount</button>
            {showComponent && <TestComponent />}
          </KeyPressProvider>
        );
      };

      render(<App />);

      // Open dialog - shortcut should not be there
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.queryByText("New shortcut")).not.toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      // Mount component
      await user.click(screen.getByRole("button", { name: "Mount" }));

      // Open dialog again - shortcut should now be there
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByText("New shortcut")).toBeInTheDocument();
      });
    });

    it("removes shortcut when component unmounts", async () => {
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

        return (
          <KeyPressProvider helpKey="?">
            <button onClick={() => setShowComponent(false)}>Unmount</button>
            {showComponent && <TestComponent />}
          </KeyPressProvider>
        );
      };

      render(<App />);

      // Open dialog - shortcut should be there
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByText("Temporary shortcut")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      // Unmount component
      await user.click(screen.getByRole("button", { name: "Unmount" }));

      // Open dialog again - shortcut should be gone
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.queryByText("Temporary shortcut")).not.toBeInTheDocument();
      });
    });

    it("removes conflict when conflicting component unmounts", async () => {
      const App = () => {
        const [showSecond, setShowSecond] = useState(true);

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

        return (
          <KeyPressProvider helpKey="?" showConflicts={true}>
            <Component1 />
            {showSecond && <Component2 />}
            <button onClick={() => setShowSecond(false)}>Remove</button>
          </KeyPressProvider>
        );
      };

      render(<App />);

      // Open dialog - should show conflict
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByTestId("conflicts-section")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      // Remove conflicting component
      await user.click(screen.getByRole("button", { name: "Remove" }));

      // Open dialog again - conflict should be gone
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.queryByTestId("conflicts-section")).not.toBeInTheDocument();
      });
    });

    it("doesn't show disabled shortcuts (enabled: false)", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Enabled shortcut",
          enabled: true,
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "j",
          description: "Disabled shortcut",
          enabled: false,
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByText("Enabled shortcut")).toBeInTheDocument();
        expect(screen.queryByText("Disabled shortcut")).not.toBeInTheDocument();
      });
    });
  });

  describe("theme prop", () => {
    it("light theme colors", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?" theme="light">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        const styles = window.getComputedStyle(dialog);
        expect(styles.backgroundColor).toMatch(/#fff|white/i);
      });
    });

    it("dark theme colors", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?" theme="dark">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = screen.getByRole("dialog");
        const styles = window.getComputedStyle(dialog);
        expect(styles.backgroundColor).toMatch(/#1a1a1a|#000/i);
      });
    });
  });

  describe("helpKey prop", () => {
    it("shows helpKey in footer text", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="ctrl+/">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("{Control>}/{/Control}");

      await waitFor(() => {
        expect(screen.getByText(/ctrl\+\//i)).toBeInTheDocument();
      });
    });
  });
});
