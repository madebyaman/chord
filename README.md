# Chord - Advanced Key Press Hook for React

A powerful and developer-friendly React hook for managing keyboard shortcuts with built-in conflict detection and a discoverable shortcut interface.

## What Makes Chord Different?

Unlike typical React key press hooks, Chord provides:

1. **Built-in Shortcut Discovery** - Press `?` (or any custom key) to view all available shortcuts in your application
2. **Conflict Detection** - Automatically detects and highlights conflicting key bindings
3. **Superior UX** - Visual feedback for key conflicts, making debugging and development easier
4. **Centralized Management** - Single source of truth for all keyboard shortcuts in your app

## Features

- **Shortcut Registry**: Automatically maintains a registry of all registered shortcuts
- **Conflict Detection**: Warns developers when multiple handlers are registered for the same key combination
- **Help Modal**: Built-in UI to display all available shortcuts (triggered by `?` by default)
- **TypeScript Support**: Full TypeScript support with type-safe key definitions
- **Customizable**: Configure help key and UI theme
- **Performance**: Efficient event handling with automatic cleanup
- **Conditional Activation**: Enable/disable shortcuts based on application state

## Installation

```bash
npm install chord-keys
# or
yarn add chord-keys
# or
pnpm add chord-keys
```

## Quick Start

```tsx
import { useKeyPress, KeyPressProvider } from 'chord-keys';

function App() {
  return (
    <KeyPressProvider>
      <YourApp />
    </KeyPressProvider>
  );
}

function YourComponent() {
  // Basic usage
  useKeyPress({
    key: 'cmd+k',
    description: 'Open command palette',
    onPress: () => console.log('Command palette opened'),
  });

  // With conflict detection
  useKeyPress({
    key: 'cmd+s',
    description: 'Save document',
    onPress: handleSave,
    category: 'Document',
  });

  return <div>Your content</div>;
}
```

## Usage Examples

### Viewing All Shortcuts

Press `?` (question mark) anywhere in your app to see all registered shortcuts. The modal will show:
- All available shortcuts grouped by category
- Key combinations in a readable format
- Descriptions for each shortcut
- **Conflicts highlighted in red**

### Detecting Conflicts

When multiple handlers are registered for the same key:

```tsx
// Component A
useKeyPress({
  key: 'cmd+k',
  description: 'Open search',
  onPress: openSearch,
});

// Component B (conflict!)
useKeyPress({
  key: 'cmd+k',
  description: 'Open command palette',
  onPress: openCommandPalette,
});
```

Chord will:
- Warn you in the console during development
- Highlight the conflict in the help modal (with component source if available)
- Execute only the first registered handler

### Conditional Enabling

```tsx
useKeyPress({
  key: 'cmd+shift+p',
  description: 'Toggle preview',
  category: 'View',
  onPress: togglePreview,
  enabled: isEditorFocused, // Only active when editor is focused
});
```

## API

### `<KeyPressProvider>`

Wrap your app with this provider to enable the key press system.

```tsx
<KeyPressProvider
  helpKey="?" // Key to open help modal (default: "?")
  theme="dark" // "light" or "dark" (default: "light")
>
  {children}
</KeyPressProvider>
```

### `useKeyPress(options)`

Register a keyboard shortcut handler.

**Options:**
- `key: string` - Key combination (e.g., "cmd+k", "ctrl+shift+s")
- `description: string` - Human-readable description
- `onPress: () => void` - Handler function
- `category?: string` - Group shortcuts by category in help modal
- `enabled?: boolean` - Conditionally enable/disable (default: true)
- `preventDefault?: boolean` - Prevent default browser behavior (default: true)

## Development

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build library
pnpm build

# Run tests
pnpm test

# Type check
pnpm type-check
```

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Acknowledgments

Built with React, TypeScript, and modern web APIs. Inspired by the need for better keyboard shortcut management in complex applications.
