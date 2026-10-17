import { useEffect, useState } from "react";
import { api } from "@/api/client";
export function useResource<T>(path: string | null, refreshInterval = 0) {
  const [state, setState] = useState<{
    path: string | null;
    data: T | null;
    loading: boolean;
    error: string;
  }>({ path, data: null, loading: Boolean(path), error: "" });
  const [version, setVersion] = useState(0);
  useEffect(() => {
    if (!path || !refreshInterval) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setVersion(value => value + 1);
    }, refreshInterval);
    return () => window.clearInterval(timer);
  }, [path, refreshInterval]);
  useEffect(() => {
    if (!path) {
      setState({ path, data: null, loading: false, error: "" });
      return;
    }
    const controller = new AbortController();
    setState(previous => ({ path, data: previous.path === path ? previous.data : null, loading: previous.path !== path || !previous.data, error: "" }));
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ path, data, loading: false, error: "" });
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ path, data: null, loading: false, error: error.message });
      });
    return () => controller.abort();
  }, [path, version]);
  const current =
    state.path === path
      ? state
      : { data: null, loading: Boolean(path), error: "" };
  return { ...current, reload: () => setVersion((value) => value + 1) };
}
