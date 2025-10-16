/// <reference types="@vitest/browser/matchers" />

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useKeyPress } from "./use-keypress";
import { KeyPressProvider, useKeyPressContext } from "../context/provider";
import type { ReactNode } from "react";

const createWrapper = () => {
  return ({ children }: { children: ReactNode }) => <KeyPressProvider>{children}</KeyPressProvider>;
};

describe("useKeyPress", () => {
  describe("key prop", () => {
    it("simple key: registers and triggers handler", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Press K",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Simulate keydown event
      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("modifier key: mod+s", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "mod+s",
            description: "Save",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Simulate meta+s (on Mac)
      const event = new KeyboardEvent("keydown", {
        key: "s",
        metaKey: true,
      });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("multiple modifiers: ctrl+shift+k", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "ctrl+shift+k",
            description: "Complex",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", {
        key: "k",
        ctrlKey: true,
        shiftKey: true,
      });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("description prop", () => {
    it("is included in getHandlers()", () => {
      const { result: providerResult } = renderHook(() => useKeyPressContext(), {
        wrapper: createWrapper(),
      });

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "My custom description",
            onPress: vi.fn(),
          }),
        { wrapper: createWrapper() },
      );

      const handlers = providerResult.current.getHandlers();
      const handler = handlers.find((h) => h.description === "My custom description");
      expect(handler).toBeDefined();
    });
  });

  describe("onPress prop", () => {
    it("is called multiple times for multiple key presses", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event1 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event1);

      const event2 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event2);

      expect(onPress).toHaveBeenCalledTimes(2);
    });
  });

  describe("category prop", () => {
    it('defaults to "General"', () => {
      const { result: providerResult } = renderHook(
        () => {
          return useKeyPressContext();
        },
        { wrapper: createWrapper() },
      );

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress: vi.fn(),
          }),
        { wrapper: createWrapper() },
      );

      const handlers = providerResult.current.getHandlers();
      expect(handlers[0].category).toBe("General");
    });

    it("custom category is stored", () => {
      const { result: providerResult } = renderHook(
        () => {
          return useKeyPressContext();
        },
        { wrapper: createWrapper() },
      );

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            category: "File",
            onPress: vi.fn(),
          }),
        { wrapper: createWrapper() },
      );

      const handlers = providerResult.current.getHandlers();
      expect(handlers[0].category).toBe("File");
    });
  });

  describe("enabled prop", () => {
    it("true: handler executes", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            enabled: true,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("false: handler doesn't register", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            enabled: false,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);

      expect(onPress).not.toHaveBeenCalled();
    });

    it("undefined: defaults to true", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("preventDefault prop", () => {
    it("true: event.preventDefault() is called", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            preventDefault: true,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k", cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      document.dispatchEvent(event);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("false: allows default browser behavior", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            preventDefault: false,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k", cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, "preventDefault");
      document.dispatchEvent(event);

      expect(preventDefaultSpy).not.toHaveBeenCalled();
    });
  });

  describe("component prop", () => {
    it("is included in conflict warnings", () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      renderHook(
        () => {
          useKeyPress({
            key: "k",
            description: "First",
            component: "MyComponent",
            onPress: vi.fn(),
          });

          useKeyPress({
            key: "k",
            description: "Second",
            component: "OtherComponent",
            onPress: vi.fn(),
          });
        },
        { wrapper: createWrapper() },
      );

      expect(consoleWarnSpy).toHaveBeenCalled();
      const warningMessage = consoleWarnSpy.mock.calls[0][0];
      expect(warningMessage).toMatch(/MyComponent/);
      expect(warningMessage).toMatch(/OtherComponent/);

      consoleWarnSpy.mockRestore();
    });
  });

  describe("target prop", () => {
    it("defaults to document when not provided", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Event on document should trigger
      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("listens on custom target instead of document", () => {
      const onPress = vi.fn();
      const customTarget = document.createElement("div");

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            target: customTarget,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Event on custom target should trigger
      const event = new KeyboardEvent("keydown", { key: "k" });
      customTarget.dispatchEvent(event);
      expect(onPress).toHaveBeenCalledTimes(1);

      // Event on document should NOT trigger
      onPress.mockClear();
      const docEvent = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(docEvent);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("cleanup removes listener from custom target", () => {
      const onPress = vi.fn();
      const customTarget = document.createElement("div");

      const { unmount } = renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            target: customTarget,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      unmount();

      // Event should not trigger after unmount
      const event = new KeyboardEvent("keydown", { key: "k" });
      customTarget.dispatchEvent(event);
      expect(onPress).not.toHaveBeenCalled();
    });
  });

  describe("eventType prop", () => {
    it("keydown (default)", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventType: "keydown",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("keyup", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventType: "keyup",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Keydown should not trigger
      const keydownEvent = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(keydownEvent);
      expect(onPress).not.toHaveBeenCalled();

      // Keyup should trigger
      const keyupEvent = new KeyboardEvent("keyup", { key: "k" });
      document.dispatchEvent(keyupEvent);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("keypress", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventType: "keypress",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keypress", { key: "k" });
      document.dispatchEvent(event);

      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("eventOptions prop", () => {
    it("capture: true enables capture phase", () => {
      const onPress = vi.fn();
      const captureTarget = document.createElement("div");
      document.body.appendChild(captureTarget);

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            target: captureTarget,
            eventOptions: { capture: true },
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k", bubbles: true });
      captureTarget.dispatchEvent(event);
      expect(onPress).toHaveBeenCalledTimes(1);

      document.body.removeChild(captureTarget);
    });

    it("once: true triggers handler only once", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventOptions: { once: true },
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // First press should trigger
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event1);
      expect(onPress).toHaveBeenCalledTimes(1);

      // Second press should NOT trigger due to once: true
      const event2 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event2);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("passive: true works correctly", () => {
      const onPress = vi.fn();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventOptions: { passive: true },
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it("signal: can abort listener", () => {
      const onPress = vi.fn();
      const controller = new AbortController();

      renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            eventOptions: { signal: controller.signal },
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Should work before abort
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event1);
      expect(onPress).toHaveBeenCalledTimes(1);

      // Abort the signal
      controller.abort();

      // Should NOT work after abort
      const event2 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event2);
      expect(onPress).toHaveBeenCalledTimes(1);
    });
  });

  describe("Lifecycle", () => {
    it("unregisters on unmount", () => {
      const onPress = vi.fn();

      const { unmount } = renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Handler should work before unmount
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event1);
      expect(onPress).toHaveBeenCalledTimes(1);

      unmount();

      // Handler should NOT work after unmount
      onPress.mockClear();
      const event2 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event2);
      expect(onPress).not.toHaveBeenCalled();
    });

    it("re-registers when key changes", async () => {
      const onPress = vi.fn();
      let currentKey = "k";

      const { rerender } = renderHook(
        () =>
          useKeyPress({
            key: currentKey,
            description: "Test",
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      // Test initial key
      const event1 = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event1);
      expect(onPress).toHaveBeenCalledTimes(1);

      // Change key
      currentKey = "j";
      rerender();

      await waitFor(() => {
        // Old key should not work
        onPress.mockClear();
        const event2 = new KeyboardEvent("keydown", { key: "k" });
        document.dispatchEvent(event2);
        expect(onPress).not.toHaveBeenCalled();

        // New key should work
        const event3 = new KeyboardEvent("keydown", { key: "j" });
        document.dispatchEvent(event3);
        expect(onPress).toHaveBeenCalledTimes(1);
      });
    });

    it("re-registers when description changes", () => {
      const onPress = vi.fn();
      let currentDescription = "First";

      const { rerender } = renderHook(
        () =>
          useKeyPress({
            key: "k",
            description: currentDescription,
            onPress,
          }),
        { wrapper: createWrapper() },
      );

      currentDescription = "Second";
      rerender();

      // Handler should still work after description change
      const event = new KeyboardEvent("keydown", { key: "k" });
      document.dispatchEvent(event);
      expect(onPress).toHaveBeenCalled();
    });

    it("re-registers when any option changes", async () => {
      const onPress1 = vi.fn();
      const onPress2 = vi.fn();
      const target1 = document.createElement("div");
      const target2 = document.createElement("div");

      let config = {
        key: "k",
        description: "Test",
        category: "General",
        target: target1,
        eventType: "keydown" as const,
        preventDefault: false,
        eventOptions: { capture: false },
        onPress: onPress1,
      };

      const { rerender } = renderHook(
        () => useKeyPress(config),
        { wrapper: createWrapper() },
      );

      // Change multiple options
      config = {
        key: "j",
        description: "Updated",
        category: "Navigation",
        target: target2,
        eventType: "keyup" as const,
        preventDefault: true,
        eventOptions: { capture: true },
        onPress: onPress2,
      };
      rerender();

      await waitFor(() => {
        // Old key should not work
        const oldKeyEvent = new KeyboardEvent("keydown", { key: "k" });
        target1.dispatchEvent(oldKeyEvent);
        expect(onPress1).not.toHaveBeenCalled();

        // New key with new target and eventType should work
        const newKeyEvent = new KeyboardEvent("keyup", { key: "j" });
        target2.dispatchEvent(newKeyEvent);
        expect(onPress2).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Error handling", () => {
    it("throws when used outside provider", () => {
      expect(() => {
        renderHook(() =>
          useKeyPress({
            key: "k",
            description: "Test",
            onPress: vi.fn(),
          }),
        );
      }).toThrow();
    });
  });
});
