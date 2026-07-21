import { useCallback, useContext, useEffect, useState } from "react";

import ClinicSetupWizard from "./ClinicSetupWizard";
import { getSettings, saveSettings } from "../../services/settingsService";
import { getUsers } from "../../services/authService";
import { needsClinicSetup } from "../../utils/clinicIdentity";
import { OPEN_CLINIC_SETUP_EVENT } from "../../utils/clinicSetupEvents";
import { createAuditLog } from "../../services/auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../../utils/auditLog";
import NotificationContext from "../../context/NotificationContext";

const EMPTY_SETTINGS = Object.freeze({});

function safeNotify(notifyFn, message, severity = "info") {
  try {
    if (typeof notifyFn === "function") {
      notifyFn(message, severity);
      return;
    }
  } catch {
    // Bildirim katmanı yoksa uygulamayı düşürme
  }
  if (severity === "error") {
    console.error("[VetSys]", message);
  }
}

/**
 * İlk açılışta klinik adı yoksa sihirbazı açar.
 * NotificationProvider dışında da güvenle çalışır (beyaz ekran yok).
 */
export default function ClinicSetupGate({ children }) {
  const notification = useContext(NotificationContext);
  const notify = notification?.notify;

  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(EMPTY_SETTINGS);
  const [users, setUsers] = useState([]);
  const [forced, setForced] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  const safeSettings =
    settings && typeof settings === "object" ? settings : EMPTY_SETTINGS;
  const needsSetup = needsClinicSetup(safeSettings);
  const open = Boolean(ready && (needsSetup || forced));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [rawSettings, rawUsers] = await Promise.all([
          getSettings().catch(() => null),
          getUsers().catch(() => []),
        ]);

        if (cancelled) return;

        setSettings(
          rawSettings && typeof rawSettings === "object"
            ? rawSettings
            : EMPTY_SETTINGS
        );
        setUsers(Array.isArray(rawUsers) ? rawUsers : []);
      } catch {
        if (cancelled) return;
        setSettings(EMPTY_SETTINGS);
        setUsers([]);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function onOpen() {
      setForced(true);
      setWizardKey((k) => k + 1);
    }

    window.addEventListener(OPEN_CLINIC_SETUP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CLINIC_SETUP_EVENT, onOpen);
  }, []);

  const handleSave = useCallback(
    async (payload) => {
      try {
        const saved = await saveSettings(payload || {});
        setSettings(
          saved && typeof saved === "object" ? saved : payload || EMPTY_SETTINGS
        );
        setForced(false);

        await createAuditLog({
          module: AUDIT_MODULES.SETTINGS,
          action: AUDIT_ACTIONS.CHANGED,
          description: "Klinik kurulum sihirbazı tamamlandı",
        });

        safeNotify(notify, "Klinik bilgileri kaydedildi.");
        window.dispatchEvent(new Event("storage"));
      } catch (error) {
        safeNotify(
          notify,
          error?.message || "Klinik bilgileri kaydedilemedi.",
          "error"
        );
      }
    },
    [notify]
  );

  function handleClose() {
    if (needsClinicSetup(safeSettings) && !forced) {
      safeNotify(
        notify,
        "Klinik adı girilene kadar kurulum sihirbazı tekrar açılır.",
        "info"
      );
    }
    setForced(false);
  }

  // Yükleme sırasında bile çocukları göster — beyaz ekran yok
  return (
    <>
      {children}
      {ready && (
        <ClinicSetupWizard
          key={wizardKey}
          open={open}
          allowCancel={!needsSetup || forced}
          initialSettings={safeSettings}
          users={Array.isArray(users) ? users : []}
          onClose={handleClose}
          onSave={handleSave}
        />
      )}
    </>
  );
}
