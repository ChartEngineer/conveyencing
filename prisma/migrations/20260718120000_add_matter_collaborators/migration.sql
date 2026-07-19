-- AlterEnum
ALTER TYPE "StaffRole" ADD VALUE 'COLLABORATOR';

-- CreateEnum
CREATE TYPE "CollaboratorRole" AS ENUM ('OPPOSING_COUNSEL', 'BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "CollaboratorStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED');

-- CreateTable
CREATE TABLE "MatterCollaborator" (
    "id" TEXT NOT NULL,
    "matterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL,
    "status" "CollaboratorStatus" NOT NULL DEFAULT 'PENDING',
    "inviteToken" TEXT NOT NULL,
    "inviteTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MatterCollaborator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MatterCollaborator_inviteToken_key" ON "MatterCollaborator"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "MatterCollaborator_matterId_email_key" ON "MatterCollaborator"("matterId", "email");

-- AddForeignKey
ALTER TABLE "MatterCollaborator" ADD CONSTRAINT "MatterCollaborator_matterId_fkey" FOREIGN KEY ("matterId") REFERENCES "Matter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterCollaborator" ADD CONSTRAINT "MatterCollaborator_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatterCollaborator" ADD CONSTRAINT "MatterCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
