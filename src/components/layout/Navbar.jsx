import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { IconButton, Tooltip } from "@mui/material";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";

import "../../styles/navbar.css";

import {
  getSettings,
  subscribeSettings,
} from "../../services/settingsService";

import { useAuth } from "../../hooks/useAuth";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date());
  const [settings, setSettings] = useState({});

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSettings(() => {
      getSettings().then(setSettings);
    });

    return unsubscribe;
  }, []);

  const date = time.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  const clinicName = settings.clinicName?.trim() || "VetSys";
  const clinicSubtitle =
    settings.veterinarian?.trim() || "Veteriner Klinik Yönetim Sistemi";
  const userName =
    user?.fullName || settings.veterinarian?.trim() || "Kullanıcı";

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2 title={clinicName}>{clinicName}</h2>
        <span title={clinicSubtitle}>{clinicSubtitle}</span>
      </div>

      <div className="navbar-right">
        <div className="navbar-time">
          <strong>{time.toLocaleTimeString("tr-TR")}</strong>
          <small>{date}</small>
        </div>

        <div className="navbar-user">
          <AccountCircleOutlinedIcon sx={{ fontSize: 38 }} />

          <div>
            <strong title={userName}>{userName}</strong>
            <small>{user?.role || "Veteriner Hekim"}</small>
          </div>

          <Tooltip title="Çıkış Yap">
            <IconButton
              size="small"
              onClick={handleLogout}
              aria-label="Çıkış Yap"
              sx={{ ml: 0.5 }}
            >
              <LogoutOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
