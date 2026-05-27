function MainLayout({ children }) {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>FitERP</h2>

        <ul>
          <li>Dashboard</li>
          <li>Üyeler</li>
          <li>Eğitmenler</li>
          <li>Ödemeler</li>
          <li>Antrenmanlar</li>
        </ul>
      </aside>

      <main className="content">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;