-- CreateTable
CREATE TABLE "RideRequest" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" TIMESTAMP(3) NOT NULL,
    "tripType" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "pickupDateTime" TIMESTAMP(3) NOT NULL,
    "returnDateTime" TIMESTAMP(3),
    "partySize" INTEGER NOT NULL,
    "distanceMiles" DOUBLE PRECISION,
    "photoIdFileName" TEXT,
    "selfieFileName" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "paymentSubmittedAt" TIMESTAMP(3),
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmedAt" TIMESTAMP(3),
    "ackOnTime" BOOLEAN NOT NULL,
    "ackPayment24h" BOOLEAN NOT NULL,
    "ackCancelFee" BOOLEAN NOT NULL,

    CONSTRAINT "RideRequest_pkey" PRIMARY KEY ("id")
);
