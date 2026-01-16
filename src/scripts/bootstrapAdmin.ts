import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function must(name: string): string {
  const v = process.env[name];
  if (!v || !v.trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

async function bootstrapAdmin() {
  const email = must("ADMIN_EMAIL").toLowerCase().trim();
  const password = must("ADMIN_PASSWORD");
  const forceReset = (process.env.ADMIN_FORCE_RESET || "").toLowerCase() === "true";

  const passwordHash = await bcrypt.hash(password, 12);

  const existing = await prisma.user.findUnique({
    where: { email },
  });

  if (!existing) {
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        tariff: "ADMIN",
        plan: "admin",
      },
    });

    console.log(`[bootstrapAdmin] Admin user CREATED: ${email}`);
    return;
  }

  const updateData: any = {
    role: UserRole.ADMIN,
  };

  if (forceReset) {
    updateData.passwordHash = passwordHash;
  }

  await prisma.user.update({
    where: { email },
    data: updateData,
  });

  console.log(
    `[bootstrapAdmin] Admin user ensured: ${email}` +
      (forceReset ? " (password reset)" : "")
  );
}

bootstrapAdmin()
  .catch((err) => {
    console.error("[bootstrapAdmin] FAILED", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
