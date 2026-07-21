import { NavLink } from "react-router-dom";

import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import VaccinesOutlinedIcon from "@mui/icons-material/VaccinesOutlined";
import EventOutlinedIcon from "@mui/icons-material/EventOutlined";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";
import HistoryOutlinedIcon from "@mui/icons-material/HistoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import MedicationIcon from "@mui/icons-material/Medication";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PetsIcon from "@mui/icons-material/Pets";

import { useAuth } from "../../hooks/useAuth";
import { getAllowedRoles } from "../../utils/roles";

import "../../styles/sidebar.css";

function Sidebar() {
  const { user, hasRole } = useAuth();

  const menuItems = [
    { path: "/", text: "Dashboard", icon: <HomeOutlinedIcon fontSize="small" /> },
    {
      path: "/musteriler",
      text: "Müşteriler",
      icon: <PeopleAltOutlinedIcon fontSize="small" />,
    },
    {
      path: "/hayvanlar",
      text: "Hayvanlar",
      icon: <PetsOutlinedIcon fontSize="small" />,
    },
    {
      path: "/muayeneler",
      text: "Muayeneler",
      icon: <MedicalServicesOutlinedIcon fontSize="small" />,
    },
    {
      path: "/asilar",
      text: "Aşılar",
      icon: <VaccinesOutlinedIcon fontSize="small" />,
    },
    {
      path: "/randevular",
      text: "Randevular",
      icon: <EventOutlinedIcon fontSize="small" />,
    },
    {
      path: "/hatirlatmalar",
      text: "Hatırlatmalar",
      icon: <NotificationsActiveOutlinedIcon fontSize="small" />,
    },
    {
      path: "/aktivite",
      text: "Aktivite Geçmişi",
      icon: <HistoryOutlinedIcon fontSize="small" />,
    },
    {
      path: "/stok",
      text: "Stok",
      icon: <Inventory2OutlinedIcon fontSize="small" />,
    },
    {
      path: "/receteler",
      text: "Reçeteler",
      icon: <MedicationIcon fontSize="small" />,
    },
    {
      path: "/faturalar",
      text: "Faturalar",
      icon: <ReceiptLongOutlinedIcon fontSize="small" />,
    },
    {
      path: "/finans",
      text: "Finans",
      icon: <AccountBalanceWalletOutlinedIcon fontSize="small" />,
    },
    {
      path: "/raporlar",
      text: "Raporlar",
      icon: <AssessmentOutlinedIcon fontSize="small" />,
    },
    {
      path: "/ayarlar",
      text: "Ayarlar",
      icon: <SettingsOutlinedIcon fontSize="small" />,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    hasRole(getAllowedRoles(item.path))
  );

  return (
    <aside className="sidebar">
      <div className="logo">
        <PetsIcon fontSize="medium" />
        <span>VetSys</span>
      </div>

      <nav className="sidebar-menu">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              isActive ? "menu-item active" : "menu-item"
            }
            title={item.text}
          >
            <span className="menu-icon">{item.icon}</span>
            <span>{item.text}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <small>
          {user?.role ? `${user.role} olarak giriş yaptınız` : ""}
        </small>
        <small>VetSys v1.0.0</small>
      </div>
    </aside>
  );
}

export default Sidebar;
