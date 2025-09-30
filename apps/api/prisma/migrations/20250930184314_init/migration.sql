/*
  Warnings:

  - You are about to drop the column `completedAt` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `completionTokens` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `costUsd` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `errorMessage` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `latencyMs` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `promptTokens` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `responseText` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ModelRun` table. All the data in the column will be lost.
  - You are about to drop the column `prompt` on the `Session` table. All the data in the column will be lost.
  - Added the required column `cost` to the `ModelRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `output` to the `ModelRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `prompt` to the `ModelRun` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tokens` to the `ModelRun` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ModelRun" DROP COLUMN "completedAt",
DROP COLUMN "completionTokens",
DROP COLUMN "costUsd",
DROP COLUMN "errorMessage",
DROP COLUMN "latencyMs",
DROP COLUMN "promptTokens",
DROP COLUMN "provider",
DROP COLUMN "responseText",
DROP COLUMN "startedAt",
DROP COLUMN "status",
ADD COLUMN     "cost" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "output" TEXT NOT NULL,
ADD COLUMN     "prompt" TEXT NOT NULL,
ADD COLUMN     "tokens" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "prompt";
