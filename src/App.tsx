import { Suspense, lazy, useEffect } from "react";
import { HashRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "./state/store";
import Onboarding from "./pages/Onboarding";
import Today from "./pages/Today";
import Week from "./pages/Week";
import Shop from "./pages/Shop";
import RecipePage from "./pages/Recipe";
import Profile from "./pages/Profile";
import ScheduleEdit from "./pages/ScheduleEdit";
import Swap from "./pages/Swap";

// The Claude SDK is only needed on this screen: keep it out of the main bundle
const AteOther = lazy(() => import("./pages/AteOther"));

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Routed() {
  const { state } = useStore();
  if (!state.profile) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }
  return (
    <Routes>
      <Route path="/" element={<Today />} />
      <Route path="/week" element={<Week />} />
      <Route path="/shop" element={<Shop />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/schedule" element={<ScheduleEdit />} />
      <Route path="/recipe/:id" element={<RecipePage />} />
      <Route path="/ate" element={<Suspense fallback={null}><AteOther /></Suspense>} />
      <Route path="/swap/:kind/:day" element={<Swap />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <ScrollTop />
        <Routed />
      </HashRouter>
    </StoreProvider>
  );
}
