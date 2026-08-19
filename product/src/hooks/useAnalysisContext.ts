import { useCallback, useMemo } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { AnalysisFilters, Scenario, UiDataState } from "../types";

const defaults: AnalysisFilters = {
  candidateId: "cand-142-def456",
  baselineId: "cand-141-abc123",
  datasetVersion: "release-v0.1",
  profileVersionId: "sdar-v2-review-2.1",
  runId: "R-20260815-004",
  track: "all",
  risk: "all",
  period: "7d",
  scenario: "blocked",
  dataState: "loaded",
};

export function useAnalysisContext() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();

  const filters = useMemo<AnalysisFilters>(
    () => ({
      candidateId: searchParams.get("candidateId") ?? defaults.candidateId,
      baselineId: searchParams.get("baselineId") ?? defaults.baselineId,
      datasetVersion: searchParams.get("datasetVersion") ?? defaults.datasetVersion,
      profileVersionId: searchParams.get("profileVersionId") ?? defaults.profileVersionId,
      runId: searchParams.get("runId") ?? defaults.runId,
      track: searchParams.get("track") ?? defaults.track,
      risk: searchParams.get("risk") ?? defaults.risk,
      period: searchParams.get("period") ?? defaults.period,
      scenario: (searchParams.get("scenario") ?? defaults.scenario) as Scenario,
      dataState: (searchParams.get("dataState") ?? defaults.dataState) as UiDataState,
    }),
    [searchParams],
  );

  const setFilters = useCallback(
    (patch: Partial<AnalysisFilters>, options?: { replace?: boolean; clearLocal?: boolean }) => {
      const next = new URLSearchParams(searchParams);
      if (options?.clearLocal) {
        ["metric", "change", "gate", "drawer", "caseId", "tab"].forEach((key) => next.delete(key));
      }
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      setSearchParams(next, { replace: options?.replace ?? false });
    },
    [searchParams, setSearchParams],
  );

  const navigateWithContext = useCallback(
    (pathname: string, extra: Record<string, string | undefined> = {}) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(extra).forEach(([key, value]) => {
        if (value === undefined || value === "") next.delete(key);
        else next.set(key, value);
      });
      navigate({ pathname, search: next.toString() });
    },
    [navigate, searchParams],
  );

  const setQueryParams = useCallback(
    (
      patch: Record<string, string | null | undefined>,
      options?: { replace?: boolean },
    ) => {
      const next = new URLSearchParams(searchParams);
      Object.entries(patch).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "") next.delete(key);
        else next.set(key, value);
      });
      setSearchParams(next, { replace: options?.replace ?? false });
    },
    [searchParams, setSearchParams],
  );

  return {
    filters,
    setFilters,
    setQueryParams,
    navigateWithContext,
    searchParams,
    pathname: location.pathname,
  };
}
