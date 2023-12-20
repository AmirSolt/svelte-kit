-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('NON_AI', 'SYSTEM', 'USER', 'ASSISTANT', 'TOOL');

-- CreateEnum
CREATE TYPE "MessageDir" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "ConfigType" AS ENUM ('FREE', 'TIER_ONE');

-- CreateEnum
CREATE TYPE "Country" AS ENUM ('US', 'CA', 'UK');

-- CreateTable
CREATE TABLE "Config" (
    "id" "ConfigType" NOT NULL,
    "rating_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "total_ratings_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "price_weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sigmoid_rating_c1" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "sigmoid_total_ratings_c1" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "sigmoid_price_c1" DOUBLE PRECISION NOT NULL DEFAULT 2,
    "categorizer_system_message" TEXT NOT NULL DEFAULT 'You are a virtual assistant on facebook messenger. Help the customer with prompts. Keep your responses very short, below 200 charachters.',
    "categorizer_temperature" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "top_products_count" INTEGER NOT NULL DEFAULT 20,
    "disclaimer_repeat_message_count" INTEGER NOT NULL DEFAULT 150,
    "message_char_limit" INTEGER NOT NULL DEFAULT 250,
    "load_message_to_client_count" INTEGER NOT NULL DEFAULT 10,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fb_messenger_id" TEXT NOT NULL,
    "country_code" TEXT,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT,
    "profile_id" TEXT NOT NULL,
    "message_dir" "MessageDir" NOT NULL,
    "role" "MessageRole" NOT NULL,
    "extra_json" JSONB,
    "image_urls" TEXT[],

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "content" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Search" (
    "id" TEXT NOT NULL,
    "search_term" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "asins" TEXT[],
    "search_url" TEXT NOT NULL,
    "search_results" JSONB NOT NULL,

    CONSTRAINT "Search_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profile_fb_messenger_id_key" ON "Profile"("fb_messenger_id");

-- CreateIndex
CREATE INDEX "Profile_fb_messenger_id_idx" ON "Profile" USING HASH ("fb_messenger_id");

-- CreateIndex
CREATE INDEX "Message_created_at_idx" ON "Message"("created_at");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Search" ADD CONSTRAINT "Search_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
