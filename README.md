# Chord - Advanced Keyboard Shortcuts for React

A powerful and developer-friendly React library for managing keyboard shortcuts with built-in conflict detection and a discoverable shortcut interface.

## Monorepo Structure

This is a Turborepo monorepo containing:

- **chord-keys** - The core keyboard shortcuts library (Vite + Tailwind CSS v4)
- **website** - Documentation and demo website (Next.js 16 + Tailwind CSS v4)

## What Makes Chord Different?

Unlike typical React key press hooks, Chord provides:

1. **Built-in Shortcut Discovery** - Press `?` (or any custom key) to view all available shortcuts in your application
2. **Conflict Detection** - Automatically detects and highlights conflicting key bindings
3. **Superior UX** - Visual feedback for key conflicts, making debugging and development easier
4. **Centralized Management** - Single source of truth for all keyboard shortcuts in your app

## Getting Started

### Installation

```bash
npm install chord-keys
# or
yarn add chord-keys
# or
pnpm add chord-keys
```

### Quick Start

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

  return <div>Your content</div>;
}
```

## Development

This monorepo uses [Turborepo](https://turbo.build/repo) and npm workspaces.

### Setup

```bash
# Install dependencies
npm install

# Run development servers for all packages
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Lint all packages
npm run lint
```

### Working with Individual Packages

```bash
# Work on the library
cd chord-keys
npm run dev

# Work on the website
cd website
npm run dev
```

## Features

- **Shortcut Registry**: Automatically maintains a registry of all registered shortcuts
- **Conflict Detection**: Warns developers when multiple handlers are registered for the same key combination
- **Help Modal**: Built-in UI to display all available shortcuts (triggered by `?` by default)
- **TypeScript Support**: Full TypeScript support with type-safe key definitions
- **Customizable**: Configure help key and UI theme
- **Performance**: Efficient event handling with automatic cleanup
- **Conditional Activation**: Enable/disable shortcuts based on application state

## API Documentation

See the [website](./website) for full API documentation and examples.

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## License

MIT

## Acknowledgments

Built with React, TypeScript, Vite, Next.js, and Tailwind CSS. Inspired by the need for better keyboard shortcut management in complex applications.
