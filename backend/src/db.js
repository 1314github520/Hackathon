const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { createSeedData } = require("./seed");

const dataDir = path.join(__dirname, "..", "data");
const dbFilePath = path.join(dataDir, "db.json");
const uploadsDir = path.join(__dirname, "..", "uploads");
const DATABASE_PROVIDER = String(process.env.DATABASE_PROVIDER || "json").trim().toLowerCase();

let prisma = null;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

function normalizeDbShape(data = {}) {
  return {
    users: Array.isArray(data.users) ? data.users : [],
    sessions: Array.isArray(data.sessions) ? data.sessions : [],
    aircraft: Array.isArray(data.aircraft) ? data.aircraft : [],
    events: Array.isArray(data.events) ? data.events : [],
    persons: Array.isArray(data.persons) ? data.persons : [],
    favorites: Array.isArray(data.favorites) ? data.favorites : [],
    browsingHistory: Array.isArray(data.browsingHistory) ? data.browsingHistory : [],
    approvalWorkflows: Array.isArray(data.approvalWorkflows) ? data.approvalWorkflows : [],
    approvalTasks: Array.isArray(data.approvalTasks) ? data.approvalTasks : [],
    reviewComments: Array.isArray(data.reviewComments) ? data.reviewComments : [],
    auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs : [],
    contentRevisions: Array.isArray(data.contentRevisions) ? data.contentRevisions : []
  };
}

async function ensureJsonStorage() {
  await fs.promises.mkdir(dataDir, { recursive: true });

  try {
    await fs.promises.access(dbFilePath);
  } catch {
    const seedData = createSeedData();
    await fs.promises.writeFile(dbFilePath, JSON.stringify(seedData, null, 2), "utf8");
  }
}

async function ensureStorage() {
  await fs.promises.mkdir(uploadsDir, { recursive: true });

  if (DATABASE_PROVIDER === "mysql") {
    await getPrismaClient().$connect();
    return;
  }

  await ensureJsonStorage();
}

async function readJsonDb() {
  await ensureJsonStorage();
  const raw = await fs.promises.readFile(dbFilePath, "utf8");
  return normalizeDbShape(JSON.parse(raw));
}

