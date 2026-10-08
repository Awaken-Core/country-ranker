-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'CUSTOMER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AdminPermission" AS ENUM ('MANAGE_ADMINS', 'COUNTRIES_VIEW', 'COUNTRIES_EDIT', 'VOTES_VIEW', 'VOTES_ADJUST', 'USERS_VIEW', 'USERS_MANAGE', 'AUDIT_LOGS_VIEW');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('UPVOTE', 'DOWNVOTE');

-- CreateEnum
CREATE TYPE "VoteIntentionType" AS ENUM ('FREE', 'PURCHASED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'WARNING', 'ALERT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "SponsorBillingStatus" AS ENUM ('ACTIVE', 'CANCELLED', 'EXPIRED');

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
    "userId" TEXT,
    "countryId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "logo" TEXT NOT NULL,
    "bgColor" TEXT,
    "textColor" TEXT,
    "website" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "slots" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sponsor_billing_cycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sponsorId" TEXT,
    "slotId" TEXT,
    "paymentsId" UUID,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "SponsorBillingStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsor_billing_cycle_pkey" PRIMARY KEY ("id")
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
    "upvoteUsedCount" INTEGER NOT NULL DEFAULT 0,
    "downvoteUsedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_vote_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vote_rate_limit" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL,

    CONSTRAINT "vote_rate_limit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "user_admin_permission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permission" "AdminPermission" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_admin_permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
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
CREATE UNIQUE INDEX "sponsor_userId_key" ON "sponsor"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "sponsor_billing_cycle_paymentsId_key" ON "sponsor_billing_cycle"("paymentsId");

-- CreateIndex
CREATE INDEX "sponsor_billing_cycle_sponsorId_idx" ON "sponsor_billing_cycle"("sponsorId");

-- CreateIndex
CREATE INDEX "sponsor_billing_cycle_slotId_idx" ON "sponsor_billing_cycle"("slotId");

-- CreateIndex
CREATE INDEX "sponsor_billing_cycle_slotId_startDate_endDate_idx" ON "sponsor_billing_cycle"("slotId", "startDate", "endDate");

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
CREATE INDEX "user_admin_permission_userId_idx" ON "user_admin_permission"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_admin_permission_userId_permission_key" ON "user_admin_permission"("userId", "permission");

-- CreateIndex
CREATE INDEX "audit_log_userId_idx" ON "audit_log"("userId");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE INDEX "audit_log_createdAt_idx" ON "audit_log"("createdAt" DESC);

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
ALTER TABLE "sponsor" ADD CONSTRAINT "sponsor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "slots" ADD CONSTRAINT "slots_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_billing_cycle" ADD CONSTRAINT "sponsor_billing_cycle_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "sponsor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_billing_cycle" ADD CONSTRAINT "sponsor_billing_cycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_billing_cycle" ADD CONSTRAINT "sponsor_billing_cycle_paymentsId_fkey" FOREIGN KEY ("paymentsId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sponsor_billing_cycle" ADD CONSTRAINT "sponsor_billing_cycle_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "slots"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

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
ALTER TABLE "user_admin_permission" ADD CONSTRAINT "user_admin_permission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
