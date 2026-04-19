-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "citext";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BROKER', 'LEGAL', 'SECRETARY');

-- CreateEnum
CREATE TYPE "BrokerCategory" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "BrokerApprovalStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'DENIED', 'INCOMPLETE', 'CRECI_INVALID');

-- CreateEnum
CREATE TYPE "CreciStatus" AS ENUM ('NOT_VERIFIED', 'VALID', 'INVALID');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_CONTACT', 'QUALIFIED', 'VISIT_SCHEDULED', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "ConversationStatus" AS ENUM ('OPEN', 'PAUSED', 'CLOSED');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('IN', 'OUT');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'AUDIO', 'IMAGE', 'VIDEO', 'SYSTEM');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'RESERVED', 'SOLD', 'OFF_MARKET');

-- CreateEnum
CREATE TYPE "StructureType" AS ENUM ('PLANE', 'VEHICLE', 'APARTMENT', 'ACCOMPANIED_VISIT');

-- CreateEnum
CREATE TYPE "StructureStatus" AS ENUM ('REQUESTED', 'REVIEWING', 'APPROVED', 'DENIED', 'RESCHEDULE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('SCHEDULED', 'CONFIRMED', 'REALIZED', 'NO_SHOW', 'RESCHEDULED');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'IN_LEGAL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LegalStatus" AS ENUM ('RECEIVED', 'REVIEWING', 'DOCS_PENDING', 'DRAFTING', 'READY_TO_SIGN', 'COMPLETED');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'PAID', 'BLOCKED');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('IN_APP', 'WHATSAPP', 'EMAIL');

-- CreateEnum
CREATE TYPE "WebhookStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadAssignmentEventType" AS ENUM ('ASSIGNED', 'REASSIGNED', 'UNASSIGNED', 'RETURNED', 'BLOCKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cpf" TEXT,
    "phone" TEXT,
    "role" "Role" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerApplication" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" CITEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "rg" TEXT NOT NULL,
    "creci" TEXT NOT NULL,
    "creciState" VARCHAR(2) NOT NULL,
    "city" TEXT NOT NULL,
    "currentAgency" TEXT,
    "yearsMarket" INTEGER,
    "instagram" TEXT,
    "credentialFileUrl" TEXT NOT NULL,
    "notes" TEXT,
    "status" "BrokerApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNotes" TEXT,
    "creciValidated" "CreciStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "creciNotes" TEXT,
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "deniedReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "BrokerApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Broker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,
    "category" "BrokerCategory" NOT NULL DEFAULT 'BRONZE',
    "creci" TEXT NOT NULL,
    "creciState" VARCHAR(2) NOT NULL,
    "creciStatus" "CreciStatus" NOT NULL DEFAULT 'NOT_VERIFIED',
    "creciValidatedById" TEXT,
    "creciValidatedAt" TIMESTAMP(3),
    "creciNotes" TEXT,
    "city" TEXT NOT NULL,
    "currentAgency" TEXT,
    "yearsMarket" INTEGER,
    "instagram" TEXT,
    "approvalStatus" "BrokerApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "hasAcceptedTerm" BOOLEAN NOT NULL DEFAULT false,
    "welcomeVideoWatched" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Broker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "contentHtml" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TermVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TermAcceptance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "termVersionId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,

    CONSTRAINT "TermAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "maskedName" TEXT NOT NULL,
    "phoneEncrypted" BYTEA NOT NULL,
    "phoneMasked" TEXT NOT NULL,
    "phoneHash" TEXT NOT NULL,
    "email" CITEXT,
    "source" TEXT NOT NULL,
    "channel" TEXT,
    "stage" TEXT,
    "city" TEXT,
    "budgetRange" TEXT,
    "interestType" TEXT,
    "legalBasis" TEXT NOT NULL DEFAULT 'legitimate_interest',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "assignedBrokerId" TEXT,
    "assignedAt" TIMESTAMP(3),
    "notes" TEXT,
    "externalContactId" TEXT,
    "externalSource" TEXT,
    "campaign" TEXT,
    "campaignId" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "idempotencyKey" TEXT,
    "webhookLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDistribution" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "distributionDate" DATE NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "LeadDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadDistributionRule" (
    "id" TEXT NOT NULL,
    "category" "BrokerCategory" NOT NULL,
    "leadsPerDay" INTEGER NOT NULL,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeadDistributionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "status" "ConversationStatus" NOT NULL DEFAULT 'OPEN',
    "vaiAccountId" TEXT,
    "externalConversationId" TEXT,
    "externalContactId" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "externalMessageId" TEXT,
    "direction" "MessageDirection" NOT NULL,
    "type" "MessageType" NOT NULL,
    "contentText" TEXT,
    "mediaUrl" TEXT,
    "mediaMimeType" TEXT,
    "mediaSizeBytes" INTEGER,
    "senderUserId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "addressFull" TEXT,
    "price" DECIMAL(14,2) NOT NULL,
    "commissionPct" DECIMAL(5,2) NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
    "type" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "parkingSpots" INTEGER,
    "areaM2" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyMedia" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "caption" TEXT,

    CONSTRAINT "PropertyMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecialProperty" (
    "propertyId" TEXT NOT NULL,
    "specialCommissionPct" DECIMAL(5,2) NOT NULL,
    "partnerName" TEXT,
    "specialCondition" TEXT,
    "isOpenToAll" BOOLEAN NOT NULL DEFAULT true,
    "activeFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activeUntil" TIMESTAMP(3),

    CONSTRAINT "SpecialProperty_pkey" PRIMARY KEY ("propertyId")
);

-- CreateTable
CREATE TABLE "SpecialPropertyEligibility" (
    "specialPropertyId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,

    CONSTRAINT "SpecialPropertyEligibility_pkey" PRIMARY KEY ("specialPropertyId","brokerId")
);

-- CreateTable
CREATE TABLE "StructureRequest" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "leadId" TEXT,
    "propertyId" TEXT,
    "type" "StructureType" NOT NULL,
    "requestedDate" DATE NOT NULL,
    "requestedTime" VARCHAR(5),
    "city" TEXT NOT NULL,
    "justification" TEXT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "status" "StructureStatus" NOT NULL DEFAULT 'REQUESTED',
    "adminResponse" TEXT,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StructureRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "VisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "adminConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "adminConfirmedById" TEXT,
    "adminConfirmedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "saleValue" DECIMAL(14,2) NOT NULL,
    "negotiationType" TEXT NOT NULL,
    "clientDataEncrypted" BYTEA NOT NULL,
    "notes" TEXT,
    "status" "SaleStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleDocument" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "status" "LegalStatus" NOT NULL DEFAULT 'RECEIVED',
    "legalNotes" TEXT,
    "assignedToId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "grossValue" DECIMAL(14,2) NOT NULL,
    "netValue" DECIMAL(14,2) NOT NULL,
    "status" "CommissionStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" DATE,
    "paidAt" TIMESTAMP(3),
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookInboundLog" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "headers" JSONB,
    "signature" TEXT,
    "ipAddress" TEXT,
    "idempotencyKey" TEXT,
    "status" "WebhookStatus" NOT NULL DEFAULT 'RECEIVED',
    "processedAt" TIMESTAMP(3),
    "errorMessage" TEXT,
    "resultingLeadId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookInboundLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadAssignmentEvent" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "brokerId" TEXT,
    "event" "LeadAssignmentEventType" NOT NULL,
    "reason" TEXT,
    "actorUserId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadAssignmentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VaiAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "apiTokenEncrypted" BYTEA NOT NULL,
    "webhookSecret" TEXT NOT NULL,
    "senderPhone" TEXT,
    "baseUrl" TEXT NOT NULL DEFAULT 'https://api.vaicrm.com.br',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaiAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "channels" "NotificationChannel"[] DEFAULT ARRAY['IN_APP']::"NotificationChannel"[],
    "readAt" TIMESTAMP(3),
    "whatsappDeliveredAt" TIMESTAMP(3),
    "whatsappError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_cpf_key" ON "User"("cpf");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "BrokerApplication_status_submittedAt_idx" ON "BrokerApplication"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "BrokerApplication_email_idx" ON "BrokerApplication"("email");

-- CreateIndex
CREATE INDEX "BrokerApplication_cpf_idx" ON "BrokerApplication"("cpf");

-- CreateIndex
CREATE INDEX "BrokerApplication_creci_idx" ON "BrokerApplication"("creci");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_userId_key" ON "Broker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Broker_applicationId_key" ON "Broker"("applicationId");

-- CreateIndex
CREATE INDEX "Broker_category_approvalStatus_idx" ON "Broker"("category", "approvalStatus");

-- CreateIndex
CREATE INDEX "Broker_creciStatus_idx" ON "Broker"("creciStatus");

-- CreateIndex
CREATE UNIQUE INDEX "TermVersion_version_key" ON "TermVersion"("version");

-- CreateIndex
CREATE INDEX "TermVersion_isCurrent_idx" ON "TermVersion"("isCurrent");

-- CreateIndex
CREATE INDEX "TermAcceptance_acceptedAt_idx" ON "TermAcceptance"("acceptedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TermAcceptance_userId_termVersionId_key" ON "TermAcceptance"("userId", "termVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_idempotencyKey_key" ON "Lead"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Lead_assignedBrokerId_status_idx" ON "Lead"("assignedBrokerId", "status");

-- CreateIndex
CREATE INDEX "Lead_phoneHash_idx" ON "Lead"("phoneHash");

-- CreateIndex
CREATE INDEX "Lead_externalContactId_idx" ON "Lead"("externalContactId");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

-- CreateIndex
CREATE INDEX "LeadDistribution_brokerId_distributionDate_idx" ON "LeadDistribution"("brokerId", "distributionDate");

-- CreateIndex
CREATE UNIQUE INDEX "LeadDistribution_leadId_brokerId_key" ON "LeadDistribution"("leadId", "brokerId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadDistributionRule_category_key" ON "LeadDistributionRule"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_externalConversationId_key" ON "Conversation"("externalConversationId");

-- CreateIndex
CREATE INDEX "Conversation_brokerId_lastMessageAt_idx" ON "Conversation"("brokerId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "Conversation_externalConversationId_idx" ON "Conversation"("externalConversationId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_leadId_brokerId_key" ON "Conversation"("leadId", "brokerId");

-- CreateIndex
CREATE UNIQUE INDEX "Message_externalMessageId_key" ON "Message"("externalMessageId");

-- CreateIndex
CREATE INDEX "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Property_code_key" ON "Property"("code");

-- CreateIndex
CREATE INDEX "Property_status_city_idx" ON "Property"("status", "city");

-- CreateIndex
CREATE INDEX "PropertyMedia_propertyId_position_idx" ON "PropertyMedia"("propertyId", "position");

-- CreateIndex
CREATE INDEX "StructureRequest_status_createdAt_idx" ON "StructureRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "StructureRequest_brokerId_status_idx" ON "StructureRequest"("brokerId", "status");

-- CreateIndex
CREATE INDEX "Visit_brokerId_scheduledAt_idx" ON "Visit"("brokerId", "scheduledAt");

-- CreateIndex
CREATE INDEX "Visit_status_idx" ON "Visit"("status");

-- CreateIndex
CREATE INDEX "Sale_brokerId_status_idx" ON "Sale"("brokerId", "status");

-- CreateIndex
CREATE INDEX "Sale_status_submittedAt_idx" ON "Sale"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "SaleDocument_saleId_idx" ON "SaleDocument"("saleId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalCase_saleId_key" ON "LegalCase"("saleId");

-- CreateIndex
CREATE INDEX "LegalCase_status_receivedAt_idx" ON "LegalCase"("status", "receivedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Commission_saleId_key" ON "Commission"("saleId");

-- CreateIndex
CREATE INDEX "Commission_brokerId_status_idx" ON "Commission"("brokerId", "status");

-- CreateIndex
CREATE INDEX "Commission_status_dueDate_idx" ON "Commission"("status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookInboundLog_idempotencyKey_key" ON "WebhookInboundLog"("idempotencyKey");

-- CreateIndex
CREATE INDEX "WebhookInboundLog_source_receivedAt_idx" ON "WebhookInboundLog"("source", "receivedAt");

-- CreateIndex
CREATE INDEX "WebhookInboundLog_status_receivedAt_idx" ON "WebhookInboundLog"("status", "receivedAt");

-- CreateIndex
CREATE INDEX "LeadAssignmentEvent_leadId_occurredAt_idx" ON "LeadAssignmentEvent"("leadId", "occurredAt");

-- CreateIndex
CREATE INDEX "LeadAssignmentEvent_brokerId_occurredAt_idx" ON "LeadAssignmentEvent"("brokerId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "VaiAccount_instanceId_key" ON "VaiAccount"("instanceId");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_actorUserId_occurredAt_idx" ON "AuditEvent"("actorUserId", "occurredAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditEvent_occurredAt_idx" ON "AuditEvent"("occurredAt");

-- AddForeignKey
ALTER TABLE "BrokerApplication" ADD CONSTRAINT "BrokerApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "BrokerApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Broker" ADD CONSTRAINT "Broker_creciValidatedById_fkey" FOREIGN KEY ("creciValidatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermAcceptance" ADD CONSTRAINT "TermAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TermAcceptance" ADD CONSTRAINT "TermAcceptance_termVersionId_fkey" FOREIGN KEY ("termVersionId") REFERENCES "TermVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_assignedBrokerId_fkey" FOREIGN KEY ("assignedBrokerId") REFERENCES "Broker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_webhookLogId_fkey" FOREIGN KEY ("webhookLogId") REFERENCES "WebhookInboundLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadDistribution" ADD CONSTRAINT "LeadDistribution_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_vaiAccountId_fkey" FOREIGN KEY ("vaiAccountId") REFERENCES "VaiAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyMedia" ADD CONSTRAINT "PropertyMedia_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialProperty" ADD CONSTRAINT "SpecialProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialPropertyEligibility" ADD CONSTRAINT "SpecialPropertyEligibility_specialPropertyId_fkey" FOREIGN KEY ("specialPropertyId") REFERENCES "SpecialProperty"("propertyId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecialPropertyEligibility" ADD CONSTRAINT "SpecialPropertyEligibility_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureRequest" ADD CONSTRAINT "StructureRequest_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureRequest" ADD CONSTRAINT "StructureRequest_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureRequest" ADD CONSTRAINT "StructureRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StructureRequest" ADD CONSTRAINT "StructureRequest_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_adminConfirmedById_fkey" FOREIGN KEY ("adminConfirmedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleDocument" ADD CONSTRAINT "SaleDocument_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCase" ADD CONSTRAINT "LegalCase_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCase" ADD CONSTRAINT "LegalCase_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "Broker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadAssignmentEvent" ADD CONSTRAINT "LeadAssignmentEvent_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Auditoria imutável: bloquear UPDATE e DELETE em audit_events
-- =============================================================================
-- Execute APÓS `prisma migrate deploy` gerar a tabela AuditEvent.
-- Em Vercel Postgres/Neon/Supabase: rode manualmente via psql ou dashboard SQL.

CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_events is immutable: % operation blocked', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_events_no_update ON "AuditEvent";
CREATE TRIGGER audit_events_no_update
  BEFORE UPDATE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

DROP TRIGGER IF EXISTS audit_events_no_delete ON "AuditEvent";
CREATE TRIGGER audit_events_no_delete
  BEFORE DELETE ON "AuditEvent"
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- =============================================================================
-- Helpers de criptografia para phone/client data (pgcrypto)
-- =============================================================================
-- Uso a partir da aplicação:
--   INSERT lead (phone_encrypted) VALUES (pgp_sym_encrypt($1, current_setting('app.enc_key')))
--   SELECT pgp_sym_decrypt(phone_encrypted, current_setting('app.enc_key'))
-- Em produção, passar DATA_ENCRYPTION_KEY via SET LOCAL app.enc_key dentro da transação.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
-- Seed SQL: usuários iniciais (senha: Calebe@2026!)

INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt") VALUES ('90685663-26c6-4c57-8474-e732f7f38825', 'adm@calebe.com.br', '$2a$12$VWmorrV.wknzZugLvEj8qe2cXbPZeZcmHPsbpODBTBFXsaySw6Xce', 'Administrador Calebe', 'ADMIN', NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET role='ADMIN', name='Administrador Calebe';
INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt") VALUES ('a6d27e92-c4dd-4b03-80aa-121280f2d484', 'corretor@calebe.com.br', '$2a$12$VWmorrV.wknzZugLvEj8qe2cXbPZeZcmHPsbpODBTBFXsaySw6Xce', 'Corretor Calebe', 'BROKER', NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET role='BROKER', name='Corretor Calebe';
INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt") VALUES ('c2a5a2a6-f0fa-42ab-82d7-ec9e827a4ff1', 'juridico@calebe.com.br', '$2a$12$VWmorrV.wknzZugLvEj8qe2cXbPZeZcmHPsbpODBTBFXsaySw6Xce', 'Jurídico Calebe', 'LEGAL', NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET role='LEGAL', name='Jurídico Calebe';
INSERT INTO "User" (id, email, "passwordHash", name, role, "createdAt", "updatedAt") VALUES ('72924b45-8d2c-4a9c-82a3-a32ca0104731', 'secretaria@calebe.com.br', '$2a$12$VWmorrV.wknzZugLvEj8qe2cXbPZeZcmHPsbpODBTBFXsaySw6Xce', 'Secretaria Calebe', 'SECRETARY', NOW(), NOW()) ON CONFLICT (email) DO UPDATE SET role='SECRETARY', name='Secretaria Calebe';

INSERT INTO "Broker" (id, "userId", creci, "creciState", city, category, "hasAcceptedTerm", "createdAt", "updatedAt") SELECT '8065129e-830d-4b8b-bddb-5e13b2efc70f', id, '0000', 'SC', 'Itapema', 'GOLD', false, NOW(), NOW() FROM "User" WHERE email='corretor@calebe.com.br' ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "LeadDistributionRule" (id, category, "leadsPerDay", "isActive", "updatedAt") VALUES ('bc7ec346-e5c1-4e02-9241-230b225ddee3', 'BRONZE', 1, true, NOW()) ON CONFLICT (category) DO UPDATE SET "leadsPerDay"=1, "isActive"=true;
INSERT INTO "LeadDistributionRule" (id, category, "leadsPerDay", "isActive", "updatedAt") VALUES ('c436a7de-69d0-4952-967d-d163dbbdb8f0', 'SILVER', 2, true, NOW()) ON CONFLICT (category) DO UPDATE SET "leadsPerDay"=2, "isActive"=true;
INSERT INTO "LeadDistributionRule" (id, category, "leadsPerDay", "isActive", "updatedAt") VALUES ('6647d3b1-33eb-4589-8cb8-952118fb1567', 'GOLD', 3, true, NOW()) ON CONFLICT (category) DO UPDATE SET "leadsPerDay"=3, "isActive"=true;
INSERT INTO "LeadDistributionRule" (id, category, "leadsPerDay", "isActive", "updatedAt") VALUES ('114c897a-e9d2-40e9-9433-dd3619ceabb2', 'DIAMOND', 5, true, NOW()) ON CONFLICT (category) DO UPDATE SET "leadsPerDay"=5, "isActive"=true;

INSERT INTO "TermVersion" (id, version, title, "contentHtml", "isCurrent", "createdAt") VALUES ('127dd8db-1f8d-4c46-b24d-66caa50d42c2', '1.0.0', 'Termo de Adesão do Corretor Afiliado Calebe', '<h2>Termo de Adesão — Corretor Afiliado Calebe</h2><ol><li>Os leads distribuídos pertencem operacionalmente à Calebe.</li><li>Toda interação é registrada e auditada.</li><li>É vedada a tentativa de obter o telefone real do cliente fora da plataforma.</li><li>O corretor compromete-se a seguir o processo oficial.</li><li>Violações implicam em desligamento imediato e responsabilização legal.</li></ol>', true, NOW()) ON CONFLICT (version) DO UPDATE SET "isCurrent"=true;

INSERT INTO "SystemSetting" (key, value, description, "updatedAt") VALUES ('onboarding.welcome_video_url', '""'::jsonb, 'URL do vídeo de boas-vindas no primeiro login.', NOW()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "SystemSetting" (key, value, description, "updatedAt") VALUES ('broker.default_category', '"BRONZE"'::jsonb, 'Categoria default para corretor recém-aprovado.', NOW()) ON CONFLICT (key) DO NOTHING;
INSERT INTO "SystemSetting" (key, value, description, "updatedAt") VALUES ('lead.distribution.algorithm', '"round_robin_category"'::jsonb, 'Algoritmo de distribuição de leads.', NOW()) ON CONFLICT (key) DO NOTHING;
