"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ConfigProvider, Result, Button } from "antd";
import { BrowserRouter, Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import zhCN from "antd/locale/zh_CN";
import { AppShell } from "./layouts/AppShell";
import { OverviewPage } from "./pages/OverviewPage";
import { RunsPage } from "./pages/RunsPage";
import { RunCreatePage } from "./pages/RunCreatePage";
import { RunDetailPage } from "./pages/RunDetailPage";
import { ComparePage } from "./pages/ComparePage";
import { CasesPage } from "./pages/CasesPage";
import { EvaluationPage } from "./pages/EvaluationPage";
import { EvaluationInputSnapshotPage } from "./pages/EvaluationInputSnapshotPage";
import { EvidencePage } from "./pages/EvidencePage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { EvaluationsPage } from "./pages/EvaluationsPage";
import { EvidenceBundlesPage } from "./pages/EvidenceBundlesPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { DataCompletenessPage } from "./pages/DataCompletenessPage";
import { ArtifactViewerPage } from "./pages/ArtifactViewerPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AlertsPage } from "./pages/AlertsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { ResourceDetailPage } from "./pages/ResourceDetailPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { darkTheme } from "./theme/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 20_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

class AppErrorBoundary extends Component<{ children: ReactNode }, { error?: Error }> {
  state: { error?: Error } = {};

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("SDAR Benchmark Console render error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <Result
          status="error"
          title="页面渲染失败"
          subTitle={this.state.error.message}
          extra={<Button type="primary" onClick={() => window.location.assign("/overview")}>返回总览</Button>}
        />
      );
    }
    return this.props.children;
  }
}

function RootRedirect() {
  const location = useLocation();
  return <Navigate to={{ pathname: "/overview", search: location.search }} replace />;
}

function LegacyEvidenceRedirect() {
  const { bundleId } = useParams();
  const location = useLocation();
  return <Navigate to={{ pathname: `/evidence-bundles/${bundleId ?? "bundle-cand-mcp17"}`, search: location.search }} replace />;
}

function ApplicationRoutes() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/overview" element={<OverviewPage />} />
        <Route path="/runs" element={<RunsPage />} />
        <Route path="/runs/new" element={<RunCreatePage />} />
        <Route path="/runs/:runId" element={<RunDetailPage />} />
        <Route path="/runs/:runId/repetitions/:repetitionId/artifacts/:artifactId" element={<ArtifactViewerPage />} />
        <Route path="/benchmark-runs/:runId" element={<RunDetailPage />} />
        <Route path="/compare/:comparisonId" element={<ComparePage />} />
        <Route path="/cases" element={<CasesPage />} />
        <Route path="/cases/:caseId" element={<CaseDetailPage />} />
        <Route path="/evaluations" element={<EvaluationsPage />} />
        <Route path="/evaluations/:evaluationId" element={<EvaluationPage />} />
        <Route path="/evaluation-input-snapshots/:snapshotId" element={<EvaluationInputSnapshotPage />} />
        <Route path="/evidence-bundles" element={<EvidenceBundlesPage />} />
        <Route path="/evidence-bundles/:bundleId" element={<EvidencePage />} />
        <Route path="/evidence/:bundleId" element={<LegacyEvidenceRedirect />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/data-completeness" element={<DataCompletenessPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/candidates/:candidateId" element={<ResourceDetailPage kind="candidate" />} />
        <Route path="/baselines/:baselineId" element={<ResourceDetailPage kind="baseline" />} />
        <Route path="/datasets/:datasetVersion" element={<ResourceDetailPage kind="dataset" />} />
        <Route path="/profiles/:profileVersionId" element={<ResourceDetailPage kind="profile" />} />
        <Route path="*" element={<PlaceholderPage title="页面未找到" scope="404" />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppErrorBoundary>
      <ConfigProvider locale={zhCN} theme={darkTheme}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ApplicationRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </ConfigProvider>
    </AppErrorBoundary>
  );
}
