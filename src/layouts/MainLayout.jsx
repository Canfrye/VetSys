import { Outlet } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import GlobalSearch from "../components/search/GlobalSearch";

function MainLayout() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar />

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "20px 25px 0",
          }}
        >
          <GlobalSearch />
        </div>

        <main
          style={{
            flex: 1,
            padding: "25px",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default MainLayout;