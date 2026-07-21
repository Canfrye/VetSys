import { useCallback, useEffect, useState } from "react";

import ClinicSetupWizard from "./ClinicSetupWizard";
import { getSettings, saveSettings } from "../../services/settingsService";
import { getUsers } from "../../services/authService";
import { needsClinicSetup } from "../../utils/clinicIdentity";
import {
  OPEN_CLINIC_SETUP_EVENT,
} from "../../utils/clinicSetupEvents";
import { createAuditLog } from "../../services/auditLogService";
import { AUDIT_ACTIONS, AUDIT_MODULES } from "../../utils/auditLog";
import { useNotification } from "../../hooks/useNotification";

/**
 * İlk açılışta klinik adı yoksa sihirbazı zorunlu açar.
 * Ayarlar'dan OPEN_CLINIC_SETUP_EVENT ile tekrar açılabilir.
 */
export default function ClinicSetupGate({ children }) {
  const { notify } = useNotification();
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState(null);
  const [users, setUsers] = useState([]);
  const [forced, setForced] = useState(false);
  const [wizardKey, setWizardKey] = useState(0);

  const needsSetup = needsClinicSetup(settings);
  const open = Boolean(ready && (needsSetup || forced));

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [s, u] = await Promise.all([getSettings(), getUsers()]);
        if (cancelled) return;
        setSettings(s);
        setUsers(u);
      } catch {
        // Ayarlar okunamasa bile uygulamayı engelleme
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
      const saved = await saveSettings(payload);
      setSettings(saved);
      setForced(false);

      await createAuditLog({
        module: AUDIT_MODULES.SETTINGS,
        action: AUDIT_ACTIONS.CHANGED,
        description: "Klinik kurulum sihirbazı tamamlandı",
      });

      notify("Klinik bilgileri kaydedildi.");
      window.dispatchEvent(new Event("storage"));
    },
    [notify]
  );

  function handleClose() {
    if (needsClinicSetup(settings) && !forced) {
      notify(
        "Klinik adı girilene kadar kurulum sihirbazı tekrar açılır.",
        "info"
      );
    }
    setForced(false);
  }

  if (!ready) {
    return null;
  }

  return (
    <>
      {children}
      <ClinicSetupWizard
        key={wizardKey}
        open={open}
        allowCancel={!needsSetup || forced}
        initialSettings={settings || {}}
        users={users}
        onClose={handleClose}
        onSave={handleSave}
      />
    </>
  );
}
