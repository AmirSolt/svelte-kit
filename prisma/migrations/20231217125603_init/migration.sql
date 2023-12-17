/*
  Warnings:

  - Added the required column `searchResults` to the `Search` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Search" ADD COLUMN     "searchResults" JSONB NOT NULL;
