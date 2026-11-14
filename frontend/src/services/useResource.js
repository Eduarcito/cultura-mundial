import { useEffect, useState } from "react";
import { api } from "./api";
export function useResource(path) {
  const [state, setState] = useState({ data: null, loading: true, error: "" }),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: "" });
    api(path)
      .then((data) => {
        if (active) setState({ data, loading: false, error: "" });
      })
      .catch((e) => {
        if (active) setState({ data: null, loading: false, error: e.message });
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { ...state, reload: () => setVersion((v) => v + 1) };
}
