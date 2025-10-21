import { useEffect } from "react";
import type { KeyPressConfig } from "../types";
import { useKeyPressContext } from "../context/provider";

// export function useKeyPress(config: KeyPressConfig) {
//   const context = useKeyPressContext();
//   const callbackRef = useRef(config.onPress);

//   useEffect(() => {
//     callbackRef.current = config.onPress;
//   });

//   useEffect(() => {
//     const id = context.registerHandler({
//       ...config,
//       onPress: callbackRef.current,
//     });
//     return () => context.unregisterHandler(id);
//   }, [
//     context,
//     config.category,
//     config.description,
//     config.enabled,
//     config.key,
//     config.preventDefault,
//   ]);
// }
//

export function useKeyPress(config: KeyPressConfig) {
  const context = useKeyPressContext();

  useEffect(() => {
    const id = context.registerHandler(config);
    return () => context.unregisterHandler(id);
  }, [context, config]);
}
