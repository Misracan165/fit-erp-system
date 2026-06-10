import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Trainers from "./pages/Trainers";
import Payments from "./pages/Payments";
import Packages from "./pages/Packages";
import DatabaseManager from "./pages/DatabaseManager";
import ProjectManagement from "./pages/ProjectManagement";
import { FEATURE_FLAGS } from "./config";

function App() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/members" element={<Members />} />
          <Route path="/trainers" element={<Trainers />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/packages" element={<Packages />} />
          <Route path="/db-manager" element={<DatabaseManager />} />
          {FEATURE_FLAGS.SHOW_PROJECT_MANAGEMENT && (
            <Route path="/project-management" element={<ProjectManagement />} />
          )}
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}

export default App;