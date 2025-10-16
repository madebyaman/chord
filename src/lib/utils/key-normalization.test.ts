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
import type { NormalizedKey, Platform } from "./types";

describe("normalizeShortcut", () => {
  it.each([
    ["k", "darwin", "k"],
    ["K", "darwin", "k"],
    ["1", "darwin", "1"],
    ["f12", "darwin", "f12"],
    ["/", "darwin", "/"],
    ["[", "darwin", "["],
    ["unknownkey", "darwin", "unknownkey"],
  ])("should normalize simple keys: %s -> %s", (input, platform, expected) => {
    expect(normalizeShortcut(input, platform as Platform)).toBe(expected);
  });

  it.each([
    ["mod+k", "darwin", "meta+k"],
    ["mod+k", "win32", "ctrl+k"],
    ["mod+k", "linux", "ctrl+k"],
    ["cmd+k", "darwin", "meta+k"],
    ["command+k", "darwin", "meta+k"],
    ["cmd+k", "win32", "ctrl+k"],
    ["cmd+k", "linux", "ctrl+k"],
    ["ctrl+k", "darwin", "ctrl+k"],
    ["control+k", "darwin", "ctrl+k"],
    ["alt+k", "darwin", "alt+k"],
    ["option+k", "darwin", "alt+k"],
    ["meta+k", "win32", "meta+k"],
  ])("should resolve modifiers: %s on %s -> %s", (input, platform, expected) => {
    expect(normalizeShortcut(input, platform as Platform)).toBe(expected);
  });

  it.each([
    ["k+shift+ctrl", "darwin", "ctrl+shift+k"],
    ["shift+mod+k", "darwin", "shift+meta+k"],
    ["k+meta+shift+alt+ctrl", "darwin", "ctrl+alt+shift+meta+k"],
    ["meta+shift+alt+ctrl+k", "darwin", "ctrl+alt+shift+meta+k"],
    ["shift+ctrl+k", "darwin", "ctrl+shift+k"],
  ])("should sort modifiers consistently: %s -> %s", (input, platform, expected) => {
    expect(normalizeShortcut(input, platform as Platform)).toBe(expected);
  });

  it.each([
    ["esc", "escape"],
    ["ESC", "escape"],
    ["escape", "escape"],
    ["return", "enter"],
    ["enter", "enter"],
    ["spacebar", "space"],
    ["space", "space"],
    ["up", "arrowup"],
    ["down", "arrowdown"],
    ["left", "arrowleft"],
    ["right", "arrowright"],
    ["arrowup", "arrowup"],
    ["del", "delete"],
    ["delete", "delete"],
    ["backspace", "backspace"],
    ["tab", "tab"],
    ["home", "home"],
    ["end", "end"],
    ["pageup", "pageup"],
    ["pagedown", "pagedown"],
  ])("should normalize special keys: %s -> %s", (input, expected) => {
    expect(normalizeShortcut(input, "darwin")).toBe(expected);
  });

  it.each([
    ["MOD+K", "darwin", "meta+k"],
    ["CTRL+SHIFT+K", "darwin", "ctrl+shift+k"],
    ["Cmd+S", "darwin", "meta+s"],
    [" mod + k ", "darwin", "meta+k"],
    ["  ctrl  +  shift  +  k  ", "darwin", "ctrl+shift+k"],
  ])("should handle case and whitespace: %s -> %s", (input, platform, expected) => {
    expect(normalizeShortcut(input, platform as Platform)).toBe(expected);
  });

  it.each([
    ["mod+ctrl+k", /cannot use 'mod' with 'ctrl'/i],
    ["mod+meta+k", /cannot use 'mod' with 'meta'/i],
    ["mod+cmd+k", /cannot use 'mod' with 'meta'/i],
    ["mod+shift", /no key specified/i],
    ["ctrl+alt", /no key specified/i],
    ["k+j", /multiple keys specified/i],
  ])("should throw validation error for: %s", (input, errorPattern) => {
    expect(() => normalizeShortcut(input, "darwin")).toThrow(errorPattern);
  });

  it("should produce platform-specific results for mod", () => {
    expect(normalizeShortcut("mod+s", "darwin")).toBe("meta+s");
    expect(normalizeShortcut("mod+s", "win32")).toBe("ctrl+s");
    expect(normalizeShortcut("mod+s", "linux")).toBe("ctrl+s");
  });

  it("should produce consistent results for explicit modifiers across platforms", () => {
    const shortcut = "ctrl+alt+k";
    expect(normalizeShortcut(shortcut, "darwin")).toBe("ctrl+alt+k");
    expect(normalizeShortcut(shortcut, "win32")).toBe("ctrl+alt+k");
    expect(normalizeShortcut(shortcut, "linux")).toBe("ctrl+alt+k");
  });
});

