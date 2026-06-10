import { NavLink } from "react-router-dom";
import { FEATURE_FLAGS } from "../config";

function MainLayout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>FitERP</h2>

        <ul>
          <li>
            <NavLink to="/">Dashboard</NavLink>
          </li>

          <li>
            <NavLink to="/members">Üyeler</NavLink>
          </li>

          <li>
            <NavLink to="/trainers">Eğitmenler</NavLink>
          </li>

          <li>
            <NavLink to="/payments">Ödemeler</NavLink>
          </li>

          <li>
            <NavLink to="/packages">Paketler</NavLink>
          </li>

          <li>
            <NavLink to="/db-manager">Veritabanı Paneli</NavLink>
          </li>

          {FEATURE_FLAGS.SHOW_PROJECT_MANAGEMENT && (
            <li>
              <NavLink to="/project-management">Proje Yönetimi</NavLink>
            </li>
          )}
        </ul>
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;