import { NavLink } from "react-router-dom";

import {
  FaHome,
  FaUserFriends,
  FaDog,
  FaSyringe,
  FaCalendarAlt,
  FaStethoscope,
  FaBoxes,
  FaChartBar,
  FaCog,
} from "react-icons/fa";

import "../../styles/sidebar.css";

function Sidebar() {
  const menuItems = [
    {
      path: "/",
      text: "Dashboard",
      icon: <FaHome />,
    },
    {
      path: "/musteriler",
      text: "Müşteriler",
      icon: <FaUserFriends />,
    },
    {
      path: "/hayvanlar",
      text: "Hayvanlar",
      icon: <FaDog />,
    },
    {
      path: "/muayeneler",
      text: "Muayeneler",
      icon: <FaStethoscope />,
    },
    {
      path: "/asilar",
      text: "Aşılar",
      icon: <FaSyringe />,
    },
    {
      path: "/randevular",
      text: "Randevular",
      icon: <FaCalendarAlt />,
    },
    {
      path: "/stok",
      text: "Stok",
      icon: <FaBoxes />,
    },
    {
      path: "/raporlar",
      text: "Raporlar",
      icon: <FaChartBar />,
    },
    {
      path: "/ayarlar",
      text: "Ayarlar",
      icon: <FaCog />,
    },
  ];

  return (
    <aside className="sidebar">

      <div className="logo">
        🐾 <span>VetSys</span>
      </div>

      <nav className="sidebar-menu">

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            className={({ isActive }) =>
              isActive
                ? "menu-item active"
                : "menu-item"
            }
          >
            <span className="menu-icon">
              {item.icon}
            </span>

            <span>{item.text}</span>
          </NavLink>
        ))}

      </nav>

      <div className="sidebar-footer">
        <small>VetSys v1.0.0</small>
      </div>

    </aside>
  );
}

export default Sidebar;