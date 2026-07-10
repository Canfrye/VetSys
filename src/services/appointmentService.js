const STORAGE_KEY = "vetsys_appointments";

const read = () => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

const write = (appointments) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(appointments));
};

const generateId = () => {
  if (window.crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
};

export const getAppointments = () => {
  return read().sort((a, b) => {
    return (
      new Date(`${a.date} ${a.time}`) -
      new Date(`${b.date} ${b.time}`)
    );
  });
};

export const getAppointmentById = (id) =>
  read().find((a) => a.id === id);

export const addAppointment = (appointment) => {
  const appointments = read();

  const newAppointment = {
    id: generateId(),

    animalId: appointment.animalId,
    animalName: appointment.animalName,

    ownerId: appointment.ownerId,
    ownerName: appointment.ownerName,

    date: appointment.date,
    time: appointment.time,

    veterinarian: appointment.veterinarian,

    reason: appointment.reason,

    status: appointment.status,

    note: appointment.note || "",

    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  appointments.push(newAppointment);

  write(appointments);

  return newAppointment;
};

export const updateAppointment = (appointment) => {
  const appointments = read();

  const index = appointments.findIndex(
    (a) => a.id === appointment.id
  );

  if (index === -1) return null;

  appointments[index] = {
    ...appointments[index],
    ...appointment,
    updatedAt: new Date().toISOString(),
  };

  write(appointments);

  return appointments[index];
};

export const deleteAppointment = (id) => {
  write(read().filter((a) => a.id !== id));
};

export const getTodayAppointments = () => {
  const today = new Date().toISOString().substring(0, 10);

  return getAppointments().filter(
    (a) => a.date === today
  );
};

export const getAppointmentCount = () => {
  return read().length;
};

export const getLatestAppointments = (limit = 5) => {
  return [...getAppointments()]
    .reverse()
    .slice(0, limit);
};
export const getAppointmentsByAnimal = (animalId) =>
  getAppointments().filter(
    (a) => String(a.animalId) === String(animalId)
  );
  export const getAnimalAppointments = (animalId) => {
  return getAppointments().filter(
    (appointment) =>
      String(appointment.animalId) === String(animalId)
  );
};