describe("normalizeEvent", () => {
  it.each([
    [{ key: "k" }, "k"],
    [{ key: "1" }, "1"],
    [{ key: "K", shiftKey: true }, "shift+k"],
    [{ key: "k", metaKey: true }, "meta+k"],
    [{ key: "k", ctrlKey: true }, "ctrl+k"],
    [{ key: "k", shiftKey: true }, "shift+k"],
    [{ key: "k", altKey: true }, "alt+k"],
    [{ key: "k", ctrlKey: true, shiftKey: true }, "ctrl+shift+k"],
    [
      { key: "k", ctrlKey: true, altKey: true, shiftKey: true, metaKey: true },
      "ctrl+alt+shift+meta+k",
    ],
  ])("should normalize event with modifiers: %o -> %s", (event, expected) => {
    expect(normalizeEvent(event as KeyboardEvent)).toBe(expected);
  });

  it.each([
    [{ key: "Escape" }, "escape"],
    [{ key: "Enter" }, "enter"],
    [{ key: " " }, "space"],
    [{ key: "ArrowUp" }, "arrowup"],
    [{ key: "ArrowDown" }, "arrowdown"],
    [{ key: "ArrowLeft" }, "arrowleft"],
    [{ key: "ArrowRight" }, "arrowright"],
    [{ key: "Tab" }, "tab"],
    [{ key: "Delete" }, "delete"],
    [{ key: "Backspace" }, "backspace"],
    [{ key: "Enter", ctrlKey: true }, "ctrl+enter"],
    [{ key: "Escape", metaKey: true }, "meta+escape"],
    [{ key: "ArrowUp", shiftKey: true }, "shift+arrowup"],
  ])("should normalize special key events: %o -> %s", (event, expected) => {
    expect(normalizeEvent(event as KeyboardEvent)).toBe(expected);
  });
});

