"use client";

import * as React from "react";

/** Keeps client state in sync when server `initial` props change on navigation. */
export function useSyncedState<T>(initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = React.useState(initial);
  React.useEffect(() => {
    setState(initial);
  }, [initial]);
  return [state, setState];
}
