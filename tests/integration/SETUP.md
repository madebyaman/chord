# Integration Test Setup Guide

## Overview

The integration tests for Chord use **Vitest Browser Mode** instead of jsdom, providing a real browser environment for testing keyboard shortcuts.

## Dependencies

### Required Packages

```bash
npm install --save-dev @vitest/browser playwright @testing-library/react @testing-library/user-event
```

### Package Details

- **@vitest/browser** - Vitest browser mode support
- **playwright** - Browser automation for running tests
- **@testing-library/react** - React component testing utilities
- **@testing-library/user-event** - Realistic user interaction simulation

## Configuration

The project is already configured in `vite.config.ts`:

```typescript
export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
  },
})
```

## Running Tests

```bash
# Run all integration tests
npm test tests/integration

# Run specific test file
npm test tests/integration/1-basic-functionality.test.tsx

# Run in headed mode (see browser)
npm test -- --browser.headless=false

# Run in different browser
npm test -- --browser.name=firefox
npm test -- --browser.name=webkit  # Safari

# Run in watch mode
npm test -- --watch
```

## API Changes

### Key Sequences

Key sequences are now registered with `useKeySequence` instead of `useKeyPress`:

**Old (incorrect):**
```tsx
useKeyPress({
  key: "g h",  // This won't work
  description: "Go to home",
  onPress: handler,
});
```

**New (correct):**
```tsx
useKeySequence({
  sequence: ["g", "h"],  // Array of keys
  description: "Go to home",
  onComplete: handler,    // Note: onComplete, not onPress
  timeout: 1000,          // Optional timeout in ms
});
```

### Hook APIs

#### `useKeyPress` - Single key shortcuts

```tsx
useKeyPress({
  key: string;              // e.g., "k", "mod+s", "ctrl+shift+k"
  description: string;      // Human-readable description
  onPress: () => void;      // Handler function
  category?: string;        // Optional category for help modal
  scope?: string;           // Optional scope for priority
  component?: string;       // Optional component name for debugging
  enabled?: boolean;        // Conditional enabling (default: true)
  preventDefault?: boolean; // Prevent default browser behavior
});
```

#### `useKeySequence` - Key sequences

```tsx
useKeySequence({
  sequence: string[];       // Array of keys, e.g., ["g", "h"]
  description: string;      // Human-readable description
  onComplete: () => void;   // Handler when sequence completes
  category?: string;        // Optional category for help modal
  scope?: string;           // Optional scope
  timeout?: number;         // Timeout in ms (default: 1000)
  enabled?: boolean;        // Conditional enabling (default: true)
});
```

## Browser Compatibility

Vitest Browser Mode supports:
- Chrome/Chromium ≥87
- Firefox ≥78
- Safari/WebKit ≥15.4
- Edge ≥88

All browsers must support native ES Modules.

## Advantages of Browser Mode

1. **Real Browser Environment**: Tests run in actual browsers, not simulations
2. **Accurate Keyboard Events**: True browser keyboard event handling
3. **Platform Testing**: Can test on different browsers and platforms
4. **No Mock Overhead**: Real DOM, real events, real behavior
5. **Better Debugging**: Can see actual browser UI in headed mode

## CI/CD Configuration

For CI environments, the tests will run in headless mode automatically. Make sure Playwright browsers are installed:

```bash
# Install Playwright browsers
npx playwright install --with-deps chromium
```

### GitHub Actions Example

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium

- name: Run tests
  run: npm test
```

## Troubleshooting

### Tests hanging or timing out

If tests hang, check:
1. Playwright browsers are installed
2. Browser mode is enabled in vite.config.ts
3. No infinite loops in component code

### Keyboard events not working

Ensure you're using `@testing-library/user-event`:
```tsx
const user = userEvent.setup();
await user.keyboard("k");  // ✅ Correct
```

Not:
```tsx
fireEvent.keyDown(element, { key: "k" });  // ❌ Don't use
```

### Help modal not found

The help modal components need to be implemented. These tests are written in TDD style and will fail until the features are built.

## Next Steps

After installing dependencies, run the tests to see which features need implementation:

```bash
npm install --save-dev @vitest/browser playwright @testing-library/react @testing-library/user-event
npm test tests/integration
```

Expected failures indicate features that need to be built.