describe("helper functions", () => {
  describe("normalizeKeyName", () => {
    it.each([
      ["Escape", "escape"],
      ["ESC", "escape"],
      [" ", "space"],
      ["ArrowUp", "arrowup"],
      ["K", "k"],
      ["A", "a"],
      ["unknownkey", "unknownkey"],
    ])("should normalize: %s -> %s", (input, expected) => {
      expect(normalizeKeyName(input)).toBe(expected);
    });
  });

  describe("serializeNormalizedKey", () => {
    it("should serialize all modifiers in correct order", () => {
      const normalized: NormalizedKey = {
        key: "k",
        ctrl: true,
        alt: true,
        shift: true,
        meta: true,
      };
      expect(serializeNormalizedKey(normalized)).toBe("ctrl+alt+shift+meta+k");
    });

    it("should serialize partial modifiers", () => {
      const normalized: NormalizedKey = {
        key: "k",
        ctrl: false,
        alt: false,
        shift: true,
        meta: true,
      };
      expect(serializeNormalizedKey(normalized)).toBe("shift+meta+k");
    });

    it("should serialize key without modifiers", () => {
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
    it.each([
      ["mod+s", ["mod", "s"]],
      ["ctrl+shift+k", ["ctrl", "shift", "k"]],
      [" mod + s ", ["mod", "s"]],
      ["  ctrl  +  k  ", ["ctrl", "k"]],
      ["MOD+S", ["mod", "s"]],
      ["CTRL+SHIFT+K", ["ctrl", "shift", "k"]],
    ])("should parse: %s -> %o", (input, expected) => {
      expect(parseShortcut(input)).toEqual(expected);
    });
  });

  describe("validateShortcut", () => {
    it("should pass valid shortcuts", () => {
      expect(() => validateShortcut(["mod", "s"])).not.toThrow();
      expect(() => validateShortcut(["ctrl", "shift", "k"])).not.toThrow();
    });

    it.each([
      [["mod", "ctrl", "k"], /cannot use 'mod' with 'ctrl'/i],
      [["mod", "meta", "k"], /cannot use 'mod' with 'meta'/i],
      [["mod", "shift"], /no key specified/i],
      [["k", "j"], /multiple keys specified/i],
    ])("should throw for invalid shortcut: %o", (parts, errorPattern) => {
      expect(() => validateShortcut(parts)).toThrow(errorPattern);
    });
  });

  describe("areShortcutsEqual", () => {
    it.each([
      ["mod+s", "cmd+s", "darwin", true],
      ["mod+s", "ctrl+s", "win32", true],
      ["shift+mod+k", "mod+shift+k", "darwin", true],
      ["MOD+S", "cmd+s", "darwin", true],
      ["mod+s", "mod+k", "darwin", false],
      ["ctrl+s", "alt+s", "darwin", false],
    ])("should compare: %s vs %s on %s -> %s", (shortcut1, shortcut2, platform, expected) => {
      expect(areShortcutsEqual(shortcut1, shortcut2, platform as Platform)).toBe(expected);
    });
  });
});

describe("platform detection", () => {
  it("should return a valid platform", () => {
    const platform = getPlatform();
    expect(["darwin", "win32", "linux"]).toContain(platform);
  });

  it("should detect Mac correctly", () => {
    const platform = getPlatform();
    const macCheck = isMac();
    expect(macCheck).toBe(platform === "darwin");
  });
});

describe("integration: shortcut registration and event matching", () => {
  it.each([
    ["mod+s", "darwin", { key: "s", metaKey: true }, "meta+s"],
    ["cmd+k", "darwin", { key: "k", metaKey: true }, "meta+k"],
    ["shift+mod+k", "darwin", { key: "k", metaKey: true, shiftKey: true }, "shift+meta+k"],
    ["ctrl+alt+k", "darwin", { key: "k", ctrlKey: true, altKey: true }, "ctrl+alt+k"],
    ["mod+s", "win32", { key: "s", ctrlKey: true }, "ctrl+s"],
    ["mod+shift+k", "win32", { key: "k", ctrlKey: true, shiftKey: true }, "ctrl+shift+k"],
  ])(
    "should match registration %s with event %o on %s",
    (shortcut, platform, event, expected) => {
      const registered = normalizeShortcut(shortcut, platform as Platform);
      const pressed = normalizeEvent(event as KeyboardEvent);
      expect(registered).toBe(pressed);
      expect(registered).toBe(expected);
    },
  );

  it("should detect conflicts between equivalent shortcuts", () => {
    expect(normalizeShortcut("mod+s", "darwin")).toBe(normalizeShortcut("cmd+s", "darwin"));
    expect(normalizeShortcut("shift+mod+k", "darwin")).toBe(
      normalizeShortcut("mod+shift+k", "darwin"),
    );
    expect(normalizeShortcut("MOD+S", "darwin")).toBe(normalizeShortcut("cmd+s", "darwin"));
  });
});

describe("function keys", () => {
  it.each([
    ["f1", "f1"],
    ["f2", "f2"],
    ["f3", "f3"],
    ["f4", "f4"],
    ["f5", "f5"],
    ["f6", "f6"],
    ["f7", "f7"],
    ["f8", "f8"],
    ["f9", "f9"],
    ["f10", "f10"],
    ["f11", "f11"],
    ["f12", "f12"],
    ["F1", "f1"],
    ["F12", "f12"],
  ])("should normalize function key: %s -> %s", (input, expected) => {
    expect(normalizeShortcut(input, "darwin")).toBe(expected);
  });

  it.each([
    ["shift+f1", "shift+f1"],
    ["ctrl+f5", "ctrl+f5"],
    ["mod+f12", "darwin", "meta+f12"],
    ["mod+f12", "win32", "ctrl+f12"],
  ])("should normalize function keys with modifiers: %s -> %s", (input, platform, expected) => {
    const plat = platform || "darwin";
    const exp = expected || input;
    expect(normalizeShortcut(input, plat as Platform)).toBe(exp);
  });
});

describe("symbol keys", () => {
  it.each([
    [",", ","],
    [".", "."],
    [";", ";"],
    ["'", "'"],
    ["[", "["],
    ["]", "]"],
    ["\\", "\\"],
    ["-", "-"],
    ["=", "="],
    ["`", "`"],
    ["/", "/"],
  ])("should normalize symbol key: %s -> %s", (input, expected) => {
    expect(normalizeShortcut(input, "darwin")).toBe(expected);
  });

  it.each([
    ["mod+/", "darwin", "meta+/"],
    ["ctrl+,", "darwin", "ctrl+,"],
    ["shift+.", "darwin", "shift+."],
  ])("should normalize symbols with modifiers: %s -> %s", (input, platform, expected) => {
    expect(normalizeShortcut(input, platform as Platform)).toBe(expected);
  });
});

describe("number keys", () => {
  it.each([
    ["0", "0"],
    ["1", "1"],
    ["2", "2"],
    ["3", "3"],
    ["4", "4"],
    ["5", "5"],
    ["6", "6"],
    ["7", "7"],
    ["8", "8"],
    ["9", "9"],
  ])("should normalize number key: %s -> %s", (input, expected) => {
    expect(normalizeShortcut(input, "darwin")).toBe(expected);
  });

  it.each([
    ["mod+1", "darwin", "meta+1"],
    ["ctrl+shift+5", "darwin", "ctrl+shift+5"],
  ])("should normalize numbers with modifiers: %s -> %s", (input, platform, expected) => {
    expect(normalizeShortcut(input, platform as Platform)).toBe(expected);
  });
});

describe("edge cases", () => {
  it("should handle empty string gracefully", () => {
    expect(() => normalizeShortcut("", "darwin")).toThrow();
  });

  it("should handle only modifiers (no key)", () => {
    expect(() => normalizeShortcut("mod+ctrl", "darwin")).toThrow(/no key specified/i);
    expect(() => normalizeShortcut("shift+alt", "darwin")).toThrow(/no key specified/i);
  });

  it("should handle multiple non-modifier keys", () => {
    expect(() => normalizeShortcut("k+j", "darwin")).toThrow(/multiple keys specified/i);
    expect(() => normalizeShortcut("a+b+c", "darwin")).toThrow(/multiple keys specified/i);
  });

  it("should handle duplicate modifiers", () => {
    // Should deduplicate or handle gracefully
    const result = normalizeShortcut("ctrl+ctrl+k", "darwin");
    expect(result).toBe("ctrl+k");
  });

  it("should normalize long whitespace", () => {
    expect(normalizeShortcut("   mod   +   s   ", "darwin")).toBe("meta+s");
  });

  it("should handle mixed case in complex shortcuts", () => {
    expect(normalizeShortcut("CTRL+SHIFT+ALT+K", "darwin")).toBe("ctrl+alt+shift+k");
  });

  it("should handle command alias consistently", () => {
    expect(normalizeShortcut("command+k", "darwin")).toBe("meta+k");
    expect(normalizeShortcut("cmd+k", "darwin")).toBe("meta+k");
    expect(normalizeShortcut("command+k", "win32")).toBe("ctrl+k");
  });

  it("should handle option alias consistently", () => {
    expect(normalizeShortcut("option+k", "darwin")).toBe("alt+k");
    expect(normalizeShortcut("opt+k", "darwin")).toBe("alt+k");
  });

  it("should handle control alias consistently", () => {
    expect(normalizeShortcut("control+k", "darwin")).toBe("ctrl+k");
    expect(normalizeShortcut("ctrl+k", "darwin")).toBe("ctrl+k");
  });
});

describe("normalizeEvent - additional cases", () => {
  it("should handle events with no modifiers", () => {
    const event = { key: "a" } as KeyboardEvent;
    expect(normalizeEvent(event)).toBe("a");
  });

  it("should ignore modifier keys pressed alone", () => {
    const events = [
      { key: "Control", ctrlKey: true },
      { key: "Shift", shiftKey: true },
      { key: "Alt", altKey: true },
      { key: "Meta", metaKey: true },
    ];

    events.forEach((event) => {
      const result = normalizeEvent(event as KeyboardEvent);
      // Should return the key name in lowercase
      expect(result.toLowerCase()).toContain(event.key.toLowerCase());
    });
  });

  it("should handle all four modifiers together", () => {
    const event = {
      key: "k",
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: true,
    } as KeyboardEvent;

    expect(normalizeEvent(event)).toBe("ctrl+alt+shift+meta+k");
  });

  it("should handle special characters with modifiers", () => {
    const event1 = {
      key: "/",
      ctrlKey: true,
    } as KeyboardEvent;
    expect(normalizeEvent(event1)).toBe("ctrl+/");

    const event2 = {
      key: "[",
      metaKey: true,
    } as KeyboardEvent;
    expect(normalizeEvent(event2)).toBe("meta+[");
  });
});
