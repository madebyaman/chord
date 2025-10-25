/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi } from "vitest";
import { render  } from "vitest-browser-react";
import { userEvent } from "@testing-library/user-event";
import { KeyPressProvider } from "../context/provider";
import { useKeyPress } from "../hooks/use-keypress";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { waitFor } from "@testing-library/react";

describe("ShortcutsDialog", () => {
  describe("Rendering and visibility", () => {
    it("renders when isOpen is true", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("does not render when isOpen is false", () => {
      render(
        <KeyPressProvider>
          <ShortcutsDialog isOpen={false} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe("Closing behavior", () => {
    it("calls onClose when close button is clicked", async () => {
      const onClose = vi.fn();

      const screen = render(
        <KeyPressProvider>
          <ShortcutsDialog isOpen={true} onClose={onClose} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /close/i });
      await closeButton.click();

      expect(onClose).toHaveBeenCalled();
    });

    it("calls onClose when Escape is pressed", async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <KeyPressProvider>
          <ShortcutsDialog isOpen={true} onClose={onClose} />
        </KeyPressProvider>,
      );

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
      });
    });

    it("calls onClose when backdrop is clicked", async () => {
      const onClose = vi.fn();

      render(
        <KeyPressProvider>
          <ShortcutsDialog isOpen={true} onClose={onClose} />
        </KeyPressProvider>,
      );

      const backdrop = document.querySelector('.drawer-backdrop');
      await backdrop!.click();

      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
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

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("Save file")).toBeInTheDocument();
        expect(screen.getByText("My shortcut")).toBeInTheDocument();
      });
    });

    it('shows "No shortcuts" when empty', async () => {
      const screen = render(
        <KeyPressProvider>
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        expect(
          screen.getByText(/no keyboard shortcuts registered/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Category organization", () => {
    it("displays category headers", async () => {
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

        return <div>Test</div>;
      };

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("File")).toBeInTheDocument();
        expect(screen.getByText("Edit")).toBeInTheDocument();
      });
    });

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

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        // Both File shortcuts should be visible
        expect(screen.getByText("Save")).toBeInTheDocument();
        expect(screen.getByText("Open")).toBeInTheDocument();
        // Edit shortcut should be visible
        expect(screen.getByText("Copy")).toBeInTheDocument();
      });
    });

    it('uses "General" as default category', async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          // No category specified
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      await waitFor(() => {
        expect(screen.getByText("General")).toBeInTheDocument();
      });
    });
  });

  describe("Search functionality", () => {
    it("filters shortcuts by description", async () => {

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save file",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "mod+o",
          description: "Open file",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "mod+c",
          description: "Copy text",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      // All shortcuts should be visible initially
      await waitFor(() => {
        expect(screen.getByText("Save file")).toBeInTheDocument();
        expect(screen.getByText("Open file")).toBeInTheDocument();
        expect(screen.getByText("Copy text")).toBeInTheDocument();
      });

      // Type in search
      const searchInput = screen.getByPlaceholder(/search shortcuts/i);
      await searchInput.fill("file")

      // Only shortcuts with "file" in description should be visible
      await waitFor(() => {
        expect(screen.getByText("Save file")).toBeInTheDocument();
        expect(screen.getByText("Open file")).toBeInTheDocument();
        // Check that "Copy text" is not in the document
        const copyText = Array.from(document.querySelectorAll('*')).find(
          el => el.textContent === "Copy text"
        );
        expect(copyText).toBeUndefined();
      });
    });

    it("shows empty state when search has no results", async () => {

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });

        return <div>Test</div>;
      };

      const screen = render(
        <KeyPressProvider>
          <TestComponent />
          <ShortcutsDialog isOpen={true} onClose={vi.fn()} />
        </KeyPressProvider>,
      );

      const searchInput = screen.getByPlaceholder(/search shortcuts/i);
      await searchInput.fill("nonexistent")

      await waitFor(() => {
        expect(
          screen.getByText(/no shortcuts match your search/i),
        ).toBeInTheDocument();
      });
    });
  });

  describe("helpKey prop", () => {
    it("opens and closes dialog when helpKey is pressed", async () => {
      const user = userEvent.setup();
      let isOpen = false;
      const onOpenChange = vi.fn((open: boolean) => {
        isOpen = open;
      });

      const TestComponent = () => {
        return (
          <ShortcutsDialog
            isOpen={isOpen}
            onClose={() => onOpenChange(false)}
            helpKey="?"
          />
        );
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Initially dialog should not be visible
      expect(document.querySelector('[role="dialog"]')).not.toBeInTheDocument();

      // Press the help key to open
      await user.keyboard("?");
      isOpen = true;

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(true);
      });

      // Press the help key again to close
      await user.keyboard("?");

      await waitFor(() => {
        expect(onOpenChange).toHaveBeenCalledWith(false);
      });
    });
  });
});
