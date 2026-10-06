-- CreateTable
CREATE TABLE "AiSearchUsage" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiSearchUsage_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateIndex
CREATE INDEX "AiSearchUsage_windowStart_idx" ON "AiSearchUsage"("windowStart");
