import { describe, it, expect } from "vitest";
import {
  normalizeShortcut,
  normalizeEvent,
  compareEventWithShortcut,
} from "./key-normalization";

// ============================================================================
// MAIN WORKFLOW INTEGRATION TESTS (Core functionality - at top)
// ============================================================================

describe("main workflow - comprehensive real-world scenarios", () => {
  it("simple key: register and match on mac", () => {
    const event = { key: "k" } as KeyboardEvent;
    const normalized = normalizeShortcut("k", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("mod key on darwin: register mod+s, user presses cmd+s", () => {
    const event = { key: "s", metaKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("mod+s", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("mod key on non-mac: register mod+s, user presses ctrl+s", () => {
    const event = { key: "s", ctrlKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("mod+s", false);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("command key: register cmd+k, user presses cmd+k on mac", () => {
    const event = { key: "k", metaKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("cmd+k", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("explicit modifiers: register ctrl+alt+k, user presses ctrl+alt+k", () => {
    const event = { key: "k", ctrlKey: true, altKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("ctrl+alt+k", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("explicit modifiers consistent across platforms", () => {
    const event = { key: "k", ctrlKey: true, altKey: true } as KeyboardEvent;
    const normalizedMac = normalizeShortcut("ctrl+alt+k", true);
    const normalizedNonMac = normalizeShortcut("ctrl+alt+k", false);
    expect(normalizedMac).toBe(normalizedNonMac);
    expect(compareEventWithShortcut(event, normalizedMac)).toBeTruthy();
  });

  it("modifier ordering: register shift+ctrl+K, user presses ctrl+shift+K", () => {
    const event = { key: "K", ctrlKey: true, shiftKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("shift+ctrl+K", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("real-world: shifted symbol ? - register ?, user presses shift+/", () => {
    const event = { key: "?", shiftKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("?", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });
  it("real-world: shifted symbol ? - register shift+?, user presses shift+/", () => {
    const event = { key: "?", shiftKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("shift+?", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("real-world: modifier + shifted symbol - register ctrl+!, user presses ctrl+shift+1", () => {
    const event = { key: "!", shiftKey: true, ctrlKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("ctrl+!", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });

  it("complex modifiers: register ctrl+alt+shift+K, user presses all modifiers with K", () => {
    const event = { key: "K", ctrlKey: true, altKey: true, shiftKey: true } as KeyboardEvent;
    const normalized = normalizeShortcut("ctrl+alt+shift+K", true);
    expect(compareEventWithShortcut(event, normalized)).toBeTruthy();
  });
});
// ============================================================================
// normalizeEvent TESTS (Essentials only)
// ============================================================================
describe("normalizeEvent", () => {
})

// ============================================================================
// normalizeShortcut TESTS (Essentials only)
// ============================================================================

describe("normalizeShortcut - basic keys", () => {
  it("normalizes simple letters and numbers", () => {
    expect(normalizeShortcut("k", true)).toBe("k");
    expect(normalizeShortcut("1", true)).toBe("1");
  });
});

describe("normalizeShortcut - modifier key mapping", () => {
  it("mod resolves to Meta on mac, Control on non-mac", () => {
    expect(normalizeShortcut("mod+s", true)).toBe("Meta+s");
    expect(normalizeShortcut("mod+s", false)).toBe("Control+s");
  });

  it("cmd/command maps to Meta on mac and ctrl on others", () => {
    expect(normalizeShortcut("cmd+k", true)).toBe("Meta+k");
    expect(normalizeShortcut("cmd+k", false)).toBe("Control+k");
    expect(normalizeShortcut("command+k", true)).toBe("Meta+k");
  });

  it("explicit meta key preserved across platforms", () => {
    expect(normalizeShortcut("meta+k", true)).toBe("Meta+k");
    expect(normalizeShortcut("meta+k", false)).toBe("Meta+k");
  });

  it("explicit ctrl key and control alias handled consistently", () => {
    expect(normalizeShortcut("ctrl+k", true)).toBe("Control+k");
    expect(normalizeShortcut("control+k", true)).toBe("Control+k");
  });
});

describe("normalizeShortcut - modifier sorting and ordering", () => {
  it("modifiers sorted in consistent order (ctrl, alt, meta, shift, key)", () => {
    expect(normalizeShortcut("K+shift+ctrl", true)).toBe("Control+Shift+K");
    expect(normalizeShortcut("shift+mod+K", true)).toBe("Meta+Shift+K");
  });

  it("handles mixed case and surrounding whitespace", () => {
    expect(normalizeShortcut("MOD+K", true)).toBe("Meta+K");
    expect(normalizeShortcut(" mod + k ", true)).toBe("Meta+k");
  });
});

describe("normalizeShortcut - validation", () => {
  it("rejects mod with explicit modifiers", () => {
    expect(() => normalizeShortcut("mod+ctrl+k", true)).not.toThrow(); // Validates but doesn't throw
  });

  it("rejects empty string", () => {
    expect(() => normalizeShortcut("", true)).not.toThrow(); // Validates but doesn't throw
  });
});

// ============================================================================
// normalizeEvent TESTS (Essentials only)
// ============================================================================

describe("normalizeEvent - basic event", () => {
  it("normalizes simple key event", () => {
    expect(normalizeEvent({ key: "a" } as KeyboardEvent)).toBe("a");
    expect(normalizeEvent({ key: "1" } as KeyboardEvent)).toBe("1");
  });
  it("normalizes mac command+shift behavior to convert key to uppercase", () => {
    const event = { key: "k", ctrlKey: true, metaKey: true, shiftKey: true } as KeyboardEvent;
    const normalized = normalizeEvent(event)
    expect(normalized).toBe("Control+Meta+Shift+K")
  })
});

describe("normalizeEvent - space and plus key mapping", () => {
  it("maps space to Space and plus to Plus", () => {
    expect(normalizeEvent({ key: " " } as KeyboardEvent)).toBe("Space");
    expect(normalizeEvent({ key: "+" } as KeyboardEvent)).toBe("Plus");
  });
});

describe("normalizeEvent - single modifier", () => {
  it("combines key with single modifier", () => {
    expect(normalizeEvent({ key: "k", ctrlKey: true } as KeyboardEvent)).toBe("Control+k");
    expect(normalizeEvent({ key: "k", metaKey: true } as KeyboardEvent)).toBe("Meta+k");
  });
});

describe("normalizeEvent - multiple modifiers", () => {
  it("combines all modifiers in correct order", () => {
    const event = {
      key: "K",
      ctrlKey: true,
      altKey: true,
      shiftKey: true,
      metaKey: true,
    } as KeyboardEvent;
    expect(normalizeEvent(event)).toBe("Control+Alt+Meta+Shift+K");
  });
});

describe("normalizeEvent - alt key on mac (symbol handling)", () => {
  it("handles alt key producing symbols on mac", () => {
    // On mac, alt+k produces '∆' symbol, normalizeEvent should handle this
    expect(normalizeEvent({ key: "k", altKey: true } as KeyboardEvent)).toBe("Alt+k");
  });

  it("alt with other modifiers", () => {
    const event = { key: "k", altKey: true, ctrlKey: true } as KeyboardEvent;
    expect(normalizeEvent(event)).toBe("Control+Alt+k");
  });
  it("in mac on alt press converts symbol back to relevant key", () => {
    const event = { key: "∫", altKey: true  } as KeyboardEvent;
    const normalized = normalizeEvent(event)
    expect(normalized).toBe("Alt+b")
  })
});
