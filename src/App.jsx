import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard";

import Musteriler from "./pages/Musteriler";
import MusteriDetay from "./pages/MusteriDetay";

import Hayvanlar from "./pages/Hayvanlar";
import HayvanDetay from "./pages/HayvanDetay";

import Vaccines from "./pages/Vaccines";
import Appointments from "./pages/Appointments";
import Examinations from "./pages/Examinations";
import Stock from "./pages/Stock";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<MainLayout />}>

          {/* Dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Müşteriler */}
          <Route
            path="/musteriler"
            element={<Musteriler />}
          />

          <Route
            path="/musteriler/:id"
            element={<MusteriDetay />}
          />

          {/* Hayvanlar */}
          <Route
            path="/hayvanlar"
            element={<Hayvanlar />}
          />

          <Route
            path="/hayvanlar/:id"
            element={<HayvanDetay />}
          />

          {/* Muayeneler */}
          <Route
            path="/muayeneler"
            element={<Examinations />}
          />

          {/* Randevular */}
          <Route
            path="/randevular"
            element={<Appointments />}
          />

          {/* Aşılar */}
          <Route
            path="/asilar"
            element={<Vaccines />}
          />

          {/* Stok */}
          <Route
            path="/stok"
            element={<Stock />}
          />

          {/* Raporlar */}
          <Route
            path="/raporlar"
            element={<Reports />}
          />

          {/* Ayarlar */}
          <Route
            path="/ayarlar"
            element={<Settings />}
          />

        </Route>

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;