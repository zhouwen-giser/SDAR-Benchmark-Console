"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export class QueryClient {
  constructor(_options?: unknown) {}
}

export function QueryClientProvider({ children }: { client: QueryClient; children: ReactNode }) {
  return <>{children}</>;
}

type QueryOptions<T> = {
  queryKey: readonly unknown[];
  queryFn: () => Promise<T> | T;
  enabled?: boolean;
  retry?: boolean | number;
};

type QueryResult<T> = {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<{ data?: T; error?: Error }>;
};

export function useQuery<T>(options: QueryOptions<T>): QueryResult<T> {
  const { enabled = true } = options;
  const key = JSON.stringify(options.queryKey);
  const queryFnRef = useRef(options.queryFn);
  queryFnRef.current = options.queryFn;
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setLoading] = useState(enabled);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await queryFnRef.current();
      setData(result);
      setLoading(false);
      return { data: result };
    } catch (reason) {
      const nextError = reason instanceof Error ? reason : new Error(String(reason));
      setError(nextError);
      setLoading(false);
      return { error: nextError };
    }
  }, [key]);

  useEffect(() => {
    let active = true;
    if (!enabled) {
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError(null);
    Promise.resolve(queryFnRef.current()).then(
      (result) => {
        if (!active) return;
        setData(result);
        setLoading(false);
      },
      (reason) => {
        if (!active) return;
        setError(reason instanceof Error ? reason : new Error(String(reason)));
        setLoading(false);
      },
    );
    return () => { active = false; };
  }, [enabled, key]);

  return { data, error, isLoading, isError: Boolean(error), refetch: execute };
}
