import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "@/components/Layout";
import InstrumentsPage from "@/pages/InstrumentsPage";
import CleaningPage from "@/pages/CleaningPage";
import SterilizationPage from "@/pages/SterilizationPage";
import ExceptionsPage from "@/pages/ExceptionsPage";
import InventoryPage from "@/pages/InventoryPage";
import TracePage from "@/pages/TracePage";
import { useAppStore } from "@/store/useAppStore";

function AppContent() {
  const initData = useAppStore((state) => state.initData);

  useEffect(() => {
    initData();
  }, [initData]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/instruments" replace />} />
        <Route path="/instruments" element={<InstrumentsPage />} />
        <Route path="/cleaning" element={<CleaningPage />} />
        <Route path="/sterilization" element={<SterilizationPage />} />
        <Route path="/exceptions" element={<ExceptionsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/trace" element={<TracePage />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
