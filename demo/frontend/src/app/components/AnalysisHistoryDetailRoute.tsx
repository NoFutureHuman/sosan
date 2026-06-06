import { RequireAuth } from "./RequireAuth";
import { AnalysisHistoryDetailPage } from "./AnalysisHistoryDetailPage";

export function AnalysisHistoryDetailRoute() {
  return (
    <RequireAuth>
      <AnalysisHistoryDetailPage />
    </RequireAuth>
  );
}
