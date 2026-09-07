import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  initialData,
  parseStoredData,
  STORAGE_KEY,
  type StoredData,
} from "@/lib/persistence";
type Store = {
  data: StoredData;
  ready: boolean;
  error: string | null;
  update: (fn: (s: StoredData) => StoredData) => Promise<void>;
  reset: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(initialData),
    [ready, setReady] = useState(false),
    [error, setError] = useState<string | null>(null);
  const current = useRef(initialData),
    queue = useRef<Promise<void>>(Promise.resolve()),
    writable = useRef(false);
  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!alive) return;
        const next = raw ? parseStoredData(raw) : initialData;
        current.current = next;
        setData(next);
        writable.current = true;
      })
      .catch((e) => {
        if (alive) setError(e.message || "Could not load saved data.");
      })
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);
  const update = (fn: (s: StoredData) => StoredData) => {
    const op = queue.current.then(async () => {
      if (!writable.current)
        throw new Error(
          "Saved data is unavailable. Existing data has not been overwritten.",
        );
      const next = fn(current.current);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      current.current = next;
      setData(next);
    });
    queue.current = op.catch(() => {});
    return op;
  };
  const reset = () => {
    const op = queue.current.then(async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      current.current = initialData;
      setData(initialData);
      setError(null);
      writable.current = true;
    });
    queue.current = op.catch(() => {});
    return op;
  };
  return (
    <Context.Provider value={{ data, ready, error, update, reset }}>
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("Store missing");
  return value;
}
