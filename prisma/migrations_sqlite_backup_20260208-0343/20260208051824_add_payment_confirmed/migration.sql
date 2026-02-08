-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RideRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "fullName" TEXT NOT NULL,
    "dob" DATETIME NOT NULL,
    "tripType" TEXT NOT NULL,
    "pickupAddress" TEXT NOT NULL,
    "destinationAddress" TEXT NOT NULL,
    "pickupDateTime" DATETIME NOT NULL,
    "returnDateTime" DATETIME,
    "partySize" INTEGER NOT NULL,
    "distanceMiles" REAL,
    "photoIdFileName" TEXT,
    "selfieFileName" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentSubmitted" BOOLEAN NOT NULL DEFAULT false,
    "paymentSubmittedAt" DATETIME,
    "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "paymentConfirmedAt" DATETIME,
    "ackOnTime" BOOLEAN NOT NULL,
    "ackPayment24h" BOOLEAN NOT NULL,
    "ackCancelFee" BOOLEAN NOT NULL
);
INSERT INTO "new_RideRequest" ("ackCancelFee", "ackOnTime", "ackPayment24h", "createdAt", "destinationAddress", "distanceMiles", "dob", "fullName", "id", "partySize", "paymentMethod", "paymentSubmitted", "paymentSubmittedAt", "photoIdFileName", "pickupAddress", "pickupDateTime", "returnDateTime", "selfieFileName", "tripType", "updatedAt") SELECT "ackCancelFee", "ackOnTime", "ackPayment24h", "createdAt", "destinationAddress", "distanceMiles", "dob", "fullName", "id", "partySize", "paymentMethod", "paymentSubmitted", "paymentSubmittedAt", "photoIdFileName", "pickupAddress", "pickupDateTime", "returnDateTime", "selfieFileName", "tripType", "updatedAt" FROM "RideRequest";
DROP TABLE "RideRequest";
ALTER TABLE "new_RideRequest" RENAME TO "RideRequest";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
