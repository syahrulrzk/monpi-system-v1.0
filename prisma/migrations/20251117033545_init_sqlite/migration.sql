-- CreateTable
CREATE TABLE "system_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "systemHealth" REAL NOT NULL DEFAULT 100.0,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "errorRate" REAL NOT NULL DEFAULT 0.0,
    "avgResponseTime" INTEGER NOT NULL DEFAULT 0,
    "serverStatus" TEXT NOT NULL DEFAULT 'Online',
    "serverLatency" INTEGER NOT NULL DEFAULT 0,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "api_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'healthy',
    "lastCheck" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "system_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "performance_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requests" INTEGER NOT NULL DEFAULT 0,
    "responseTime" INTEGER NOT NULL DEFAULT 0,
    "endpointId" TEXT
);

-- CreateTable
CREATE TABLE "request_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpointId" TEXT NOT NULL,
    "totalRequests" INTEGER NOT NULL DEFAULT 0,
    "hourlyRequests" JSONB NOT NULL DEFAULT [],
    "lastReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCheck" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "time_range_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "endpointId" TEXT NOT NULL,
    "1d" INTEGER NOT NULL DEFAULT 0,
    "3d" INTEGER NOT NULL DEFAULT 0,
    "7d" INTEGER NOT NULL DEFAULT 0,
    "14d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "request_data_endpointId_key" ON "request_data"("endpointId");

-- CreateIndex
CREATE UNIQUE INDEX "time_range_data_endpointId_key" ON "time_range_data"("endpointId");
