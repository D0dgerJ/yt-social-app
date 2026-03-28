import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";
import prisma from "../infrastructure/database/prismaClient.ts";
import { env } from "../config/env.ts";

function requireSeedValue(name: "SEED_EMAIL" | "SEED_USERNAME" | "SEED_PASSWORD") {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

const email = requireSeedValue("SEED_EMAIL");
const username = requireSeedValue("SEED_USERNAME");
const password = requireSeedValue("SEED_PASSWORD");
const roleRaw = (env.SEED_ROLE ?? "ADMIN").toUpperCase();

const role = (() => {
  if (!Object.values(UserRole).includes(roleRaw as UserRole)) {
    throw new Error(
      `Invalid SEED_ROLE: ${roleRaw}. Allowed: ${Object.values(UserRole).join(", ")}`
    );
  }

  return roleRaw as UserRole;
})();

async function main() {
  const passwordHash = await bcrypt.hash(password, 10);

  const existingByEmail = await prisma.user.findUnique({ where: { email } });
  const existingByUsername = await prisma.user.findUnique({ where: { username } });

  const existing = existingByEmail ?? existingByUsername;

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        username,
        password: passwordHash,
        role,
      },
    });

    console.log(
      `[seed:user] Updated user id=${existing.id} email=${email} username=${username} role=${role}`
    );
    return;
  }

  const created = await prisma.user.create({
    data: {
      email,
      username,
      password: passwordHash,
      role,
    },
  });

  console.log(
    `[seed:user] Created user id=${created.id} email=${email} username=${username} role=${role}`
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("[seed:user] Failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });