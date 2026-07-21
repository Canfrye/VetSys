import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import AuthProvider from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import AccessDenied from "./pages/AccessDenied";

import Dashboard from "./pages/Dashboard";

import Musteriler from "./pages/Musteriler";
import MusteriDetay from "./pages/MusteriDetay";

import Hayvanlar from "./pages/Hayvanlar";
import HayvanDetay from "./pages/HayvanDetay";

import Vaccines from "./pages/Vaccines";
import Appointments from "./pages/Appointments";
import Examinations from "./pages/Examinations";
import Reminders from "./pages/Reminders";
import Aktivite from "./pages/Aktivite";
import Stock from "./pages/Stock";
import Invoices from "./pages/Invoices";
import Prescriptions from "./pages/Prescriptions";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

import { getAllowedRoles } from "./utils/roles";
import DesktopBootstrap from "./components/DesktopBootstrap";
import ClinicSetupGate from "./components/setup/ClinicSetupGate";

/**
 * Electron (file://) ortamında BrowserRouter çalışmaz;
 * masaüstü kabuğunda HashRouter kullanılır. Web/dev davranışı aynı kalır.
 */
const isElectronShell =
  typeof navigator !== "undefined" &&
  /electron/i.test(navigator.userAgent);

const AppRouter = isElectronShell ? HashRouter : BrowserRouter;

/**
 * Verilen yol için ROUTE_PERMISSIONS'daki rol listesini otomatik alıp
 * sayfayı ProtectedRoute ile sarar; rol haritası tek yerde (utils/roles.js)
 * yönetilir, her route için elle tekrar yazılmaz.
 */
function withRoleProtection(permissionPath, element) {
  return (
    <ProtectedRoute allowedRoles={getAllowedRoles(permissionPath)}>
      {element}
    </ProtectedRoute>
  );
}

function App() {
  return (
    <DesktopBootstrap>
      <AuthProvider>
        <ClinicSetupGate>
          <AppRouter>
            <Routes>

          {/* Giriş */}
          <Route path="/login" element={<Login />} />

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >

            {/* Yetkisiz Erişim */}
            <Route path="/access-denied" element={<AccessDenied />} />

            {/* Dashboard */}
            <Route
              path="/"
              element={withRoleProtection("/", <Dashboard />)}
            />

            {/* Müşteriler */}
            <Route
              path="/musteriler"
              element={withRoleProtection("/musteriler", <Musteriler />)}
            />

            <Route
              path="/musteriler/:id"
              element={withRoleProtection("/musteriler", <MusteriDetay />)}
            />

            {/* Hayvanlar */}
            <Route
              path="/hayvanlar"
              element={withRoleProtection("/hayvanlar", <Hayvanlar />)}
            />

            <Route
              path="/hayvanlar/:id"
              element={withRoleProtection("/hayvanlar", <HayvanDetay />)}
            />

            {/* Muayeneler */}
            <Route
              path="/muayeneler"
              element={withRoleProtection("/muayeneler", <Examinations />)}
            />

            {/* Randevular */}
            <Route
              path="/randevular"
              element={withRoleProtection("/randevular", <Appointments />)}
            />

            {/* Hatırlatmalar */}
            <Route
              path="/hatirlatmalar"
              element={withRoleProtection("/hatirlatmalar", <Reminders />)}
            />

            <Route
              path="/aktivite"
              element={withRoleProtection("/aktivite", <Aktivite />)}
            />

            {/* Aşılar */}
            <Route
              path="/asilar"
              element={withRoleProtection("/asilar", <Vaccines />)}
            />

            {/* Stok */}
            <Route
              path="/stok"
              element={withRoleProtection("/stok", <Stock />)}
            />

            {/* Reçeteler */}
            <Route
              path="/receteler"
              element={withRoleProtection("/receteler", <Prescriptions />)}
            />

            {/* Faturalar */}
            <Route
              path="/faturalar"
              element={withRoleProtection("/faturalar", <Invoices />)}
            />

            {/* Finans */}
            <Route
              path="/finans"
              element={withRoleProtection("/finans", <Finance />)}
            />

            {/* Raporlar */}
            <Route
              path="/raporlar"
              element={withRoleProtection("/raporlar", <Reports />)}
            />

            {/* Ayarlar */}
            <Route
              path="/ayarlar"
              element={withRoleProtection("/ayarlar", <Settings />)}
            />

          </Route>

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>
          </AppRouter>
        </ClinicSetupGate>
      </AuthProvider>
    </DesktopBootstrap>
  );
}

export default App;
