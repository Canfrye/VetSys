/**
 * Aşı tamamlanınca fatura taslağı hazırlama — sayfalar ortak kullanır.
 * Kaydetmez; yalnızca önizleme verisi döner.
 */

import { getAnimalById } from "../services/animalService";
import { getAnimalVaccines } from "../services/vaccineService";
import { getInvoices } from "../services/invoiceService";
import { getStock } from "../services/stockService";
import { getSettings } from "../services/settingsService";
import {
  buildVaccineCompletionInvoiceDraft,
  collectSameDayUnbilledVaccines,
  isVaccineInvoiced,
} from "./invoiceDraft";

/**
 * @returns {Promise<null | { draft: object, vaccines: object[], animal: object }>}
 */
export async function prepareVaccineCompletionInvoiceOffer(triggerVaccine) {
  if (!triggerVaccine?.id || !triggerVaccine.animalId) return null;

  const [animal, animalVaccines, invoices, stockItems, settings] =
    await Promise.all([
      getAnimalById(triggerVaccine.animalId),
      getAnimalVaccines(triggerVaccine.animalId),
      getInvoices(),
      getStock(),
      getSettings(),
    ]);

  if (!animal) return null;

  // Tetikleyici aşı listede yoksa (henüz merge edilmemiş) ekle
  const merged = [...animalVaccines];
  if (!merged.some((v) => String(v.id) === String(triggerVaccine.id))) {
    merged.push(triggerVaccine);
  } else {
    const idx = merged.findIndex(
      (v) => String(v.id) === String(triggerVaccine.id)
    );
    merged[idx] = { ...merged[idx], ...triggerVaccine };
  }

  if (isVaccineInvoiced(triggerVaccine.id, invoices)) {
    return null;
  }

  const sameDay = collectSameDayUnbilledVaccines({
    triggerVaccine,
    animalVaccines: merged,
    invoices,
  });

  const draft = buildVaccineCompletionInvoiceDraft({
    animal,
    vaccines: sameDay,
    stockItems,
    settings,
    invoices,
  });

  if (!draft) return null;

  return {
    draft,
    vaccines: sameDay,
    animal,
  };
}
