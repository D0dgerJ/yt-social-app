import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { UserRole } from '@prisma/client';
import prisma from '../infrastructure/database/prismaClient.ts';

function readEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const email = readEnv('SEED_EMAIL');
const username = readEnv('SEED_USERNAME');
const password = readEnv('SEED_PASSWORD');
const roleRaw = (process.env.SEED_ROLE ?? 'ADMIN').toUpperCase();

const role = (() => {
  if (!Object.values(UserRole).includes(roleRaw as UserRole)) {
    throw new Error(`Invalid SEED_ROLE: ${roleRaw}. Allowed: ${Object.values(UserRole).join(', ')}`);
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
  .catch(async (e) => {
    console.error('[seed:user] Failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });