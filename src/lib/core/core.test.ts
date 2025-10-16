import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChordCore } from "./core";
import type { KeyPressConfig } from "../types";

describe("ChordCore", () => {
  let core: ChordCore;

  beforeEach(() => {
    core = new ChordCore();
  });

  describe("registerHandler()", () => {
    it("returns a handler ID", () => {
      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      const id = core.registerHandler(config);
      expect(id).toBeDefined();
      expect(typeof id).toBe("number");
    });

    it("skips registration when enabled is false", () => {
      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
        enabled: false,
      };

      core.registerHandler(config);
      const handlers = core.getHandlers();
      expect(handlers).toHaveLength(0);
    });

    it("normalizes key before storing", () => {
      const config: KeyPressConfig = {
        key: "mod+s",
        description: "Save",
        onPress: vi.fn(),
      };

      core.registerHandler(config);
      const handlers = core.getHandlers();

      // Key should be normalized (mod becomes meta on Mac or ctrl on Windows/Linux)
      expect(handlers[0].key).toMatch(/meta\+s|ctrl\+s/);
    });

    it("stores all options passed", () => {
      const target = document.createElement("div");
      const onPress = vi.fn();
      const config: KeyPressConfig = {
        key: "k",
        description: "Test handler",
        category: "Navigation",
        target,
        eventType: "keyup",
        preventDefault: true,
        eventOptions: { capture: true, passive: false },
        component: "TestComponent",
        onPress,
      };

      core.registerHandler(config);
      const handlers = core.getHandlers();

      expect(handlers).toHaveLength(1);
      const handler = handlers[0];
      expect(handler.description).toBe("Test handler");
      expect(handler.category).toBe("Navigation");
      expect(handler.target).toBe(target);
      expect(handler.eventType).toBe("keyup");
      expect(handler.preventDefault).toBe(true);
      expect(handler.eventOptions).toEqual({ capture: true, passive: false });
      expect(handler.component).toBe("TestComponent");
      expect(handler.onPress).toBe(onPress);
    });

    it("returns sequential IDs for multiple registrations", () => {
      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      const id1 = core.registerHandler(config);
      const id2 = core.registerHandler(config);
      const id3 = core.registerHandler(config);

      expect(id2).toBeGreaterThan(id1);
      expect(id3).toBeGreaterThan(id2);
    });
  });

  describe("unregisterHandler()", () => {
    it("removes handler by ID", () => {
      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      const id = core.registerHandler(config);
      expect(core.getHandlers()).toHaveLength(1);

      core.unregisterHandler(id);
      expect(core.getHandlers()).toHaveLength(0);
    });

    it("handles undefined ID gracefully", () => {
      expect(() => {
        core.unregisterHandler(undefined);
      }).not.toThrow();
    });

    it("handles invalid ID gracefully", () => {
      expect(() => {
        core.unregisterHandler(99999);
      }).not.toThrow();
    });
  });

  describe("getHandlers()", () => {
    it("returns all registered handlers", () => {
      const config1: KeyPressConfig = {
        key: "k",
        description: "Test 1",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "j",
        description: "Test 2",
        onPress: vi.fn(),
      };

      core.registerHandler(config1);
      core.registerHandler(config2);

      const handlers = core.getHandlers();
      expect(handlers).toHaveLength(2);
      expect(handlers[0].description).toBe("Test 1");
      expect(handlers[1].description).toBe("Test 2");
    });

    it("returns empty array when no handlers registered", () => {
      const handlers = core.getHandlers();
      expect(handlers).toEqual([]);
    });
  });

  describe("getCategories()", () => {
    it("returns all unique categories", () => {
      const config1: KeyPressConfig = {
        key: "k",
        description: "Test 1",
        category: "File",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "j",
        description: "Test 2",
        category: "Edit",
        onPress: vi.fn(),
      };

      const config3: KeyPressConfig = {
        key: "h",
        description: "Test 3",
        category: "File",
        onPress: vi.fn(),
      };

      core.registerHandler(config1);
      core.registerHandler(config2);
      core.registerHandler(config3);

      const categories = core.getCategories();
      expect(categories).toHaveLength(2);
      expect(categories).toContain("File");
      expect(categories).toContain("Edit");
    });
  });

  describe("getConflicts()", () => {
    it("detects multiple handlers for same key", () => {
      const config1: KeyPressConfig = {
        key: "k",
        description: "First",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "k",
        description: "Second",
        onPress: vi.fn(),
      };

      core.registerHandler(config1);
      core.registerHandler(config2);

      const conflicts = core.getConflicts();
      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].handlers).toHaveLength(2);
    });

    it("detects normalized duplicates (mod+s vs cmd+s)", () => {
      const config1: KeyPressConfig = {
        key: "mod+s",
        description: "First",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "cmd+s",
        description: "Second",
        onPress: vi.fn(),
      };

      core.registerHandler(config1);
      core.registerHandler(config2);

      const conflicts = core.getConflicts();
      expect(conflicts).toHaveLength(1);
    });

    it("returns empty array when no conflicts", () => {
      const config1: KeyPressConfig = {
        key: "k",
        description: "K handler",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "j",
        description: "J handler",
        onPress: vi.fn(),
      };

      core.registerHandler(config1);
      core.registerHandler(config2);

      const conflicts = core.getConflicts();
      expect(conflicts).toEqual([]);
    });

    it("detects conflicts with different modifier orders", () => {
      const config1: KeyPressConfig = {
        key: "ctrl+shift+k",
        description: "First",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "shift+ctrl+k",
        description: "Second",
        onPress: vi.fn(),
      };

      core.registerHandler(config1);
      core.registerHandler(config2);

      const conflicts = core.getConflicts();
      expect(conflicts).toHaveLength(1);
    });
  });

  describe("subscribe()", () => {
    it("calls listener when handler is registered", () => {
      const listener = vi.fn();
      core.subscribe(listener);

      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      core.registerHandler(config);
      expect(listener).toHaveBeenCalled();
    });

    it("calls listener when handler is unregistered", () => {
      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      const id = core.registerHandler(config);

      const listener = vi.fn();
      core.subscribe(listener);

      core.unregisterHandler(id);
      expect(listener).toHaveBeenCalled();
    });

    it("unsubscribe stops notifications", () => {
      const listener = vi.fn();
      const unsubscribe = core.subscribe(listener);

      unsubscribe();

      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      core.registerHandler(config);
      expect(listener).not.toHaveBeenCalled();
    });

    it("supports multiple subscribers", () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      core.subscribe(listener1);
      core.subscribe(listener2);

      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      core.registerHandler(config);
      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });
  });
});
