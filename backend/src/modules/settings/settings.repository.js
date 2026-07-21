const prisma = require("../../prisma/client");

const DEFAULT_ID = "default";

async function get() {
  return prisma.settings.findUnique({ where: { id: DEFAULT_ID } });
}

async function upsert(data) {
  return prisma.settings.upsert({
    where: { id: DEFAULT_ID },
    create: { id: DEFAULT_ID, data },
    update: { data },
  });
}

module.exports = { get, upsert, DEFAULT_ID };
