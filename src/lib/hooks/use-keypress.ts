import { useEffect, useRef } from "react";
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
  // debugger;
  const { instance } = useKeyPressContext();

  useEffect(() => {
    const id = instance.registerHandler(config);
    return () => {
      instance.unregisterHandler(id);
    };
  }, [instance, config]);
}
