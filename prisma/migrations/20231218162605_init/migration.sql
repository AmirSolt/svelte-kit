/*
  Warnings:

  - Added the required column `search_url` to the `Search` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Search" ADD COLUMN     "search_url" TEXT NOT NULL;
