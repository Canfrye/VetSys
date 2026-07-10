import { useEffect, useState } from "react";
import { FaUserCircle } from "react-icons/fa";

import "../../styles/navbar.css";

import {
  getSettings,
  subscribeSettings,
} from "../../services/settingsService";

function Navbar() {
  const [time, setTime] = useState(new Date());

  const [settings, setSettings] = useState(getSettings());

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeSettings(() => {
      setSettings(getSettings());
    });

    return unsubscribe;
  }, []);

  const date = time.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="navbar">
      <div className="navbar-left">
        <h2>
          {settings.clinicName?.trim() || "VetSys"}
        </h2>

        <span>
          {settings.veterinarian?.trim() ||
            "Veteriner Klinik Yönetim Sistemi"}
        </span>
      </div>

      <div className="navbar-right">
        <div className="navbar-time">
          <strong>
            {time.toLocaleTimeString("tr-TR")}
          </strong>

          <small>{date}</small>
        </div>

        <div className="navbar-user">
          <FaUserCircle size={38} />

          <div>
            <strong>
              {settings.veterinarian?.trim() || "Admin"}
            </strong>

            <small>Veteriner Hekim</small>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;