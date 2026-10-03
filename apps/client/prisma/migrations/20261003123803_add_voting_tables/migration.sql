-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UPVOTE', 'DOWNVOTE');

-- CreateEnum
CREATE TYPE "VoteIntentionType" AS ENUM ('FREE', 'PURCHASED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ALERT', 'SYSTEM');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_code" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "flag" TEXT NOT NULL DEFAULT '',
    "name" TEXT NOT NULL,
    "totalUpvoteCount" BIGINT NOT NULL DEFAULT 0,
    "totalDownvoteCount" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_code_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_free_vote" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "voteType" "VoteType" NOT NULL,
    "countryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_free_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_paid_vote" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "voteType" "VoteType" NOT NULL,
    "countryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_paid_vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_log" (
    "id" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "voteType" "VoteType" NOT NULL,
    "voteIntentionType" "VoteIntentionType" NOT NULL,
    "countryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestId" TEXT,
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vote_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor" (
    "id" TEXT NOT NULL,
    "countryId" TEXT,
    "name" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "sponsorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPaymentLog" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" UUID NOT NULL,
    "purchasedAmount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserPaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "userId" TEXT NOT NULL,
    "dodoPaymentId" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "voteQuantity" INTEGER,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "paymentId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentWebhookEvent" (
    "id" UUID NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PushNotification" (
    "id" UUID NOT NULL,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PushNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_vote_usage" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "voteDate" DATE NOT NULL,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_vote_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchased_vote_grant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" UUID NOT NULL,
    "grantedVotes" INTEGER NOT NULL,
    "remainingVotes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchased_vote_grant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchased_vote_allocation" (
    "id" TEXT NOT NULL,
    "paidVoteId" TEXT NOT NULL,
    "grantId" TEXT NOT NULL,
    "count" INTEGER NOT NULL,

    CONSTRAINT "purchased_vote_allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_rate_limit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL,

    CONSTRAINT "vote_rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "country_code_code_key" ON "country_code"("code");

-- CreateIndex
CREATE UNIQUE INDEX "country_code_slug_key" ON "country_code"("slug");

-- CreateIndex
CREATE INDEX "country_code_totalUpvoteCount_id_idx" ON "country_code"("totalUpvoteCount" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "country_free_vote_voteLogId_key" ON "country_free_vote"("voteLogId");

-- CreateIndex
CREATE INDEX "country_free_vote_countryId_idx" ON "country_free_vote"("countryId");

-- CreateIndex
CREATE INDEX "country_free_vote_userId_idx" ON "country_free_vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "country_paid_vote_voteLogId_key" ON "country_paid_vote"("voteLogId");

-- CreateIndex
CREATE INDEX "country_paid_vote_countryId_idx" ON "country_paid_vote"("countryId");

-- CreateIndex
CREATE INDEX "country_paid_vote_userId_idx" ON "country_paid_vote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vote_log_requestId_key" ON "vote_log"("requestId");

-- CreateIndex
CREATE INDEX "vote_log_countryId_idx" ON "vote_log"("countryId");

-- CreateIndex
CREATE INDEX "vote_log_userId_idx" ON "vote_log"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPaymentLog_paymentId_key" ON "UserPaymentLog"("paymentId");

-- CreateIndex
CREATE INDEX "UserPaymentLog_userId_idx" ON "UserPaymentLog"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_dodoPaymentId_key" ON "Payment"("dodoPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentTransaction_paymentId_key" ON "PaymentTransaction"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentWebhookEvent_eventId_key" ON "PaymentWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "PushNotification_userId_idx" ON "PushNotification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "daily_vote_usage_userId_voteDate_key" ON "daily_vote_usage"("userId", "voteDate");

-- CreateIndex
CREATE UNIQUE INDEX "purchased_vote_grant_paymentId_key" ON "purchased_vote_grant"("paymentId");

-- CreateIndex
CREATE INDEX "purchased_vote_grant_userId_idx" ON "purchased_vote_grant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "purchased_vote_allocation_paidVoteId_grantId_key" ON "purchased_vote_allocation"("paidVoteId", "grantId");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_free_vote" ADD CONSTRAINT "country_free_vote_voteLogId_fkey" FOREIGN KEY ("voteLogId") REFERENCES "vote_log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_free_vote" ADD CONSTRAINT "country_free_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_free_vote" ADD CONSTRAINT "country_free_vote_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_paid_vote" ADD CONSTRAINT "country_paid_vote_voteLogId_fkey" FOREIGN KEY ("voteLogId") REFERENCES "vote_log"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_paid_vote" ADD CONSTRAINT "country_paid_vote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_paid_vote" ADD CONSTRAINT "country_paid_vote_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_log" ADD CONSTRAINT "vote_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vote_log" ADD CONSTRAINT "vote_log_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country_code"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "country_code"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaymentLog" ADD CONSTRAINT "UserPaymentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPaymentLog" ADD CONSTRAINT "UserPaymentLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PushNotification" ADD CONSTRAINT "PushNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_vote_usage" ADD CONSTRAINT "daily_vote_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_vote_grant" ADD CONSTRAINT "purchased_vote_grant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_vote_grant" ADD CONSTRAINT "purchased_vote_grant_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_vote_allocation" ADD CONSTRAINT "purchased_vote_allocation_paidVoteId_fkey" FOREIGN KEY ("paidVoteId") REFERENCES "country_paid_vote"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchased_vote_allocation" ADD CONSTRAINT "purchased_vote_allocation_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "purchased_vote_grant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
