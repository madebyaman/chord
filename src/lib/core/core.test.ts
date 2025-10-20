import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChordCore } from "./core";
import type { KeyPressConfig, KeySequenceConfig } from "../types";

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

      const id = core.registerHandler("keypress", config);
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

      core.registerHandler("keypress", config);
      const handlers = core.getHandlers();
      expect(handlers).toHaveLength(0);
    });

    it("normalizes key before storing", () => {
      const config: KeyPressConfig = {
        key: "mod+s",
        description: "Save",
        onPress: vi.fn(),
      };

      core.registerHandler("keypress", config);
      const handlers = core.getHandlers();

      // Key should be normalized (mod becomes meta on Mac or ctrl on Windows/Linux)
      expect(handlers[0].key).toMatch(/meta\+s|ctrl\+s/);
    });

    it("stores key, description, and category", () => {
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

      core.registerHandler("keypress", config);
      const handlers = core.getHandlers();

      expect(handlers).toHaveLength(1);
      const handler = handlers[0];
      expect(handler).toEqual({
        key: "k",
        description: "Test handler",
        category: "Navigation"
      });
    });

    it("returns sequential IDs for multiple registrations", () => {
      const config: KeyPressConfig = {
        key: "k",
        description: "Test",
        onPress: vi.fn(),
      };

      const id1 = core.registerHandler("keypress", config);
      const id2 = core.registerHandler("keypress", config);
      const id3 = core.registerHandler("keypress", config);

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

      const id = core.registerHandler("keypress", config);
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
    it("returns all registered handlers with key, description, and category", () => {
      const config1: KeyPressConfig = {
        key: "k",
        description: "Test 1",
        category: "Navigation",
        onPress: vi.fn(),
      };

      const config2: KeyPressConfig = {
        key: "j",
        description: "Test 2",
        category: "Edit",
        onPress: vi.fn(),
      };

      core.registerHandler("keypress", config1);
      core.registerHandler("keypress", config2);

      const handlers = core.getHandlers();
      expect(handlers).toHaveLength(2);
      expect(handlers[0]).toEqual({
        key: "k",
        description: "Test 1",
        category: "Navigation"
      });
      expect(handlers[1]).toEqual({
        key: "j",
        description: "Test 2",
        category: "Edit"
      });
    });

    it("returns empty array when no handlers registered", () => {
      const handlers = core.getHandlers();
      expect(handlers).toEqual([]);
    });
  });

  // describe("getCategories()", () => {
  //   it("returns all unique categories", () => {
  //     const config1: KeyPressConfig = {
  //       key: "k",
  //       description: "Test 1",
  //       category: "File",
  //       onPress: vi.fn(),
  //     };

  //     const config2: KeyPressConfig = {
  //       key: "j",
  //       description: "Test 2",
  //       category: "Edit",
  //       onPress: vi.fn(),
  //     };

  //     const config3: KeyPressConfig = {
  //       key: "h",
  //       description: "Test 3",
  //       category: "File",
  //       onPress: vi.fn(),
  //     };

  //     core.registerHandler(config1);
  //     core.registerHandler(config2);
  //     core.registerHandler(config3);

  //     const categories = core.getCategories();
  //     expect(categories).toHaveLength(2);
  //     expect(categories).toContain("File");
  //     expect(categories).toContain("Edit");
  //   });
  // });

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

      core.registerHandler("keypress", config1);
      core.registerHandler("keypress", config2);

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

      core.registerHandler("keypress", config1);
      core.registerHandler("keypress", config2);

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

      core.registerHandler("keypress", config1);
      core.registerHandler("keypress", config2);

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

      core.registerHandler("keypress", config1);
      core.registerHandler("keypress", config2);

      const conflicts = core.getConflicts();
      expect(conflicts).toHaveLength(1);
    });
  });

  describe("KeySequence support", () => {
    describe("registerHandler('sequence')", () => {
      it("returns a handler ID for sequences", () => {
        const config: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Go home",
          onComplete: vi.fn(),
        };

        const id = core.registerHandler("sequence", config);
        expect(id).toBeDefined();
        expect(typeof id).toBe("number");
      });

      it("skips registration when enabled is false", () => {
        const config: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Go home",
          onComplete: vi.fn(),
          enabled: false,
        };

        core.registerHandler("sequence", config);
        const handlers = core.getHandlers();
        expect(handlers.filter(h => h.keySequence)).toHaveLength(0);
      });

      it("normalizes keys in sequence before storing", () => {
        const config: KeySequenceConfig = {
          sequence: ["mod+g", "h"],
          description: "Go home",
          onComplete: vi.fn(),
        };

        core.registerHandler("sequence", config);
        const handlers = core.getHandlers();
        const sequenceHandler = handlers.find(h => h.keySequence);

        expect(sequenceHandler).toBeDefined();
        // mod should be normalized to meta on Mac or ctrl on Windows/Linux
        expect(sequenceHandler!.keySequence![0]).toMatch(/meta\+g|ctrl\+g/);
        expect(sequenceHandler!.keySequence![1]).toBe("h");
      });

      it("stores keySequence, description, and category", () => {
        const config: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Go home",
          category: "Navigation",
          onComplete: vi.fn(),
        };

        core.registerHandler("sequence", config);
        const handlers = core.getHandlers();
        const sequenceHandler = handlers.find(h => h.keySequence);

        expect(sequenceHandler).toBeDefined();
        expect(sequenceHandler).toEqual({
          keySequence: ["g", "h"],
          description: "Go home",
          category: "Navigation",
        });
      });

      it("returns sequential IDs for multiple registrations", () => {
        const config: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Test",
          onComplete: vi.fn(),
        };

        const id1 = core.registerHandler("sequence", config);
        const id2 = core.registerHandler("sequence", config);
        const id3 = core.registerHandler("sequence", config);

        expect(id2).toBeGreaterThan(id1!);
        expect(id3).toBeGreaterThan(id2!);
      });

      it("generates unique IDs across keypress and sequence handlers", () => {
        const keypressConfig: KeyPressConfig = {
          key: "k",
          description: "Test",
          onPress: vi.fn(),
        };

        const sequenceConfig: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Test",
          onComplete: vi.fn(),
        };

        const id1 = core.registerHandler("keypress", keypressConfig);
        const id2 = core.registerHandler("sequence", sequenceConfig);
        const id3 = core.registerHandler("keypress", keypressConfig);

        expect(id1).toBeDefined();
        expect(id2).toBeDefined();
        expect(id3).toBeDefined();
        expect(id2).toBeGreaterThan(id1!);
        expect(id3).toBeGreaterThan(id2!);
      });
    });

    describe("unregisterHandler() with sequences", () => {
      it("removes sequence handler by ID", () => {
        const config: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Test",
          onComplete: vi.fn(),
        };

        const id = core.registerHandler("sequence", config);
        const handlersBefore = core.getHandlers();
        expect(handlersBefore.filter(h => h.keySequence)).toHaveLength(1);

        core.unregisterHandler(id);
        const handlersAfter = core.getHandlers();
        expect(handlersAfter.filter(h => h.keySequence)).toHaveLength(0);
      });

      it("does not affect keypress handlers when unregistering sequence", () => {
        const keypressConfig: KeyPressConfig = {
          key: "k",
          description: "Test keypress",
          onPress: vi.fn(),
        };

        const sequenceConfig: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Test sequence",
          onComplete: vi.fn(),
        };

        core.registerHandler("keypress", keypressConfig);
        const sequenceId = core.registerHandler("sequence", sequenceConfig);

        expect(core.getHandlers()).toHaveLength(2);

        core.unregisterHandler(sequenceId);

        const handlers = core.getHandlers();
        expect(handlers).toHaveLength(1);
        expect(handlers[0].key).toBe("k");
      });
    });

    describe("getHandlers() with sequences", () => {
      it("returns both keypress and sequence handlers", () => {
        const keypressConfig: KeyPressConfig = {
          key: "k",
          description: "Test keypress",
          category: "Edit",
          onPress: vi.fn(),
        };

        const sequenceConfig: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Test sequence",
          category: "Navigation",
          onComplete: vi.fn(),
        };

        core.registerHandler("keypress", keypressConfig);
        core.registerHandler("sequence", sequenceConfig);

        const handlers = core.getHandlers();
        expect(handlers).toHaveLength(2);

        const keypressHandler = handlers.find(h => h.key);
        const sequenceHandler = handlers.find(h => h.keySequence);

        expect(keypressHandler).toEqual({
          key: "k",
          description: "Test keypress",
          category: "Edit",
        });

        expect(sequenceHandler).toEqual({
          keySequence: ["g", "h"],
          description: "Test sequence",
          category: "Navigation",
        });
      });
    });

    describe("getConflicts() with sequences", () => {
      it("detects multiple handlers for same sequence", () => {
        const config1: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "First",
          onComplete: vi.fn(),
        };

        const config2: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Second",
          onComplete: vi.fn(),
        };

        core.registerHandler("sequence", config1);
        core.registerHandler("sequence", config2);

        const conflicts = core.getConflicts();
        expect(conflicts).toHaveLength(1);
        expect(conflicts[0].handlers).toHaveLength(2);
        expect(conflicts[0].key).toBe("g,h");
      });

      it("detects normalized sequence duplicates", () => {
        const config1: KeySequenceConfig = {
          sequence: ["ctrl+g", "h"],
          description: "First",
          onComplete: vi.fn(),
        };

        const config2: KeySequenceConfig = {
          sequence: ["ctrl+g", "h"],
          description: "Second",
          onComplete: vi.fn(),
        };

        core.registerHandler("sequence", config1);
        core.registerHandler("sequence", config2);

        const conflicts = core.getConflicts();
        // Both sequences normalize to the same thing
        expect(conflicts).toHaveLength(1);
      });

      it("does not conflict when sequences are different", () => {
        const config1: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Go home",
          onComplete: vi.fn(),
        };

        const config2: KeySequenceConfig = {
          sequence: ["g", "t"],
          description: "Go top",
          onComplete: vi.fn(),
        };

        core.registerHandler("sequence", config1);
        core.registerHandler("sequence", config2);

        const conflicts = core.getConflicts();
        expect(conflicts).toEqual([]);
      });

      it("keypress and sequence handlers do not conflict with each other", () => {
        const keypressConfig: KeyPressConfig = {
          key: "g",
          description: "Test keypress",
          onPress: vi.fn(),
        };

        const sequenceConfig: KeySequenceConfig = {
          sequence: ["g", "h"],
          description: "Test sequence",
          onComplete: vi.fn(),
        };

        core.registerHandler("keypress", keypressConfig);
        core.registerHandler("sequence", sequenceConfig);

        const conflicts = core.getConflicts();
        expect(conflicts).toEqual([]);
      });
    });
  });

});
