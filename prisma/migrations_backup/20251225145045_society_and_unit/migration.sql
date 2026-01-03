-- CreateEnum
CREATE TYPE "SocietyType" AS ENUM ('APARTMENT', 'VILLA', 'ROW_HOUSE');

-- CreateEnum
CREATE TYPE "SocietyStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('ONE_BHK', 'TWO_BHK', 'THREE_BHK', 'FOUR_BHK', 'VILLA');

-- CreateEnum
CREATE TYPE "OwnershipType" AS ENUM ('OWNER', 'TENANT');

-- CreateEnum
CREATE TYPE "UnitStatus" AS ENUM ('OCCUPIED', 'VACANT');

-- CreateTable
CREATE TABLE "societies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "society_type" "SocietyType" NOT NULL,
    "created_by" TEXT NOT NULL,
    "status" "SocietyStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "societies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "society_id" TEXT NOT NULL,
    "building_name" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "floor_number" INTEGER,
    "unit_type" "UnitType" NOT NULL,
    "area_sq_ft" DOUBLE PRECISION,
    "ownership_type" "OwnershipType" NOT NULL,
    "status" "UnitStatus" NOT NULL DEFAULT 'OCCUPIED',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "societies_code_key" ON "societies"("code");

-- CreateIndex
CREATE INDEX "societies_created_by_idx" ON "societies"("created_by");

-- CreateIndex
CREATE INDEX "societies_code_idx" ON "societies"("code");

-- CreateIndex
CREATE INDEX "units_society_id_idx" ON "units"("society_id");

-- CreateIndex
CREATE INDEX "units_building_name_idx" ON "units"("building_name");

-- CreateIndex
CREATE UNIQUE INDEX "units_society_id_building_name_unit_number_key" ON "units"("society_id", "building_name", "unit_number");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_unit_id_fkey" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "societies" ADD CONSTRAINT "societies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_society_id_fkey" FOREIGN KEY ("society_id") REFERENCES "societies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
