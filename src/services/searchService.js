import { getCustomers } from "./customerService";
import { getAnimals } from "./animalService";
import { getVaccines } from "./vaccineService";
import { getAppointments } from "./appointmentService";
import { getExaminations } from "./examinationService";

export function globalSearch(text) {
  text = text.toLowerCase().trim();

  if (!text) return [];

  const results = [];

  getCustomers().forEach((customer) => {
    if (
      `${customer.ad} ${customer.soyad}`
        .toLowerCase()
        .includes(text) ||
      (customer.telefon || "")
        .toLowerCase()
        .includes(text)
    ) {
      results.push({
        id: customer.id,
        type: "customer",
        title: `${customer.ad} ${customer.soyad}`,
        subtitle: customer.telefon,
      });
    }
  });

  getAnimals().forEach((animal) => {
    if (
      animal.name.toLowerCase().includes(text) ||
      (animal.microchipNo || "")
        .toLowerCase()
        .includes(text)
    ) {
      results.push({
        id: animal.id,
        type: "animal",
        title: animal.name,
        subtitle: animal.ownerName,
      });
    }
  });

  getVaccines().forEach((vaccine) => {
    if (
      vaccine.vaccineName.toLowerCase().includes(text)
    ) {
      results.push({
        id: vaccine.id,
        type: "vaccine",
        title: vaccine.vaccineName,
        subtitle: vaccine.animalName,
      });
    }
  });

  getAppointments().forEach((appointment) => {
    if (
      appointment.reason.toLowerCase().includes(text)
    ) {
      results.push({
        id: appointment.id,
        type: "appointment",
        title: appointment.reason,
        subtitle: appointment.animalName,
      });
    }
  });

  getExaminations().forEach((exam) => {
    if (
      (exam.diagnosis || "")
        .toLowerCase()
        .includes(text)
    ) {
      results.push({
        id: exam.id,
        type: "examination",
        title: exam.diagnosis,
        subtitle: exam.animalName,
      });
    }
  });

  return results;
}