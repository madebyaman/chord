import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { KeyPressProvider, useKeyPress } from "../../src/lib";

describe("Integration: Chord Library", () => {
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

  it("Provider + useKeyPress: registers shortcut and triggers handler on keyboard event", async () => {
    const handleK = vi.fn();
    const handleSave = vi.fn();

    const TestComponent = () => {
      useKeyPress({
        key: "k",
        description: "Press K",
        onPress: handleK,
      });

      useKeyPress({
        key: "mod+s",
        description: "Save",
        onPress: handleSave,
      });

      return <div>Test Content</div>;
    };

    render(
      <KeyPressProvider>
        <TestComponent />
      </KeyPressProvider>
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();

    // Test simple key
    await user.keyboard("k");
    expect(handleK).toHaveBeenCalledTimes(1);

    // Test modifier key (mod+s = meta on Mac)
    await user.keyboard("{Meta>}s{/Meta}");
    expect(handleSave).toHaveBeenCalledTimes(1);
  });

  // TODO: Uncomment when useKeySequence is implemented
  // it("Provider + useKeySequence: registers sequence and triggers onComplete", async () => {
  //   const handleSequence = vi.fn();
  //
  //   const TestComponent = () => {
  //     useKeySequence({
  //       sequence: ["g", "h"],
  //       description: "Go home",
  //       onComplete: handleSequence,
  //     });
  //
  //     return <div>Test Content</div>;
  //   };
  //
  //   render(
  //     <KeyPressProvider>
  //       <TestComponent />
  //     </KeyPressProvider>
  //   );
  //
  //   // Press sequence: g then h
  //   await user.keyboard("g");
  //   expect(handleSequence).not.toHaveBeenCalled();
  //
  //   await user.keyboard("h");
  //   expect(handleSequence).toHaveBeenCalledTimes(1);
  //
  //   // Wrong order shouldn't trigger
  //   handleSequence.mockClear();
  //   await user.keyboard("h");
  //   await user.keyboard("g");
  //   expect(handleSequence).not.toHaveBeenCalled();
  // });

  it("Help dialog: opens with helpKey, shows shortcuts by category, closes with escape", async () => {
    const handleSave = vi.fn();
    const handleCopy = vi.fn();

    const TestComponent = () => {
      useKeyPress({
        key: "mod+s",
        description: "Save file",
        category: "File",
        onPress: handleSave,
      });

      useKeyPress({
        key: "mod+c",
        description: "Copy",
        category: "Edit",
        onPress: handleCopy,
      });

      return <div>Test Content</div>;
    };

    render(
      <KeyPressProvider helpKey="?">
        <TestComponent />
      </KeyPressProvider>
    );

    // Dialog should not be visible initially
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Press help key to open
    await user.keyboard("?");

    // Dialog should be visible
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Should show shortcuts with descriptions
    expect(screen.getByText("Save file")).toBeInTheDocument();
    expect(screen.getByText("Copy")).toBeInTheDocument();

    // Categories should be displayed
    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("Edit")).toBeInTheDocument();

    // Close with escape
    await user.keyboard("{Escape}");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    // Press help key again to open
    await user.keyboard("?");
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close by pressing help key again
    await user.keyboard("?");
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("Conflict detection: warns with component names, key, and descriptions when duplicate keys registered", async () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    const Component1 = () => {
      useKeyPress({
        key: "k",
        description: "First handler",
        component: "Component1",
        onPress: handler1,
      });
      return <div>Component 1</div>;
    };

    const Component2 = () => {
      useKeyPress({
        key: "k",
        description: "Second handler",
        component: "Component2",
        onPress: handler2,
      });
      return <div>Component 2</div>;
    };

    render(
      <KeyPressProvider>
        <Component1 />
        <Component2 />
      </KeyPressProvider>
    );

    // Should log warning in console
    expect(consoleWarnSpy).toHaveBeenCalled();
    const warningMessage = consoleWarnSpy.mock.calls[0][0];

    // Warning should include key
    expect(warningMessage).toMatch(/k/);

    // Warning should include component names
    expect(warningMessage).toMatch(/Component1/);
    expect(warningMessage).toMatch(/Component2/);

    // Warning should include descriptions
    expect(warningMessage).toMatch(/First handler/);
    expect(warningMessage).toMatch(/Second handler/);

    // By default (warn mode), all handlers should execute
    await user.keyboard("k");
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it("Cross-platform: mod key resolves to meta on Mac, ctrl on Windows/Linux", async () => {
    const handleSave = vi.fn();

    const TestComponent = () => {
      useKeyPress({
        key: "mod+s",
        description: "Save",
        onPress: handleSave,
      });

      return <div>Test Content</div>;
    };

    // Test on Mac (meta key)
    const { unmount: unmountMac } = render(
      <KeyPressProvider platform="darwin">
        <TestComponent />
      </KeyPressProvider>
    );

    await user.keyboard("{Meta>}s{/Meta}");
    expect(handleSave).toHaveBeenCalledTimes(1);

    unmountMac();
    handleSave.mockClear();

    // Test on Windows (ctrl key)
    const { unmount: unmountWin } = render(
      <KeyPressProvider platform="win32">
        <TestComponent />
      </KeyPressProvider>
    );

    await user.keyboard("{Control>}s{/Control}");
    expect(handleSave).toHaveBeenCalledTimes(1);

    unmountWin();
    handleSave.mockClear();

    // Test on Linux (ctrl key)
    render(
      <KeyPressProvider platform="linux">
        <TestComponent />
      </KeyPressProvider>
    );

    await user.keyboard("{Control>}s{/Control}");
    expect(handleSave).toHaveBeenCalledTimes(1);
  });
});
