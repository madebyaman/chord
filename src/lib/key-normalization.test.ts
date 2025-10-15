import { describe, it, expect } from "vitest";
import {
  normalizeShortcut,
  normalizeEvent,
  normalizeKeyName,
  serializeNormalizedKey,
  parseShortcut,
  validateShortcut,
  areShortcutsEqual,
  getPlatform,
  isMac,
} from "./key-normalization";
import type { NormalizedKey } from "./types";

describe("key-normalization", () => {
  describe("normalizeShortcut", () => {
    describe("basic normalization", () => {
      it("should normalize a single key", () => {
        expect(normalizeShortcut("k", "darwin")).toBe("k");
        expect(normalizeShortcut("K", "darwin")).toBe("k");
        expect(normalizeShortcut("a", "darwin")).toBe("a");
      });

      it("should normalize single modifier combinations", () => {
        expect(normalizeShortcut("mod+k", "darwin")).toBe("meta+k");
        expect(normalizeShortcut("mod+k", "win32")).toBe("ctrl+k");
        expect(normalizeShortcut("mod+k", "linux")).toBe("ctrl+k");
      });

      it("should normalize multiple modifiers", () => {
        expect(normalizeShortcut("mod+shift+k", "darwin")).toBe(
          "shift+meta+k"
        );
        expect(normalizeShortcut("mod+shift+k", "win32")).toBe("ctrl+shift+k");
        expect(normalizeShortcut("ctrl+alt+shift+k", "darwin")).toBe(
          "ctrl+alt+shift+k"
        );
      });

      it("should handle case insensitivity", () => {
        expect(normalizeShortcut("MOD+K", "darwin")).toBe("meta+k");
        expect(normalizeShortcut("CTRL+SHIFT+K", "darwin")).toBe(
          "ctrl+shift+k"
        );
        expect(normalizeShortcut("Cmd+S", "darwin")).toBe("meta+s");
      });

      it("should normalize whitespace", () => {
        expect(normalizeShortcut(" mod + k ", "darwin")).toBe("meta+k");
        expect(normalizeShortcut("  ctrl  +  shift  +  k  ", "darwin")).toBe(
          "ctrl+shift+k"
        );
      });
    });

    describe("modifier resolution", () => {
      it("should resolve mod to meta on macOS", () => {
        expect(normalizeShortcut("mod+s", "darwin")).toBe("meta+s");
        expect(normalizeShortcut("mod+shift+s", "darwin")).toBe("shift+meta+s");
      });

      it("should resolve mod to ctrl on Windows/Linux", () => {
        expect(normalizeShortcut("mod+s", "win32")).toBe("ctrl+s");
        expect(normalizeShortcut("mod+s", "linux")).toBe("ctrl+s");
        expect(normalizeShortcut("mod+shift+s", "win32")).toBe("ctrl+shift+s");
      });

      it("should handle cmd/command aliases", () => {
        expect(normalizeShortcut("cmd+k", "darwin")).toBe("meta+k");
        expect(normalizeShortcut("command+k", "darwin")).toBe("meta+k");
      });

      it("should handle ctrl/control aliases", () => {
        expect(normalizeShortcut("ctrl+k", "darwin")).toBe("ctrl+k");
        expect(normalizeShortcut("control+k", "darwin")).toBe("ctrl+k");
      });

      it("should handle alt/option aliases", () => {
        expect(normalizeShortcut("alt+k", "darwin")).toBe("alt+k");
        expect(normalizeShortcut("option+k", "darwin")).toBe("alt+k");
      });
    });

    describe("modifier order normalization", () => {
      it("should sort modifiers in consistent order", () => {
        expect(normalizeShortcut("k+shift+ctrl", "darwin")).toBe("ctrl+shift+k");
        expect(normalizeShortcut("shift+mod+k", "darwin")).toBe("shift+meta+k");
        expect(normalizeShortcut("k+meta+shift+alt+ctrl", "darwin")).toBe(
          "ctrl+alt+shift+meta+k"
        );
      });

      it("should maintain order: ctrl, alt, shift, meta", () => {
        expect(normalizeShortcut("meta+shift+alt+ctrl+k", "darwin")).toBe(
          "ctrl+alt+shift+meta+k"
        );
        expect(normalizeShortcut("shift+ctrl+k", "darwin")).toBe("ctrl+shift+k");
      });
    });

    describe("special keys", () => {
      it("should normalize escape variations", () => {
        expect(normalizeShortcut("esc", "darwin")).toBe("escape");
        expect(normalizeShortcut("escape", "darwin")).toBe("escape");
        expect(normalizeShortcut("ESC", "darwin")).toBe("escape");
      });

      it("should normalize enter variations", () => {
        expect(normalizeShortcut("enter", "darwin")).toBe("enter");
        expect(normalizeShortcut("return", "darwin")).toBe("enter");
      });

      it("should normalize space variations", () => {
        expect(normalizeShortcut("space", "darwin")).toBe("space");
        expect(normalizeShortcut("spacebar", "darwin")).toBe("space");
      });

      it("should normalize arrow keys", () => {
        expect(normalizeShortcut("up", "darwin")).toBe("arrowup");
        expect(normalizeShortcut("down", "darwin")).toBe("arrowdown");
        expect(normalizeShortcut("left", "darwin")).toBe("arrowleft");
        expect(normalizeShortcut("right", "darwin")).toBe("arrowright");
        expect(normalizeShortcut("arrowup", "darwin")).toBe("arrowup");
      });

      it("should normalize delete/backspace", () => {
        expect(normalizeShortcut("delete", "darwin")).toBe("delete");
        expect(normalizeShortcut("del", "darwin")).toBe("delete");
        expect(normalizeShortcut("backspace", "darwin")).toBe("backspace");
      });

      it("should normalize other special keys", () => {
        expect(normalizeShortcut("tab", "darwin")).toBe("tab");
        expect(normalizeShortcut("home", "darwin")).toBe("home");
        expect(normalizeShortcut("end", "darwin")).toBe("end");
        expect(normalizeShortcut("pageup", "darwin")).toBe("pageup");
        expect(normalizeShortcut("pagedown", "darwin")).toBe("pagedown");
      });
    });

    describe("platform differences", () => {
      it("should produce different results for mod on different platforms", () => {
        const shortcut = "mod+s";
        const macResult = normalizeShortcut(shortcut, "darwin");
        const winResult = normalizeShortcut(shortcut, "win32");
        const linuxResult = normalizeShortcut(shortcut, "linux");

        expect(macResult).toBe("meta+s");
        expect(winResult).toBe("ctrl+s");
        expect(linuxResult).toBe("ctrl+s");
      });

      it("should produce same results for explicit modifiers", () => {
        const shortcut = "ctrl+alt+k";
        expect(normalizeShortcut(shortcut, "darwin")).toBe("ctrl+alt+k");
        expect(normalizeShortcut(shortcut, "win32")).toBe("ctrl+alt+k");
        expect(normalizeShortcut(shortcut, "linux")).toBe("ctrl+alt+k");
      });
    });

    describe("validation errors", () => {
      it("should throw on mod+ctrl combination", () => {
        expect(() => normalizeShortcut("mod+ctrl+k", "darwin")).toThrow(
          /cannot use 'mod' with 'ctrl'/i
        );
      });

      it("should throw on mod+meta combination", () => {
        expect(() => normalizeShortcut("mod+meta+k", "darwin")).toThrow(
          /cannot use 'mod' with 'meta'/i
        );
      });

      it("should throw on mod+cmd combination", () => {
        expect(() => normalizeShortcut("mod+cmd+k", "darwin")).toThrow(
          /cannot use 'mod' with 'meta'/i
        );
      });

      it("should throw when no key is specified", () => {
        expect(() => normalizeShortcut("mod+shift", "darwin")).toThrow(
          /no key specified/i
        );
        expect(() => normalizeShortcut("ctrl+alt", "darwin")).toThrow(
          /no key specified/i
        );
      });

      it("should throw when multiple keys are specified", () => {
        expect(() => normalizeShortcut("k+j", "darwin")).toThrow(
          /multiple keys specified/i
        );
      });
    });

    describe("edge cases", () => {
      it("should handle number keys", () => {
        expect(normalizeShortcut("1", "darwin")).toBe("1");
        expect(normalizeShortcut("mod+1", "darwin")).toBe("meta+1");
      });

      it("should handle function keys", () => {
        expect(normalizeShortcut("f1", "darwin")).toBe("f1");
        expect(normalizeShortcut("F12", "darwin")).toBe("f12");
        expect(normalizeShortcut("mod+f5", "darwin")).toBe("meta+f5");
      });

      it("should handle symbol keys", () => {
        expect(normalizeShortcut("/", "darwin")).toBe("/");
        expect(normalizeShortcut("[", "darwin")).toBe("[");
        expect(normalizeShortcut("]", "darwin")).toBe("]");
        expect(normalizeShortcut("mod+/", "darwin")).toBe("meta+/");
      });

      it("should handle unknown keys by lowercasing them", () => {
        expect(normalizeShortcut("unknownkey", "darwin")).toBe("unknownkey");
        expect(normalizeShortcut("mod+customkey", "darwin")).toBe(
          "meta+customkey"
        );
      });
    });
  });

  describe("normalizeEvent", () => {
    describe("simple keys", () => {
      it("should normalize simple key presses", () => {
        const event = { key: "k" } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("k");
      });

      it("should normalize uppercase keys", () => {
        const event = { key: "K", shiftKey: true } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("shift+k");
      });

      it("should normalize number keys", () => {
        const event = { key: "1" } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("1");
      });
    });

    describe("with modifiers", () => {
      it("should include meta modifier", () => {
        const event = { key: "k", metaKey: true } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("meta+k");
      });

      it("should include ctrl modifier", () => {
        const event = { key: "k", ctrlKey: true } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("ctrl+k");
      });

      it("should include shift modifier", () => {
        const event = { key: "k", shiftKey: true } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("shift+k");
      });

      it("should include alt modifier", () => {
        const event = { key: "k", altKey: true } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("alt+k");
      });

      it("should include multiple modifiers in correct order", () => {
        const event = {
          key: "k",
          ctrlKey: true,
          shiftKey: true,
        } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("ctrl+shift+k");
      });

      it("should include all modifiers in correct order", () => {
        const event = {
          key: "k",
          ctrlKey: true,
          altKey: true,
          shiftKey: true,
          metaKey: true,
        } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("ctrl+alt+shift+meta+k");
      });
    });

    describe("special keys", () => {
      it("should normalize Escape key", () => {
        const event = { key: "Escape" } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("escape");
      });

      it("should normalize Enter key", () => {
        const event = { key: "Enter" } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("enter");
      });

      it("should normalize space key", () => {
        const event = { key: " " } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("space");
      });

      it("should normalize arrow keys", () => {
        expect(normalizeEvent({ key: "ArrowUp" } as KeyboardEvent)).toBe(
          "arrowup"
        );
        expect(normalizeEvent({ key: "ArrowDown" } as KeyboardEvent)).toBe(
          "arrowdown"
        );
        expect(normalizeEvent({ key: "ArrowLeft" } as KeyboardEvent)).toBe(
          "arrowleft"
        );
        expect(normalizeEvent({ key: "ArrowRight" } as KeyboardEvent)).toBe(
          "arrowright"
        );
      });

      it("should normalize Tab key", () => {
        const event = { key: "Tab" } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("tab");
      });

      it("should normalize Delete and Backspace", () => {
        expect(normalizeEvent({ key: "Delete" } as KeyboardEvent)).toBe(
          "delete"
        );
        expect(normalizeEvent({ key: "Backspace" } as KeyboardEvent)).toBe(
          "backspace"
        );
      });
    });

    describe("with modifiers and special keys", () => {
      it("should combine modifiers with special keys", () => {
        const event = {
          key: "Enter",
          ctrlKey: true,
        } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("ctrl+enter");
      });

      it("should handle cmd+escape", () => {
        const event = {
          key: "Escape",
          metaKey: true,
        } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("meta+escape");
      });

      it("should handle shift+arrow keys", () => {
        const event = {
          key: "ArrowUp",
          shiftKey: true,
        } as KeyboardEvent;
        expect(normalizeEvent(event)).toBe("shift+arrowup");
      });
    });
  });

  describe("integration tests", () => {
    describe("Mac platform", () => {
      it("should match mod+s registration with cmd+s press", () => {
        const registered = normalizeShortcut("mod+s", "darwin");
        const pressed = normalizeEvent({
          key: "s",
          metaKey: true,
        } as KeyboardEvent);

        expect(registered).toBe(pressed);
        expect(registered).toBe("meta+s");
      });

      it("should match cmd+k registration with meta+k press", () => {
        const registered = normalizeShortcut("cmd+k", "darwin");
        const pressed = normalizeEvent({
          key: "k",
          metaKey: true,
        } as KeyboardEvent);

        expect(registered).toBe(pressed);
      });

      it("should match shift+mod+k regardless of order", () => {
        const registered1 = normalizeShortcut("shift+mod+k", "darwin");
        const registered2 = normalizeShortcut("mod+shift+k", "darwin");
        const pressed = normalizeEvent({
          key: "k",
          metaKey: true,
          shiftKey: true,
        } as KeyboardEvent);

        expect(registered1).toBe(registered2);
        expect(registered1).toBe(pressed);
      });

      it("should handle ctrl+alt+k on Mac (not using cmd)", () => {
        const registered = normalizeShortcut("ctrl+alt+k", "darwin");
        const pressed = normalizeEvent({
          key: "k",
          ctrlKey: true,
          altKey: true,
        } as KeyboardEvent);

        expect(registered).toBe(pressed);
        expect(registered).toBe("ctrl+alt+k");
      });
    });

    describe("Windows/Linux platform", () => {
      it("should match mod+s registration with ctrl+s press", () => {
        const registered = normalizeShortcut("mod+s", "win32");
        const pressed = normalizeEvent({
          key: "s",
          ctrlKey: true,
        } as KeyboardEvent);

        expect(registered).toBe(pressed);
        expect(registered).toBe("ctrl+s");
      });

      it("should match mod+shift+k with ctrl+shift+k press", () => {
        const registered = normalizeShortcut("mod+shift+k", "win32");
        const pressed = normalizeEvent({
          key: "k",
          ctrlKey: true,
          shiftKey: true,
        } as KeyboardEvent);

        expect(registered).toBe(pressed);
        expect(registered).toBe("ctrl+shift+k");
      });
    });

    describe("conflict detection", () => {
      it("should detect when two handlers register the same key", () => {
        const handler1 = normalizeShortcut("mod+s", "darwin");
        const handler2 = normalizeShortcut("cmd+s", "darwin");

        expect(handler1).toBe(handler2);
      });

      it("should detect conflicts despite different order", () => {
        const handler1 = normalizeShortcut("shift+mod+k", "darwin");
        const handler2 = normalizeShortcut("mod+shift+k", "darwin");

        expect(handler1).toBe(handler2);
      });

      it("should detect conflicts despite different case", () => {
        const handler1 = normalizeShortcut("MOD+S", "darwin");
        const handler2 = normalizeShortcut("cmd+s", "darwin");

        expect(handler1).toBe(handler2);
      });
    });

    describe("cross-platform consistency", () => {
      it("should produce different results for mod across platforms", () => {
        const mac = normalizeShortcut("mod+s", "darwin");
        const windows = normalizeShortcut("mod+s", "win32");

        expect(mac).toBe("meta+s");
        expect(windows).toBe("ctrl+s");
        expect(mac).not.toBe(windows);
      });

      it("should produce same results for explicit keys across platforms", () => {
        const shortcut = "ctrl+alt+k";
        const mac = normalizeShortcut(shortcut, "darwin");
        const windows = normalizeShortcut(shortcut, "win32");
        const linux = normalizeShortcut(shortcut, "linux");

        expect(mac).toBe(windows);
        expect(windows).toBe(linux);
      });
    });
  });

  describe("helper functions", () => {
    describe("normalizeKeyName", () => {
      it("should normalize special keys", () => {
        expect(normalizeKeyName("Escape")).toBe("escape");
        expect(normalizeKeyName("ESC")).toBe("escape");
        expect(normalizeKeyName(" ")).toBe("space");
        expect(normalizeKeyName("ArrowUp")).toBe("arrowup");
      });

      it("should lowercase regular keys", () => {
        expect(normalizeKeyName("K")).toBe("k");
        expect(normalizeKeyName("A")).toBe("a");
      });

      it("should pass through unknown keys", () => {
        expect(normalizeKeyName("unknownkey")).toBe("unknownkey");
      });
    });

    describe("serializeNormalizedKey", () => {
      it("should serialize with correct modifier order", () => {
        const normalized: NormalizedKey = {
          key: "k",
          ctrl: true,
          alt: true,
          shift: true,
          meta: true,
        };
        expect(serializeNormalizedKey(normalized)).toBe(
          "ctrl+alt+shift+meta+k"
        );
      });

      it("should serialize with only some modifiers", () => {
        const normalized: NormalizedKey = {
          key: "k",
          ctrl: false,
          alt: false,
          shift: true,
          meta: true,
        };
        expect(serializeNormalizedKey(normalized)).toBe("shift+meta+k");
      });

      it("should serialize key only", () => {
        const normalized: NormalizedKey = {
          key: "k",
          ctrl: false,
          alt: false,
          shift: false,
          meta: false,
        };
        expect(serializeNormalizedKey(normalized)).toBe("k");
      });
    });

    describe("parseShortcut", () => {
      it("should split shortcut string", () => {
        expect(parseShortcut("mod+s")).toEqual(["mod", "s"]);
        expect(parseShortcut("ctrl+shift+k")).toEqual(["ctrl", "shift", "k"]);
      });

      it("should handle whitespace", () => {
        expect(parseShortcut(" mod + s ")).toEqual(["mod", "s"]);
        expect(parseShortcut("  ctrl  +  k  ")).toEqual(["ctrl", "k"]);
      });

      it("should lowercase parts", () => {
        expect(parseShortcut("MOD+S")).toEqual(["mod", "s"]);
        expect(parseShortcut("CTRL+SHIFT+K")).toEqual(["ctrl", "shift", "k"]);
      });
    });

    describe("validateShortcut", () => {
      it("should pass valid shortcuts", () => {
        expect(() => validateShortcut(["mod", "s"])).not.toThrow();
        expect(() => validateShortcut(["ctrl", "shift", "k"])).not.toThrow();
      });

      it("should throw on mod+ctrl", () => {
        expect(() => validateShortcut(["mod", "ctrl", "k"])).toThrow(
          /cannot use 'mod' with 'ctrl'/i
        );
      });

      it("should throw on mod+meta", () => {
        expect(() => validateShortcut(["mod", "meta", "k"])).toThrow(
          /cannot use 'mod' with 'meta'/i
        );
      });

      it("should throw on no key", () => {
        expect(() => validateShortcut(["mod", "shift"])).toThrow(
          /no key specified/i
        );
      });

      it("should throw on multiple keys", () => {
        expect(() => validateShortcut(["k", "j"])).toThrow(
          /multiple keys specified/i
        );
      });
    });

    describe("areShortcutsEqual", () => {
      it("should return true for equivalent shortcuts", () => {
        expect(areShortcutsEqual("mod+s", "cmd+s", "darwin")).toBe(true);
        expect(areShortcutsEqual("mod+s", "ctrl+s", "win32")).toBe(true);
        expect(areShortcutsEqual("shift+mod+k", "mod+shift+k", "darwin")).toBe(
          true
        );
      });

      it("should return false for different shortcuts", () => {
        expect(areShortcutsEqual("mod+s", "mod+k", "darwin")).toBe(false);
        expect(areShortcutsEqual("ctrl+s", "alt+s", "darwin")).toBe(false);
      });

      it("should handle case differences", () => {
        expect(areShortcutsEqual("MOD+S", "cmd+s", "darwin")).toBe(true);
      });
    });
  });

  describe("platform detection", () => {
    describe("getPlatform", () => {
      it("should return a valid platform type", () => {
        const platform = getPlatform();
        expect(["darwin", "win32", "linux"]).toContain(platform);
      });
    });

    describe("isMac", () => {
      it("should return a boolean", () => {
        const result = isMac();
        expect(typeof result).toBe("boolean");
      });

      it("should be true only on darwin platform", () => {
        const platform = getPlatform();
        const macCheck = isMac();

        if (platform === "darwin") {
          expect(macCheck).toBe(true);
        } else {
          expect(macCheck).toBe(false);
        }
      });
    });
  });
});
