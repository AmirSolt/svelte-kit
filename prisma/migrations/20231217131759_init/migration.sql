/*
  Warnings:

  - You are about to drop the column `searchResults` on the `Search` table. All the data in the column will be lost.
  - Added the required column `search_results` to the `Search` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Search" DROP COLUMN "searchResults",
ADD COLUMN     "search_results" JSONB NOT NULL;
