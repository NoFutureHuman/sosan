import { Navigate } from "react-router";

export function RedirectCommunity() {
  return <Navigate to="/owner?tab=community" replace />;
}

export function RedirectSupport() {
  return <Navigate to="/owner?tab=support" replace />;
}

export function RedirectMarketPrice() {
  return <Navigate to="/owner?tab=market-price" replace />;
}

export function RedirectTools() {
  return <Navigate to="/owner?tab=tools" replace />;
}
