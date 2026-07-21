export const OPEN_CLINIC_SETUP_EVENT = "vetsys-open-clinic-setup";

export function openClinicSetupWizard() {
  window.dispatchEvent(new Event(OPEN_CLINIC_SETUP_EVENT));
}
