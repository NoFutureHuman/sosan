import { RequireAuth } from "./RequireAuth";
import { MyPage } from "./MyPage";

export function MyPageRoute() {
  return (
    <RequireAuth>
      <MyPage />
    </RequireAuth>
  );
}