async function readMysqlDb() {
  const client = getPrismaClient();
  const [
    users,
    sessions,
    aircraft,
    events,
    persons,
    favorites,
    browsingHistory,
    approvalWorkflows,
    approvalTasks,
    reviewComments,
    auditLogs,
    contentRevisions
  ] = await Promise.all([
    client.user.findMany({ orderBy: { createdAt: "asc" } }),
    client.session.findMany({ orderBy: { createdAt: "asc" } }),
    client.aircraft.findMany({ orderBy: { createdAt: "desc" } }),
    client.event.findMany({ orderBy: { createdAt: "desc" } }),
    client.person.findMany({ orderBy: { createdAt: "desc" } }),
    client.favorite.findMany({ orderBy: { createdAt: "desc" } }),
    client.browsingHistory.findMany({ orderBy: { lastViewedAt: "desc" } }),
    client.approvalWorkflow.findMany({ orderBy: { submittedAt: "desc" } }),
    client.approvalTask.findMany({ orderBy: { createdAt: "desc" } }),
    client.reviewComment.findMany({ orderBy: { createdAt: "desc" } }),
    client.auditLog.findMany({ orderBy: { createdAt: "desc" } }),
    client.contentRevision.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  return normalizeDbShape({
    users,
    sessions,
    aircraft,
    events,
    persons,
    favorites,
    browsingHistory,
    approvalWorkflows,
    approvalTasks,
    reviewComments,
    auditLogs,
    contentRevisions
  });
}

async function readDb() {
  await ensureStorage();

  if (DATABASE_PROVIDER === "mysql") {
    return readMysqlDb();
  }

  return readJsonDb();
}

function mapAircraftForDb(item) {
  return {
    id: item.id,
    slug: item.slug,
    nameZh: item.nameZh || "",
    nameEn: item.nameEn || "",
    aircraftType: item.aircraftType || "",
    manufacturer: item.manufacturer || "",
    countryOfOrigin: item.countryOfOrigin || "",
    eraLabel: item.eraLabel || "",
    firstFlightYear: item.firstFlightYear || null,
    firstFlightDate: item.firstFlightDate || null,
    serviceEntryDate: item.serviceEntryDate || null,
    status: item.status || "draft",
    summary: item.summary || "",
    description: item.description || "",
    source: item.source || "",
    sourceUrl: item.sourceUrl || "",
    specSourceConfidence: item.specSourceConfidence || "to_confirm",
    coverImage: item.coverImage || "",
    specs: item.specs || {},
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapEventForDb(item) {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title || "",
    eventType: item.eventType || "",
    eventDate: item.eventDate || null,
    locationName: item.locationName || "",
    summary: item.summary || "",
    description: item.description || "",
    impact: item.impact || "",
    relatedAircraftIds: item.relatedAircraftIds || [],
    relatedPersonIds: item.relatedPersonIds || [],
    status: item.status || "draft",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

function mapPersonForDb(item) {
  return {
    id: item.id,
    slug: item.slug,
    nameZh: item.nameZh || "",
    nameEn: item.nameEn || "",
    personType: item.personType || "",
    nationality: item.nationality || "",
    summary: item.summary || "",
    biography: item.biography || "",
    relatedAircraftIds: item.relatedAircraftIds || [],
    relatedEventIds: item.relatedEventIds || [],
    status: item.status || "draft",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt
  };
}

async function insertSequentially(delegate, items, mapper = (item) => item) {
  for (const item of items) {
    await delegate.create({
      data: mapper(item)
    });
  }
}

async function persistSnapshotToMysql(data) {
  const snapshot = normalizeDbShape(data);
  const client = getPrismaClient();

  await client.$transaction(async (tx) => {
    await tx.reviewComment.deleteMany();
    await tx.approvalTask.deleteMany();
    await tx.approvalWorkflow.deleteMany();
    await tx.contentRevision.deleteMany();
    await tx.auditLog.deleteMany();
    await tx.favorite.deleteMany();
    await tx.browsingHistory.deleteMany();
    await tx.session.deleteMany();
    await tx.event.deleteMany();
    await tx.person.deleteMany();
    await tx.aircraft.deleteMany();
    await tx.user.deleteMany();

    await insertSequentially(tx.user, snapshot.users, (item) => ({
      id: item.id,
      username: item.username,
      passwordHash: item.passwordHash,
      userType: item.userType,
      status: item.status,
      nickname: item.nickname || "",
      email: item.email || "",
      phone: item.phone || "",
      avatarUrl: item.avatarUrl || "",
      lastLoginAt: item.lastLoginAt || null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    }));

    await insertSequentially(tx.session, snapshot.sessions, (item) => ({
      id: item.id,
      userId: item.userId,
      userType: item.userType,
      accessToken: item.accessToken,
      refreshToken: item.refreshToken,
      createdAt: item.createdAt,
      expiresAt: item.expiresAt,
      refreshExpiresAt: item.refreshExpiresAt,
      revokedAt: item.revokedAt || null
    }));

    await insertSequentially(tx.aircraft, snapshot.aircraft, mapAircraftForDb);
    await insertSequentially(tx.event, snapshot.events, mapEventForDb);
    await insertSequentially(tx.person, snapshot.persons, mapPersonForDb);

    await insertSequentially(tx.favorite, snapshot.favorites, (item) => ({
      id: item.id,
      userId: item.userId,
      entityType: item.entityType,
      entityId: item.entityId,
      createdAt: item.createdAt
    }));

    await insertSequentially(tx.browsingHistory, snapshot.browsingHistory, (item) => ({
      id: item.id,
      userId: item.userId,
      entityType: item.entityType,
      entityId: item.entityId,
      viewCount: Number(item.viewCount || 0),
      firstViewedAt: item.firstViewedAt,
      lastViewedAt: item.lastViewedAt
    }));

    await insertSequentially(tx.approvalWorkflow, snapshot.approvalWorkflows, (item) => ({
      id: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      revisionId: item.revisionId || null,
      submitterId: item.submitterId,
      currentReviewerId: item.currentReviewerId,
      workflowStatus: item.workflowStatus,
      submittedAt: item.submittedAt,
      completedAt: item.completedAt || null
    }));

    await insertSequentially(tx.approvalTask, snapshot.approvalTasks, (item) => ({
      id: item.id,
      workflowId: item.workflowId,
      reviewerId: item.reviewerId,
      taskStatus: item.taskStatus,
      decision: item.decision,
      processedAt: item.processedAt || null,
      createdAt: item.createdAt
    }));

    await insertSequentially(tx.reviewComment, snapshot.reviewComments, (item) => ({
      id: item.id,
      workflowId: item.workflowId,
      reviewerId: item.reviewerId,
      comment: item.comment,
      createdAt: item.createdAt
    }));

    await insertSequentially(tx.auditLog, snapshot.auditLogs, (item) => ({
      id: item.id,
      createdAt: item.createdAt,
      operatorId: item.operatorId,
      operatorName: item.operatorName,
      action: item.action,
      entityType: item.entityType,
      entityId: item.entityId,
      summary: item.summary
    }));

    await insertSequentially(tx.contentRevision, snapshot.contentRevisions, (item) => ({
      id: item.id,
      entityType: item.entityType,
      entityId: item.entityId,
      snapshot: item.snapshot || {},
      createdAt: item.createdAt,
      createdBy: item.createdBy
    }));
  });

  return snapshot;
}

async function writeDb(data) {
  await ensureStorage();
  const snapshot = normalizeDbShape(data);

  if (DATABASE_PROVIDER === "mysql") {
    await persistSnapshotToMysql(snapshot);
    return snapshot;
  }

  await fs.promises.writeFile(dbFilePath, JSON.stringify(snapshot, null, 2), "utf8");
  return snapshot;
}

async function withDb(mutator) {
  const db = await readDb();
  const result = await mutator(db);
  await writeDb(db);
  return result;
}

async function disconnectDb() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
  }
}

module.exports = {
  DATABASE_PROVIDER,
  dbFilePath,
  disconnectDb,
  ensureStorage,
  getPrismaClient,
  persistSnapshotToMysql,
  readDb,
  uploadsDir,
  withDb,
  writeDb
};
