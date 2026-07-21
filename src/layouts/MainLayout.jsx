import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import GlobalSearch from "../components/search/GlobalSearch";

import NotificationProvider from "../context/NotificationProvider";
import ConfirmDialogProvider from "../context/ConfirmDialogProvider";

function MainLayout() {
  return (
    <NotificationProvider>
      <ConfirmDialogProvider>
        <Box
          sx={{
            display: "flex",
            minHeight: "100vh",
            width: "100%",
            overflow: "hidden",
          }}
        >
          <Sidebar />

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
            }}
          >
            <Navbar />

            <Box
              sx={{
                display: "flex",
                justifyContent: { xs: "stretch", md: "flex-end" },
                px: { xs: 2, md: 3 },
                pt: 2.5,
              }}
            >
              <Box sx={{ width: { xs: "100%", md: 380 }, maxWidth: "100%" }}>
                <GlobalSearch />
              </Box>
            </Box>

            <Box
              component="main"
              sx={{
                flex: 1,
                p: { xs: 2, md: 3 },
                minWidth: 0,
              }}
            >
              <Outlet />
            </Box>
          </Box>
        </Box>
      </ConfirmDialogProvider>
    </NotificationProvider>
  );
}

export default MainLayout;
