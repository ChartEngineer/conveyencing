-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('SOLO', 'PRACTICE', 'FIRM');

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL DEFAULT 'SOLO',
    "seats" INTEGER NOT NULL DEFAULT 1,
    "trialEndsAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "aiCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "aiCreditsLimit" INTEGER NOT NULL DEFAULT 20,
    "docCreditsUsed" INTEGER NOT NULL DEFAULT 0,
    "docCreditsLimit" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);
