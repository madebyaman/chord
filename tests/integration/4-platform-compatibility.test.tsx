import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { KeyPressProvider, useKeyPress } from "../../src/lib";

describe("Integration: Platform Compatibility", () => {
  let user: ReturnType<typeof userEvent.setup>;
  let originalPlatform: string;

  beforeEach(() => {
    user = userEvent.setup();
    // Store original platform
    originalPlatform = navigator.platform;
  });

  afterEach(() => {
    vi.clearAllMocks();
    // Restore original platform
    Object.defineProperty(navigator, "platform", {
      value: originalPlatform,
      writable: true,
    });
  });

  describe("mod Key Resolution", () => {
    it("should resolve mod to meta on macOS", async () => {
      // Mock macOS
      Object.defineProperty(navigator, "platform", {
        value: "MacIntel",
        writable: true,
      });

      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      // On Mac, mod+s should respond to meta+s
      await user.keyboard("{Meta>}s{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Should NOT respond to ctrl+s
      await user.keyboard("{Control>}s{/Control}");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should resolve mod to ctrl on Windows", async () => {
      Object.defineProperty(navigator, "platform", {
        value: "Win32",
        writable: true,
      });

      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      // On Windows, mod+s should respond to ctrl+s
      await user.keyboard("{Control>}s{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Should NOT respond to meta+s
      await user.keyboard("{Meta>}s{/Meta}");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should resolve mod to ctrl on Linux", async () => {
      Object.defineProperty(navigator, "platform", {
        value: "Linux x86_64",
        writable: true,
      });

      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="linux">
          <TestComponent />
        </KeyPressProvider>
      );

      // On Linux, mod+s should respond to ctrl+s
      await user.keyboard("{Control>}s{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Should NOT respond to meta+s
      await user.keyboard("{Meta>}s{/Meta}");
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("cmd Key Resolution", () => {
    it("should resolve cmd to meta on macOS", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "cmd+k",
          description: "Command K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Meta>}k{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should resolve cmd to ctrl on Windows", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "cmd+k",
          description: "Command K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}k{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should resolve cmd to ctrl on Linux", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "cmd+k",
          description: "Command K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="linux">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}k{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Explicit ctrl Key", () => {
    it("should keep ctrl as ctrl on macOS", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "ctrl+k",
          description: "Ctrl K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      // Should respond to ctrl (not meta)
      await user.keyboard("{Control>}k{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Should NOT respond to meta
      await user.keyboard("{Meta>}k{/Meta}");
      expect(handler).not.toHaveBeenCalled();
    });

    it("should keep ctrl as ctrl on Windows", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "ctrl+k",
          description: "Ctrl K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}k{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should keep ctrl as ctrl on Linux", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "ctrl+k",
          description: "Ctrl K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="linux">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}k{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Explicit meta Key", () => {
    it("should keep meta as meta on macOS", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "meta+k",
          description: "Meta K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Meta>}k{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should keep meta as meta on Windows", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "meta+k",
          description: "Meta K",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      // Windows key maps to meta
      await user.keyboard("{Meta>}k{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Cross-Platform Shortcuts", () => {
    it("should handle same shortcut definition across platforms", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      // Test on Mac
      const { unmount: unmountMac } = render(
        <KeyPressProvider platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Meta>}s{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);

      unmountMac();
      handler.mockClear();

      // Test on Windows
      const { unmount: unmountWin } = render(
        <KeyPressProvider platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}s{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);

      unmountWin();
      handler.mockClear();

      // Test on Linux
      render(
        <KeyPressProvider platform="linux">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}s{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should handle complex multi-modifier shortcuts across platforms", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+shift+k",
          description: "Complex",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      // Mac
      const { unmount: unmountMac } = render(
        <KeyPressProvider platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Meta>}{Shift>}k{/Shift}{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);

      unmountMac();
      handler.mockClear();

      // Windows
      render(
        <KeyPressProvider platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("Special Keys Across Platforms", () => {
    it("should handle special keys consistently", async () => {
      const escapeHandler = vi.fn();
      const enterHandler = vi.fn();
      const spaceHandler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "escape",
          description: "Escape",
          onPress: escapeHandler,
        });

        useKeyPress({
          key: "enter",
          description: "Enter",
          onPress: enterHandler,
        });

        useKeyPress({
          key: "space",
          description: "Space",
          onPress: spaceHandler,
        });

        return <div>Test</div>;
      };

      const platforms: Array<"darwin" | "win32" | "linux"> = [
        "darwin",
        "win32",
        "linux",
      ];

      for (const platform of platforms) {
        const { unmount } = render(
          <KeyPressProvider platform={platform}>
            <TestComponent />
          </KeyPressProvider>
        );

        await user.keyboard("{Escape}");
        await user.keyboard("{Enter}");
        await user.keyboard(" ");

        expect(escapeHandler).toHaveBeenCalled();
        expect(enterHandler).toHaveBeenCalled();
        expect(spaceHandler).toHaveBeenCalled();

        unmount();
        escapeHandler.mockClear();
        enterHandler.mockClear();
        spaceHandler.mockClear();
      }
    });

    it("should handle arrow keys consistently", async () => {
      const upHandler = vi.fn();
      const downHandler = vi.fn();
      const leftHandler = vi.fn();
      const rightHandler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "arrowup",
          description: "Up",
          onPress: upHandler,
        });

        useKeyPress({
          key: "arrowdown",
          description: "Down",
          onPress: downHandler,
        });

        useKeyPress({
          key: "arrowleft",
          description: "Left",
          onPress: leftHandler,
        });

        useKeyPress({
          key: "arrowright",
          description: "Right",
          onPress: rightHandler,
        });

        return <div>Test</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{ArrowUp}");
      await user.keyboard("{ArrowDown}");
      await user.keyboard("{ArrowLeft}");
      await user.keyboard("{ArrowRight}");

      expect(upHandler).toHaveBeenCalled();
      expect(downHandler).toHaveBeenCalled();
      expect(leftHandler).toHaveBeenCalled();
      expect(rightHandler).toHaveBeenCalled();
    });
  });

  describe("Auto Platform Detection", () => {
    it("should auto-detect platform when not specified", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      // Don't specify platform - should auto-detect
      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>
      );

      // The behavior should match the current platform
      // On Mac, meta+s should work
      // On Windows/Linux, ctrl+s should work
      const isMac = navigator.platform.includes("Mac");

      if (isMac) {
        await user.keyboard("{Meta>}s{/Meta}");
      } else {
        await user.keyboard("{Control>}s{/Control}");
      }

      expect(handler).toHaveBeenCalled();
    });
  });

  describe("Help Modal Platform Display", () => {
    it("should show platform-specific shortcuts in help modal", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: vi.fn(),
        });
        return <div>Test</div>;
      };

      // Mac
      const { unmount: unmountMac } = render(
        <KeyPressProvider helpKey="?" platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        // Should display as ⌘S or Cmd+S on Mac
        const shortcutDisplay = document.querySelector('[data-testid="shortcut-key"]');
        expect(shortcutDisplay?.textContent).toMatch(/⌘|cmd|meta/i);
      });

      await user.keyboard("{Escape}");
      unmountMac();

      // Windows
      render(
        <KeyPressProvider helpKey="?" platform="win32">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        // Should display as Ctrl+S on Windows
        const shortcutDisplay = document.querySelector('[data-testid="shortcut-key"]');
        expect(shortcutDisplay?.textContent).toMatch(/ctrl/i);
      });
    });

    it("should use platform-specific symbols in help modal", async () => {
      const TestComponent = () => {
        useKeyPress({
          key: "mod+shift+k",
          description: "Test",
          onPress: vi.fn(),
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider helpKey="?" platform="darwin">
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("?");

      await waitFor(() => {
        const dialog = document.querySelector('[role="dialog"]');

        // macOS uses symbols: ⌘ ⇧ ⌥ ⌃
        const text = dialog?.textContent || "";
        const hasMacSymbols = /[⌘⇧⌥⌃]/.test(text);
        const hasMacWords = /cmd|command|shift/i.test(text);

        expect(hasMacSymbols || hasMacWords).toBe(true);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle platform switching at runtime", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Save",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      const App = ({ platform }: { platform: "darwin" | "win32" }) => (
        <KeyPressProvider platform={platform}>
          <TestComponent />
        </KeyPressProvider>
      );

      const { rerender } = render(<App platform="darwin" />);

      // Should work with meta on Mac
      await user.keyboard("{Meta>}s{/Meta}");
      expect(handler).toHaveBeenCalledTimes(1);

      handler.mockClear();

      // Switch to Windows
      rerender(<App platform="win32" />);

      // Should now work with ctrl
      await user.keyboard("{Control>}s{/Control}");
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it("should normalize shortcuts consistently regardless of input format", async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "mod+s",
          description: "Version 1",
          onPress: handler1,
        });

        useKeyPress({
          key: "MOD+S",
          description: "Version 2",
          onPress: handler2,
        });

        useKeyPress({
          key: "  mod  +  s  ",
          description: "Version 3",
          onPress: handler3,
        });

        return <div>Test</div>;
      };

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      render(
        <KeyPressProvider platform="darwin" showConflicts={true}>
          <TestComponent />
        </KeyPressProvider>
      );

      // All three should be detected as conflicts because they normalize to the same thing
      expect(consoleWarnSpy).toHaveBeenCalled();

      await user.keyboard("{Meta>}s{/Meta}");

      // All handlers should execute (in warn mode)
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });

    it("should handle platform-specific function keys", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "f5",
          description: "Refresh",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      const platforms: Array<"darwin" | "win32" | "linux"> = [
        "darwin",
        "win32",
        "linux",
      ];

      for (const platform of platforms) {
        const { unmount } = render(
          <KeyPressProvider platform={platform}>
            <TestComponent />
          </KeyPressProvider>
        );

        await user.keyboard("{F5}");
        expect(handler).toHaveBeenCalled();

        unmount();
        handler.mockClear();
      }
    });
  });

  describe("Modifier Combinations", () => {
    it("should handle ctrl+alt combination on all platforms", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "ctrl+alt+k",
          description: "Test",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      const platforms: Array<"darwin" | "win32" | "linux"> = [
        "darwin",
        "win32",
        "linux",
      ];

      for (const platform of platforms) {
        const { unmount } = render(
          <KeyPressProvider platform={platform}>
            <TestComponent />
          </KeyPressProvider>
        );

        await user.keyboard("{Control>}{Alt>}k{/Alt}{/Control}");
        expect(handler).toHaveBeenCalled();

        unmount();
        handler.mockClear();
      }
    });

    it("should handle all four modifiers together", async () => {
      const handler = vi.fn();

      const TestComponent = () => {
        useKeyPress({
          key: "ctrl+alt+shift+meta+k",
          description: "All modifiers",
          onPress: handler,
        });
        return <div>Test</div>;
      };

      render(
        <KeyPressProvider>
          <TestComponent />
        </KeyPressProvider>
      );

      await user.keyboard("{Control>}{Alt>}{Shift>}{Meta>}k{/Meta}{/Shift}{/Alt}{/Control}");
      expect(handler).toHaveBeenCalled();
    });
  });
});
