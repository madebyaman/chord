export function invariant(condition: unknown, message?: string): asserts condition {
  if (!condition) {
     const error = new Error(message || 'Invariant failed');
     // Remove this function from stack trace so it points to caller
     if (error.stack) {
       const lines = error.stack.split('\n');
       error.stack = [lines[0], ...lines.slice(2)].join('\n');
     }
     throw error;
   }
}
