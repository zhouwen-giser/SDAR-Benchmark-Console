import { useQuery } from "@tanstack/react-query";
import { consoleApi, currentApiMode } from "../api/consoleApi";

/** One cache entry shared by the shell, selectors and all analysis consumers. */
export function useContextOptions() {
  return useQuery({
    queryKey: ["context-options"],
    queryFn: ({ signal }) => consoleApi.getContextOptions({ signal }),
    enabled: currentApiMode() === "http",
    staleTime: 300_000,
    retry: false,
  });
}
