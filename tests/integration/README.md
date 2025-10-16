# Integration Tests for Chord

## Overview

This directory contains comprehensive integration tests for the Chord keyboard shortcut library. The tests are organized into 4 main categories, each testing critical functionality of the system.

## Test Categories

### 1. Basic Functionality (`1-basic-functionality.test.tsx`)

Tests the core features of the library:

- **Provider Initialization**
  - Rendering without errors
  - Custom help key configuration
  - showConflicts prop handling
  - Error handling when used outside provider

- **Single Shortcut Registration**
  - Simple key shortcuts (e.g., `k`)
  - Modifier + key shortcuts (e.g., `mod+s`)
  - Multiple modifiers (e.g., `ctrl+shift+k`)
  - preventDefault option

- **Conditional Enabling**
  - Shortcuts only trigger when enabled
  - Dynamic enable/disable

- **Scoped Shortcuts**
  - Registering shortcuts with different scopes
  - Scope-based execution

- **Category Organization**
  - Organizing shortcuts into categories
  - Multiple categories

- **Key Sequences**
  - Two-key sequences (e.g., `g h`)
  - Three-key sequences (e.g., `g p r`)
  - Sequence timeouts
  - Out-of-order key detection
  - Sequences with modifiers (e.g., `mod+k mod+b`)

- **Help Modal**
  - Opening with help key
  - Displaying registered shortcuts
  - Closing with escape
  - Closing with backdrop click

- **Dynamic Updates**
  - Updating handlers on re-render
  - Reactive behavior

### 2. Conflict Detection (`2-conflict-detection.test.tsx`)

Tests the conflict detection and resolution system:

- **Duplicate Key Detection**
  - Same key registered by multiple components
  - Normalized shortcut conflicts (e.g., `mod+s` vs `cmd+s`)
  - Different modifier order conflicts (e.g., `shift+ctrl+k` vs `ctrl+shift+k`)
  - No false positives for different keys

- **Console Warning Details**
  - Component names in warnings
  - Key bindings in warnings
  - Descriptions in warnings

- **Conflict Resolution Strategies**
  - Warn mode (default): executes all handlers
  - First wins: only first handler executes
  - Last wins: only last handler executes
  - Error mode: throws error

- **Help Modal Conflict Display**
  - Visual conflict indicators
  - Red highlighting for conflicts
  - Conflict grouping
  - Conflict count in header
  - Respecting showConflicts prop

- **Scope-based Conflicts**
  - Detecting conflicts across scopes
  - Scope priority resolution

- **Key Sequence Conflicts**
  - Detecting duplicate sequences

- **Multiple Conflicts**
  - Handling multiple different conflicts

### 3. Cleanup (`3-cleanup.test.tsx`)

Tests proper cleanup and unmounting behavior:

- **Handler Cleanup on Unmount**
  - Single handler removal
  - Multiple handlers removal
  - Preserving other handlers when one unmounts

- **Help Modal Updates**
  - Removing unmounted shortcuts from modal
  - Updating shortcut count
  - Removing conflicts when conflicting component unmounts

- **Sequence Cleanup**
  - Clearing sequence state on unmount
  - No partial sequences after unmount

- **Dynamic Component Lifecycle**
  - Rapid mount/unmount cycles
  - Conditional rendering of multiple components

- **Memory Leak Prevention**
  - No references to unmounted components
  - Event listener cleanup on provider unmount

- **Enabled/Disabled Cleanup**
  - Disabled shortcuts don't execute
  - Disabled shortcuts removed from help modal

### 4. Platform Compatibility (`4-platform-compatibility.test.tsx`)

Tests cross-platform keyboard shortcut normalization:

- **mod Key Resolution**
  - macOS: `mod` → `meta` (Command key)
  - Windows: `mod` → `ctrl`
  - Linux: `mod` → `ctrl`

- **cmd Key Resolution**
  - macOS: `cmd` → `meta`
  - Windows: `cmd` → `ctrl`
  - Linux: `cmd` → `ctrl`

- **Explicit ctrl Key**
  - Preserved as `ctrl` on all platforms

- **Explicit meta Key**
  - Preserved as `meta` on all platforms

- **Cross-Platform Shortcuts**
  - Same definition works across platforms
  - Complex multi-modifier shortcuts

- **Special Keys**
  - Consistent behavior for special keys (escape, enter, space, arrows)
  - Function keys (F1-F12)

- **Auto Platform Detection**
  - Detecting platform when not specified

- **Help Modal Platform Display**
  - Platform-specific shortcut display
  - Platform-specific symbols (⌘, Ctrl, etc.)

- **Edge Cases**
  - Runtime platform switching
  - Normalization consistency
  - Modifier combinations

## Setup

### Required Dependencies

These tests use **Vitest Browser Mode** for real browser testing:

```bash
npm install --save-dev @vitest/browser playwright @testing-library/react @testing-library/user-event
```

For detailed setup instructions, see [SETUP.md](./SETUP.md).

### Running the Tests

```bash
# Run all integration tests
npm test tests/integration

# Run a specific test file
npm test tests/integration/1-basic-functionality.test.tsx

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run in headed mode (see browser UI)
npm test -- --browser.headless=false
```

## Test-Driven Development Approach

These tests were written **before** full implementation, following TDD principles:

1. **Red**: Tests will fail initially because features aren't implemented
2. **Green**: Implement features to make tests pass
3. **Refactor**: Improve code while keeping tests green

## Expected Failures

When first running these tests, expect failures in these areas:

- ✗ Help modal components and UI
- ✗ Conflict detection and warning system
- ✗ Key sequence handling
- ✗ Scope-based priority resolution
- ✗ Platform-specific symbol display
- ✗ Some cleanup edge cases

## Testing Patterns Used

### User Event Simulation

```tsx
await user.keyboard("k"); // Single key
await user.keyboard("{Meta>}s{/Meta}"); // With modifiers
await user.keyboard("{Control>}{Shift>}k{/Shift}{/Control}"); // Multiple modifiers
```

### Spy/Mock Functions

```tsx
const handler = vi.fn();
// ... trigger handler
expect(handler).toHaveBeenCalledTimes(1);
```

### Platform Mocking

```tsx
Object.defineProperty(navigator, "platform", {
  value: "MacIntel", // or "Win32", "Linux x86_64"
  writable: true,
});
```

### Console Warning Detection

```tsx
const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
// ... trigger warning
expect(consoleWarnSpy).toHaveBeenCalled();
```

## Contributing

When adding new features:

1. Write integration tests first
2. Ensure tests fail for the right reasons
3. Implement the feature
4. Ensure all tests pass
5. Add edge case tests

## Notes

- Tests use Vitest as the test runner
- React Testing Library for component testing
- User Event for realistic keyboard interaction simulation
- All tests are isolated and can run independently
- Tests clean up after themselves to prevent side effects
