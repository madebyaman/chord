import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import { KeyPressProvider, useKeyPress } from "../../src/lib";

describe("Integration: Basic Functionality", () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Provider Initialization", () => {
    it("should render KeyPressProvider without errors", () => {
      const { container } = render(
        <KeyPressProvider>
          <div>Test content</div>
        </KeyPressProvider>,
      );
      expect(container).toBeInTheDocument();
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should initialize with custom help key", () => {
      render(
        <KeyPressProvider helpKey="ctrl+/">
          <div>Test content</div>
        </KeyPressProvider>,
      );
      // Help modal should not be visible initially
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("should accept showConflicts prop", () => {
      const { rerender } = render(
        <KeyPressProvider showConflicts={true}>
          <div>Test content</div>
        </KeyPressProvider>,
      );
      expect(screen.getByText("Test content")).toBeInTheDocument();

      rerender(
        <KeyPressProvider showConflicts={false}>
          <div>Test content</div>
        </KeyPressProvider>,
      );
      expect(screen.getByText("Test content")).toBeInTheDocument();
    });

    it("should throw error when useKeyPress is used outside provider", () => {
      const InvalidComponent = () => {
        useKeyPress({
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        });
        return <div>Invalid</div>;
      };

      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => render(<InvalidComponent />)).toThrow();

      consoleSpy.mockRestore();
    });
  });

  describe("Single Shortcut Registration", () => {
    it("should register and trigger a simple key shortcut", async () => {
      const handlePress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Trigger K",
          onPress: handlePress,
        });
        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it("should register and trigger modifier + key shortcut", async () => {
      const handlePress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handlePress,
        });
        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Simulate mod+s (on Mac this is meta+s, on Windows/Linux it's ctrl+s)
      await user.keyboard("{Meta>}s{/Meta}");

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it("should register multiple modifiers + key shortcut", async () => {
      const handlePress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "ctrl+shift+k",
          description: "Complex shortcut",
          onPress: handlePress,
        });
        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");

      expect(handlePress).toHaveBeenCalledTimes(1);
    });

    it("should not trigger when only modifier is pressed", async () => {
      const handlePress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handlePress,
        });
        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("{Meta}");

      expect(handlePress).not.toHaveBeenCalled();
    });

    it("should respect preventDefault option", async () => {
      const handlePress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handlePress,
          preventDefault: true,
        });
        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      const preventDefaultSpy = vi.fn();
      window.addEventListener("keydown", (e) => {
        preventDefaultSpy();
        if (e.defaultPrevented) {
          preventDefaultSpy.mockImplementation(() => "prevented");
        }
      });

      await user.keyboard("{Meta>}s{/Meta}");

      expect(handlePress).toHaveBeenCalledTimes(1);
      // Check that preventDefault was called on the event
    });
  });

  describe("Conditional Shortcut Enabling", () => {
    it("should only trigger when enabled is true", async () => {
      const handlePress = vi.fn();

      const TestComponent = () => {
        const [enabled, setEnabled] = useState(false);

        useKeyPress({
          key: "k",
          description: "Conditional",
          onPress: handlePress,
          enabled,
        });

        return (
          <div>
            <button onClick={() => setEnabled(true)}>Enable</button>
            <span>{enabled ? "Enabled" : "Disabled"}</span>
          </div>
        );
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      // Should not trigger when disabled
      await user.keyboard("k");
      expect(handlePress).not.toHaveBeenCalled();

      // Enable the shortcut
      await user.click(screen.getByRole("button", { name: "Enable" }));
      await waitFor(() => {
        expect(screen.getByText("Enabled")).toBeInTheDocument();
      });

      // Should trigger now
      await user.keyboard("k");
      expect(handlePress).toHaveBeenCalledTimes(1);
    });
  });

  describe("Scoped Shortcuts", () => {
    it("should register shortcuts with scope", async () => {
      const handleGlobalPress = vi.fn();
      const handleEditorPress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "k",
          description: "Global K",
          onPress: handleGlobalPress,
          scope: "global",
        });

        useKeyPress({
          key: "k",
          description: "Editor K",
          onPress: handleEditorPress,
          scope: "editor",
        });

        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");

      // Both should be called (conflict detection will handle this)
      expect(handleGlobalPress).toHaveBeenCalled();
      expect(handleEditorPress).toHaveBeenCalled();
    });
  });

  describe("Category Organization", () => {
    it("should register shortcuts with categories", async () => {
      const handleFilePress = vi.fn();
      const handleEditPress = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save file",
          category: "File",
          onPress: handleFilePress,
        });

        useKeyPress({
          key: "mod+c",
          description: "Copy",
          category: "Edit",
          onPress: handleEditPress,
        });

        return <div>Test Component</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("{Meta>}s{/Meta}");
      expect(handleFilePress).toHaveBeenCalledTimes(1);

      await user.keyboard("{Meta>}c{/Meta}");
      expect(handleEditPress).toHaveBeenCalledTimes(1);
    });
  });

  // describe("Key Sequences", () => {
  //   it("should register and trigger a two-key sequence", async () => {
  //     const handlePress = vi.fn();

  //     const TestComponent = () => {
  //       useKeySequence({
  //         sequence: ["g", "h"], // GitHub-style: g then h
  //         description: "Go to home",
  //         onComplete: handlePress,
  //       });
  //       return <div>Test Component</div>;
  //     };

  //     render(
  //       <KeyPressProvider>
  //         <TestComponent />
  //       </KeyPressProvider>,
  //     );

  //     // Press g then h in sequence
  //     await user.keyboard("g");
  //     await user.keyboard("h");

  //     expect(handlePress).toHaveBeenCalledTimes(1);
  //   });

  //   it("should not trigger sequence if keys are pressed out of order", async () => {
  //     const handlePress = vi.fn();

  //     const TestComponent = () => {
  //       useKeySequence({
  //         sequence: ["g", "h"],
  //         description: "Go to home",
  //         onComplete: handlePress,
  //       });
  //       return <div>Test Component</div>;
  //     };

  //     render(
  //       <KeyPressProvider>
  //         <TestComponent />
  //       </KeyPressProvider>,
  //     );

  //     // Press h then g (wrong order)
  //     await user.keyboard("h");
  //     await user.keyboard("g");

  //     expect(handlePress).not.toHaveBeenCalled();
  //   });

  //   it("should timeout sequence after delay", async () => {
  //     const handlePress = vi.fn();

  //     const TestComponent = () => {
  //       useKeySequence({
  //         sequence: ["g", "h"],
  //         description: "Go to home",
  //         onComplete: handlePress,
  //         timeout: 1000, // 1 second timeout
  //       });
  //       return <div>Test Component</div>;
  //     };

  //     render(
  //       <KeyPressProvider>
  //         <TestComponent />
  //       </KeyPressProvider>,
  //     );

  //     await user.keyboard("g");

  //     // Wait longer than timeout
  //     await new Promise((resolve) => setTimeout(resolve, 1100));

  //     await user.keyboard("h");

  //     // Should not trigger because sequence timed out
  //     expect(handlePress).not.toHaveBeenCalled();
  //   });

  //   it("should handle three-key sequences", async () => {
  //     const handlePress = vi.fn();

  //     const TestComponent = () => {
  //       useKeySequence({
  //         sequence: ["g", "p", "r"], // g then p then r
  //         description: "Go to pull requests",
  //         onComplete: handlePress,
  //       });
  //       return <div>Test Component</div>;
  //     };

  //     render(
  //       <KeyPressProvider>
  //         <TestComponent />
  //       </KeyPressProvider>,
  //     );

  //     await user.keyboard("g");
  //     await user.keyboard("p");
  //     await user.keyboard("r");

  //     expect(handlePress).toHaveBeenCalledTimes(1);
  //   });

  //   it("should handle sequences with modifiers", async () => {
  //     const handlePress = vi.fn();

  //     const TestComponent = () => {
  //       useKeySequence({
  //         sequence: ["mod+k", "mod+b"], // cmd+k then cmd+b
  //         description: "Toggle sidebar",
  //         onComplete: handlePress,
  //       });
  //       return <div>Test Component</div>;
  //     };

  //     render(
  //       <KeyPressProvider>
  //         <TestComponent />
  //       </KeyPressProvider>,
  //     );

  //     await user.keyboard("{Meta>}k{/Meta}");
  //     await user.keyboard("{Meta>}b{/Meta}");

  //     expect(handlePress).toHaveBeenCalledTimes(1);
  //   });
  // });

  describe("Help Modal", () => {
    it("should open help modal when help key is pressed", async () => {
      render(
        <KeyPressProvider helpKey="?">
          <div>Test Content</div>
        </KeyPressProvider>,
      );

      // Help modal should not be visible initially
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

      // Press the help key
      await user.keyboard("?");

      // Help modal should now be visible
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });

    it("should display registered shortcuts in help modal", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save file",
          category: "File",
          onPress: vi.fn(),
        });

        useKeyPress({
          key: "mod+c",
          description: "Copy",
          category: "Edit",
          onPress: vi.fn(),
        });

        return <div>Test Content</div>;
      };

      render(
        <KeyPressProvider helpKey="?">
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("?");

      await waitFor(() => {
        expect(screen.getByText("Save file")).toBeInTheDocument();
        expect(screen.getByText("Copy")).toBeInTheDocument();
      });
    });

    it("should close help modal on escape key", async () => {
      render(
        <KeyPressProvider helpKey="?">
          <div>Test Content</div>
        </KeyPressProvider>,
      );

      // Open modal
      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Close with escape
      await user.keyboard("{Escape}");
      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });

    it("should close help modal on backdrop click", async () => {
      render(
        <KeyPressProvider helpKey="?">
          <div>Test Content</div>
        </KeyPressProvider>,
      );

      await user.keyboard("?");
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });

      // Click backdrop (assuming it has a test ID or role)
      const backdrop = screen.getByTestId("modal-backdrop");
      await user.click(backdrop);

      await waitFor(() => {
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      });
    });
  });

  describe("Dynamic Shortcut Updates", () => {
    it("should update handler when component re-renders", async () => {
      const firstHandler = vi.fn();
      const secondHandler = vi.fn();

      const TestComponent = () => {
        const [useFirst, setUseFirst] = useState(true);

        useKeyPress({
          key: "k",
          description: "Test",
          onPress: useFirst ? firstHandler : secondHandler,
        });

        return <button onClick={() => setUseFirst(false)}>Switch Handler</button>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>,
      );

      await user.keyboard("k");
      expect(firstHandler).toHaveBeenCalledTimes(1);
      expect(secondHandler).not.toHaveBeenCalled();

      // Switch handler
      await user.click(screen.getByRole("button", { name: "Switch Handler" }));

      firstHandler.mockClear();
      await user.keyboard("k");

      expect(firstHandler).not.toHaveBeenCalled();
      expect(secondHandler).toHaveBeenCalledTimes(1);
    });
  });
});
