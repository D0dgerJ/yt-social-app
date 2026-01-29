-- CreateEnum
CREATE TYPE "UserSanctionType" AS ENUM ('WARN', 'RESTRICT', 'TEMP_BAN', 'PERM_BAN');

-- CreateEnum
CREATE TYPE "UserSanctionStatus" AS ENUM ('ACTIVE', 'LIFTED', 'EXPIRED');

-- CreateTable
CREATE TABLE "UserSanction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" "UserSanctionType" NOT NULL,
    "status" "UserSanctionStatus" NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT NOT NULL,
    "message" TEXT,
    "evidence" JSONB,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "createdById" INTEGER NOT NULL,
    "liftedById" INTEGER,
    "liftedAt" TIMESTAMP(3),
    "liftReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSanction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserSanction_userId_status_idx" ON "UserSanction"("userId", "status");

-- CreateIndex
CREATE INDEX "UserSanction_status_endsAt_idx" ON "UserSanction"("status", "endsAt");

-- AddForeignKey
ALTER TABLE "UserSanction" ADD CONSTRAINT "UserSanction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSanction" ADD CONSTRAINT "UserSanction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSanction" ADD CONSTRAINT "UserSanction_liftedById_fkey" FOREIGN KEY ("liftedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
