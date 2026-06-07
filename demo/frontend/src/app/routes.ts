import { createBrowserRouter } from "react-router";
import { Layout } from "./components/Layout";
import { HomePage } from "./components/HomePage";
import { Marketplace } from "./components/Marketplace";
import { ChatPage } from "./components/ChatPage";
import { SignupPage } from "./components/SignupPage";
import { RegisterPage } from "./components/RegisterPage";
import { LoginPage } from "./components/LoginPage";
import { MyPageRoute } from "./components/MyPageRoute";
import { AnalysisHistoryDetailRoute } from "./components/AnalysisHistoryDetailRoute";
import { AIAnalysisPage } from "./components/AIAnalysisPage";
import { LandingPage } from "./components/LandingPage";
import { ExistingOwnerMainPage } from "./components/ExistingOwnerMainPage";
import {
  RedirectCommunity,
  RedirectMarketPrice,
  RedirectSupport,
  RedirectTools,
} from "./components/OwnerRouteRedirects";

export const router = createBrowserRouter([
  { path: "/", Component: LandingPage },
  { path: "/signup", Component: SignupPage },
  { path: "/register", Component: RegisterPage },
  { path: "/login", Component: LoginPage },
  { path: "/mypage", Component: MyPageRoute },
  { path: "/mypage/history/:historyId", Component: AnalysisHistoryDetailRoute },
  { path: "/ai-analysis", Component: AIAnalysisPage },
  { path: "/owner", Component: ExistingOwnerMainPage },
  { path: "/community", Component: RedirectCommunity },
  { path: "/support", Component: RedirectSupport },
  { path: "/market-price", Component: RedirectMarketPrice },
  { path: "/tools", Component: RedirectTools },
  {
    path: "/",
    Component: Layout,
    children: [
      { path: "home", Component: HomePage },
      { path: "trade", Component: Marketplace },
      { path: "chat", Component: ChatPage },
    ],
  },
]);