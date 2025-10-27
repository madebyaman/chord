"use client";

import { ShortcutsDialog, useKeyPress, useKeySequence } from "chord-key";
import { FloatingHelpButton } from "./components/FloatingHelpButton";
import { useState } from "react";

export default function Home() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Navigation shortcuts
  useKeySequence({
    sequence: ["g", "h"],
    description: "Go to home (top of page)",
    category: "Navigation",
    onComplete: () => {
      document.getElementById("home")?.scrollIntoView({ behavior: "smooth" });
    },
  });

  useKeySequence({
    sequence: ["g", "d"],
    description: "Go to API documentation",
    category: "Navigation",
    onComplete: () => {
      document.getElementById("api")?.scrollIntoView({ behavior: "smooth" });
    },
  });

  useKeySequence({
    sequence: ["g", "r"],
    description: "Go to GitHub repository",
    category: "Navigation",
    onComplete: () => {
      window.open("https://github.com/madebyaman/chord", "_blank");
    },
  });

  // Utility shortcuts
  useKeyPress({
    key: "cmd+/",
    description: "Toggle dark mode",
    category: "Utility",
    onPress: () => {
      const html = document.documentElement;
      html.classList.toggle("dark");
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(Math.random());
  };

  const CodeBlock = ({
    code,
    language = "tsx",
  }: {
    code: string;
    language?: string;
  }) => (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto">
        <code className="text-sm">{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code)}
        className="absolute top-2 right-2 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
        title="Copy code"
      >
        Copy
      </button>
    </div>
  );

  return (
    <>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="max-w-3xl mx-auto px-6 py-12">
          {/* Header */}
          <header id="home" className="mb-12 scroll-mt-20">
            <h1 className="text-5xl font-bold mb-4 text-gray-70">chord-key</h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-4">
              A keyboard shortcuts library for React with built-in conflict
              detection and discoverable shortcuts.
            </p>
            <div className="flex gap-2 text-sm text-slate-600 dark:text-slate-400">
              <span>
                💡 Press{" "}
                <kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  ?
                </kbd>{" "}
                to see all shortcuts
              </span>
            </div>
          </header>

          {/* Main Content - Prose Styled */}
          <article className="prose-docs">
            {/* What is chord-key */}
            <section className="mb-12">
              <h2>What is chord-key?</h2>
              <p>
                chord-key makes keyboard shortcuts in React apps easy to manage.
                Unlike typical key press hooks, chord-key provides:
              </p>
              <ul>
                <li>
                  <strong>Discoverable shortcuts</strong> - Press <code>?</code>{" "}
                  to see all available shortcuts
                </li>
                <li>
                  <strong>Conflict detection</strong> - Warns you when multiple
                  handlers use the same key
                </li>
                <li>
                  <strong>Centralized management</strong> - Single source of
                  truth for all shortcuts
                </li>
                <li>
                  <strong>Cross-platform</strong> - Handles Mac (cmd), Windows
                  (ctrl), and Linux keyboards
                </li>
                <li>
                  <strong>TypeScript support</strong> - Fully typed API
                </li>
              </ul>
            </section>

            {/* Installation */}
            <section className="mb-12">
              <h2>Installation</h2>
              <CodeBlock
                code={`npm install chord-key
# or
yarn add chord-key
# or
pnpm add chord-key`}
              />
            </section>

            {/* Quick Start */}
            <section className="mb-12">
              <h2>Quick Start</h2>
              <p>Wrap your app with the provider and use the hooks:</p>
              <CodeBlock
                code={`import { KeyPressProvider, useKeyPress } from 'chord-key';

function App() {
  return (
    <KeyPressProvider>
      <YourApp />
    </KeyPressProvider>
  );
}

function YourComponent() {
  useKeyPress({
    key: 'cmd+k',
    description: 'open command palette',
    onPress: () => console.log('opened'),
  });

  return <div>your content</div>;
}`}
              />
            </section>

            {/* API Documentation */}
            <section id="api" className="mb-12 scroll-mt-20">
              <h2>API Reference</h2>

              {/* useKeyPress */}
              <h3>useKeyPress</h3>
              <p>Handle single keys or key combinations.</p>
              <CodeBlock
                code={`import { useKeyPress } from 'chord-key';

function Editor() {
  useKeyPress({
    key: 'cmd+s',
    description: 'save document',
    category: 'editor',
    onPress: () => saveDocument(),
  });

  useKeyPress({
    key: 'cmd+shift+p',
    description: 'open command palette',
    onPress: () => openPalette(),
  });

  return <div>...</div>;
}`}
              />
              <h3 className="mt-6">Options</h3>
              <CodeBlock
                code={`interface KeyPressConfig {
  key: string;                    // e.g. "cmd+k", "ctrl+shift+s"
  description: string;            // shown in help modal
  onPress: () => void;            // callback when pressed
  category?: string;              // group in help modal
  enabled?: boolean;              // conditionally enable/disable
  preventDefault?: boolean;       // prevent browser defaults
  eventType?: 'keydown' | 'keyup' | 'keypress';
}`}
              />

              {/* useKeySequence */}
              <h3 className="mt-8">useKeySequence</h3>
              <p>
                Handle key sequences like Vim (press <code>g</code> then{" "}
                <code>h</code>).
              </p>
              <CodeBlock
                code={`import { useKeySequence } from 'chord-key';

function Navigation() {
  useKeySequence({
    sequence: ['g', 'h'],
    description: 'go to home',
    category: 'navigation',
    onComplete: () => navigate('/'),
  });

  useKeySequence({
    sequence: ['g', 'i'],
    description: 'go to inbox',
    onComplete: () => navigate('/inbox'),
  });

  return <div>...</div>;
}`}
              />
              <h3 className="mt-6">Options</h3>
              <CodeBlock
                code={`interface KeySequenceConfig {
  sequence: string[];             // e.g. ["g", "h"]
  description: string;            // shown in help modal
  onComplete: () => void;         // callback when sequence completes
  category?: string;              // group in help modal
  enabled?: boolean;              // conditionally enable/disable
  timeout?: number;               // ms between keys (default: 1000)
  eventType?: 'keydown' | 'keyup' | 'keypress';
}`}
              />

              {/* useKeyboardShortcuts */}
              <h3 className="mt-8">useKeyboardShortcuts</h3>
              <p>
                Get all registered shortcuts, grouped by category. Useful for
                building custom shortcut displays.
              </p>
              <CodeBlock
                code={`import { useKeyboardShortcuts } from 'chord-key';

function CustomShortcutsList() {
  const { handlers, groupedHandlers } = useKeyboardShortcuts();

  return (
    <div>
      {groupedHandlers.map(([category, shortcuts]) => (
        <div key={category}>
          <h3>{category}</h3>
          <ul>
            {shortcuts.map((shortcut, i) => (
              <li key={i}>
                <kbd>{shortcut.keySequence.join(' ')}</kbd>
                <span>{shortcut.description}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}`}
              />
              <h3 className="mt-6">Returns</h3>
              <CodeBlock
                code={`{
  handlers: HandlerInfo[];           // all registered shortcuts
  groupedHandlers: [string, HandlerInfo[]][];  // grouped by category
}

interface HandlerInfo {
  keySequence: string[];    // e.g. ["cmd+s"] or ["g", "h"]
  description: string;
  category: string;
  component: string;
}`}
              />

              {/* ShortcutsDialog */}
              <h3 className="mt-8">ShortcutsDialog</h3>
              <p>
                Built-in modal to display all shortcuts. Press <code>?</code> by
                default to open.
              </p>
              <CodeBlock
                code={`import { ShortcutsDialog } from 'chord-key';

function App() {
  return (
    <KeyPressProvider>
      <YourApp />
      <ShortcutsDialog helpKey="?" />
    </KeyPressProvider>
  );
}`}
              />
              <h3 className="mt-6">Options</h3>
              <CodeBlock
                code={`interface ShortcutsDialogProps {
  helpKey?: string;  // key to open modal (default: "?")
}`}
              />

              {/* KeyPressProvider */}
              <h3 className="mt-8">KeyPressProvider</h3>
              <p>
                Context provider for managing shortcuts globally. Wrap your app
                with this to enable keyboard shortcuts.
              </p>
              <CodeBlock
                code={`import { KeyPressProvider } from 'chord-key';

function App() {
  return (
    <KeyPressProvider>
      <YourApp />
    </KeyPressProvider>
  );
}`}
              />
            </section>

            {/* Examples */}
            <section className="mb-12">
              <h2>Examples</h2>

              <h3>Organizing with categories</h3>
              <p>Categories group shortcuts in the help modal:</p>
              <CodeBlock
                code={`function App() {
  useKeyPress({
    key: 'cmd+n',
    description: 'new file',
    category: 'file',
    onPress: () => createFile(),
  });

  useKeyPress({
    key: 'cmd+o',
    description: 'open file',
    category: 'file',
    onPress: () => openFile(),
  });

  useKeyPress({
    key: 'cmd+f',
    description: 'find',
    category: 'search',
    onPress: () => openSearch(),
  });

  return <div>...</div>;
}`}
              />

              <h3 className="mt-8">Conditional shortcuts</h3>
              <p>Enable/disable shortcuts based on state:</p>
              <CodeBlock
                code={`function Editor() {
  const [isEditing, setIsEditing] = useState(false);

  useKeyPress({
    key: 'cmd+s',
    description: 'save',
    enabled: isEditing,
    onPress: () => save(),
  });

  useKeyPress({
    key: 'escape',
    description: 'cancel editing',
    enabled: isEditing,
    onPress: () => setIsEditing(false),
  });

  return <div>...</div>;
}`}
              />

              <h3 className="mt-8">Complex sequences</h3>
              <CodeBlock
                code={`function VimMode() {
  useKeySequence({
    sequence: ['g', 'g'],
    description: 'go to top',
    category: 'navigation',
    onComplete: () => scrollToTop(),
  });

  useKeySequence({
    sequence: ['shift+g'],
    description: 'go to bottom',
    category: 'navigation',
    onComplete: () => scrollToBottom(),
  });

  return <div>...</div>;
}`}
              />
            </section>

            {/* Roadmap */}
            <section className="mb-12">
              <h2>Roadmap</h2>
              <ul>
                <li>
                  <strong>Compile-time conflict detection</strong> - TypeScript
                  plugin to catch conflicting shortcuts at build time
                </li>
                <li>
                  <strong>Category autocomplete</strong> - TypeScript
                  autocomplete for category names to keep them consistent
                </li>
                <li>
                  <strong>Community contributions welcome</strong> - Open to
                  suggestions and improvements
                </li>
              </ul>
            </section>

            {/* Contributing */}
            <section className="mb-12">
              <h2>Contributing</h2>
              <p>
                Contributions are welcome! Please open an issue or submit a pull
                request at{" "}
                <a
                  href="https://github.com/madebyaman/chord"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/madebyaman/chord
                </a>
                .
              </p>
            </section>

            {/* License */}
            <section className="mb-12">
              <h2>License</h2>
              <p>
                MIT - see{" "}
                <a
                  href="https://github.com/madebyaman/chord/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  LICENSE
                </a>{" "}
                for details.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                <strong>Author:</strong>{" "}
                <a href="https://github.com/madebyaman">madebyaman</a>
              </p>
            </section>
          </article>

          {/* Keyboard shortcuts legend */}
          <section className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-semibold mb-4">
              Keyboard Shortcuts on This Page
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  g
                </kbd>
                <span className="ml-2">+ h</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Go to home
                </p>
              </div>
              <div>
                <kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  g
                </kbd>
                <span className="ml-2">+ d</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Go to API docs
                </p>
              </div>
              <div>
                <kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  g
                </kbd>
                <span className="ml-2">+ r</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Go to GitHub repo
                </p>
              </div>
              <div>
                <kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  ?
                </kbd>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Show shortcuts help
                </p>
              </div>
              <div>
                <kbd className="bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                  cmd
                </kbd>
                <span className="ml-2">+ /</span>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  Toggle dark mode
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Floating help button */}

      {/* Shortcuts Dialog */}
      <ShortcutsDialog theme="dark" helpKey="?" />
    </>
  );
}
