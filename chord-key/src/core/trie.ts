import type { EventType } from "../types";

export class KeyNode {
  child: Map<string, KeyNode>;
  handlersByEventType: Map<"keydown" | "keyup" | "keypress", number>;

  constructor() {
    this.child = new Map();
    this.handlersByEventType = new Map();
  }
}

export class KeyTrie {
  root: KeyNode;

  constructor() {
    this.root = new KeyNode();
  }

  /**
   * Insert a handler sequence into the trie
   * @param sequence Array of normalized keys (e.g., ["ctrl+k", "b"])
   * @param handlerId The handler ID to store at the end of the sequence
   * @param eventType The event type (keydown, keyup, keypress)
   */
  insert(
    sequence: string[],
    handlerId: number,
    eventType: "keydown" | "keyup" | "keypress",
  ): void {
    let node = this.root;

    // Traverse/create path for the sequence
    for (const key of sequence) {
      if (!node.child.has(key)) {
        node.child.set(key, new KeyNode());
      }
      node = node.child.get(key)!;
    }

    // Add handler ID to this node for the event type
    if (!node.handlersByEventType.has(eventType)) {
      node.handlersByEventType.set(eventType, handlerId)
    } else {
      throw new Error("multiple handlers registered")
    }
  }

  /**
   * Search for a single key starting from a given node
   * @param key The key to search for
   * @param node The node to start from (default: root)
   * @returns The child node if found, null otherwise
   */
  search(key: string, node: KeyNode = this.root): KeyNode | null {
    return node.child.get(key) || null;
  }

  /**
   * Check if a node has children (i.e., sequences can continue from this node)
   * @param node The node to check
   * @returns True if node has children
   */
  hasChildren(node: KeyNode): boolean {
    return node.child.size > 0;
  }

  /**
   * Get all handler IDs registered at a node for a specific event type
   * @param node The node to get handlers from
   * @param eventType The event type to filter by
   * @returns Set of handler IDs, empty set if none
   */
  getHandlerIds(
    node: KeyNode,
    eventType: EventType,
  ): number | undefined {
    return node.handlersByEventType.get(eventType)
  }

  /**
   * Remove a handler from the trie
   * @param sequence The sequence to traverse
   * @param handlerId The handler ID to remove
   * @param eventType The event type
   */
  remove(
    sequence: string[],
    eventType: "keydown" | "keyup" | "keypress",
  ): void {
    let node = this.root;

    // Traverse to the target node
    for (const key of sequence) {
      const nextNode = node.child.get(key);
      if (!nextNode) return; // Sequence doesn't exist
      node = nextNode;
    }

    // Remove handler from the event type set
    node.handlersByEventType.delete(eventType);

    // Cleanup: mark as non-terminal if no handlers remain
    if (node.handlersByEventType.size === 0) {
      node.isEnd = false;
    }
  }
}
