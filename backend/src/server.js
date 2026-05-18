require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { createSession, isExpired, verifyPassword } = require("./auth");
const { ensureStorage, readDb, uploadsDir, withDb } = require("./db");
const { validateAircraftPayload } = require("./validation");

const PORT = Number(process.env.PORT || 9001);
const app = express();
const defaultAllowedOrigins = [
  "http://heikesong.mexqf.top",
  "https://heikesong.mexqf.top",
  "http://8.162.14.195",
  "https://8.162.14.195",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:9000",
  "http://127.0.0.1:9000",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];
const allowedOrigins = String(process.env.CORS_ALLOWED_ORIGINS || defaultAllowedOrigins.join(","))
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);
const flexibleAllowedHosts = new Set(["heikesong.mexqf.top", "8.162.14.195", "localhost", "127.0.0.1"]);
const flexibleAllowedPorts = new Set(["", "3000", "4173", "9000"]);

function isAllowedOrigin(origin) {
  if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    return true;
  }

  try {
    const parsed = new URL(origin);
    return flexibleAllowedHosts.has(parsed.hostname) && flexibleAllowedPorts.has(parsed.port);
  } catch {
    return false;
  }
}

const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter(req, file, callback) {
    if (!file.mimetype.startsWith("image/")) {
      callback(new Error("仅支持上传图片文件"));
      return;
    }
    callback(null, true);
  }
});

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("当前来源未被 CORS 白名单允许"));
    },
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads", express.static(uploadsDir));

function ok(res, data, meta) {
  return res.json({ data, meta: meta || null, error: null });
}

function fail(res, status, message, details) {
  return res.status(status).json({
    data: null,
    meta: null,
    error: {
      message,
      details: details || null
    }
  });
}

function getRequestOrigin(req) {
  const protocolHeader = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  const protocol = protocolHeader || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return `${protocol}://${host}`;
}

function normalizeMediaUrl(req, value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  if (raw.startsWith("/")) {
    return `${getRequestOrigin(req)}${raw}`;
  }
  return `${getRequestOrigin(req)}/${raw}`;
}

function normalizeStoredMediaPath(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  try {
    const parsed = new URL(raw);
    if (parsed.pathname.startsWith("/uploads/")) {
      return parsed.pathname;
    }
    return raw;
  } catch {
    return raw;
  }
}

function pickRelatedAircraftCover(req, db, ids = []) {
  for (const id of ids) {
    const aircraft = db.aircraft.find((item) => item.id === id && item.status === "published");
    if (aircraft?.coverImage) {
      return normalizeMediaUrl(req, aircraft.coverImage);
    }
  }
  return "";
}

function pickPublicAircraft(req, aircraft) {
  return {
    id: aircraft.id,
    slug: aircraft.slug,
    nameZh: aircraft.nameZh,
    nameEn: aircraft.nameEn,
    aircraftType: aircraft.aircraftType,
    manufacturer: aircraft.manufacturer,
    countryOfOrigin: aircraft.countryOfOrigin,
    eraLabel: aircraft.eraLabel,
    firstFlightYear: aircraft.firstFlightYear,
    summary: aircraft.summary,
    description: aircraft.description,
    source: aircraft.source,
    sourceUrl: aircraft.sourceUrl,
    coverImage: normalizeMediaUrl(req, aircraft.coverImage),
    specs: aircraft.specs,
    status: aircraft.status,
    specSourceConfidence: aircraft.specSourceConfidence
  };
}

function pickPublicEvent(req, db, event) {
  return {
    ...event,
    coverImage: pickRelatedAircraftCover(req, db, event.relatedAircraftIds),
    relatedAircraftCount: Array.isArray(event.relatedAircraftIds) ? event.relatedAircraftIds.length : 0,
    relatedPersonCount: Array.isArray(event.relatedPersonIds) ? event.relatedPersonIds.length : 0
  };
}

function pickPublicPerson(req, db, person) {
  return {
    ...person,
    coverImage: pickRelatedAircraftCover(req, db, person.relatedAircraftIds),
    relatedAircraftCount: Array.isArray(person.relatedAircraftIds) ? person.relatedAircraftIds.length : 0,
    relatedEventCount: Array.isArray(person.relatedEventIds) ? person.relatedEventIds.length : 0
  };
}

function createAuditLog(db, payload) {
  db.auditLogs.unshift({
    id: cryptoRandomId(),
    createdAt: new Date().toISOString(),
    ...payload
  });
}

function cryptoRandomId() {
  return require("crypto").randomUUID();
}

function resolveEntityName(db, entityType, entityId) {
  if (entityType === "aircraft") {
    return db.aircraft.find((item) => item.id === entityId)?.nameZh || entityId;
  }
  if (entityType === "event") {
    return db.events.find((item) => item.id === entityId)?.title || entityId;
  }
  if (entityType === "person") {
    return db.persons.find((item) => item.id === entityId)?.nameZh || entityId;
  }
  return entityId;
}

function resolveEntityMeta(req, db, entityType, entityId) {
  if (entityType === "aircraft") {
    const item = db.aircraft.find((entry) => entry.id === entityId || entry.slug === entityId);
    return item
      ? {
          entityName: item.nameZh,
          entitySlug: item.slug,
          entityCoverImage: normalizeMediaUrl(req, item.coverImage)
        }
      : { entityName: entityId, entitySlug: "", entityCoverImage: "" };
  }
  if (entityType === "event") {
    const item = db.events.find((entry) => entry.id === entityId || entry.slug === entityId);
    return item
      ? {
          entityName: item.title,
          entitySlug: item.slug,
          entityCoverImage: pickRelatedAircraftCover(req, db, item.relatedAircraftIds)
        }
      : { entityName: entityId, entitySlug: "", entityCoverImage: "" };
  }
  if (entityType === "person") {
    const item = db.persons.find((entry) => entry.id === entityId || entry.slug === entityId);
    return item
      ? {
          entityName: item.nameZh,
          entitySlug: item.slug,
          entityCoverImage: pickRelatedAircraftCover(req, db, item.relatedAircraftIds)
        }
      : { entityName: entityId, entitySlug: "", entityCoverImage: "" };
  }
  return { entityName: entityId, entitySlug: "", entityCoverImage: "" };
}

function findAircraftByIdOrSlug(db, value) {
  return db.aircraft.find((item) => item.id === value || item.slug === value);
}

function ensureUniqueAircraftSlug(db, slug, currentId = null) {
  return !db.aircraft.some((item) => item.slug === slug && item.id !== currentId);
}

function buildSearchResults(req, db, query, type) {
  const keyword = String(query || "").trim().toLowerCase();
  const includeType = type && type !== "all" ? type : null;
  const results = [];

  const pushMatch = (entityType, item, title, summary, meta, coverImage) => {
    const haystack = `${title} ${summary}`.toLowerCase();
    if (!keyword || haystack.includes(keyword)) {
      if (!includeType || includeType === entityType) {
        results.push({
          id: item.id,
          slug: item.slug,
          entityType,
          title,
          summary,
          meta,
          coverImage: normalizeMediaUrl(req, coverImage)
        });
      }
    }
  };

  db.aircraft
    .filter((item) => item.status === "published")
    .forEach((item) =>
      pushMatch(
        "aircraft",
        item,
        item.nameZh,
        item.summary,
        {
          firstFlightYear: item.firstFlightYear,
          engineType: item.specs.engineType,
          rangeKm: item.specs.rangeKm
        },
        item.coverImage
      )
    );

  db.events
    .filter((item) => item.status === "published")
    .forEach((item) =>
      pushMatch(
        "event",
        item,
        item.title,
        item.summary,
        {
          eventType: item.eventType,
          eventDate: item.eventDate
        },
        pickRelatedAircraftCover(req, db, item.relatedAircraftIds)
      )
    );

  db.persons
    .filter((item) => item.status === "published")
    .forEach((item) =>
      pushMatch(
        "person",
        item,
        item.nameZh,
        item.summary,
        {
          personType: item.personType,
          nationality: item.nationality
        },
        pickRelatedAircraftCover(req, db, item.relatedAircraftIds)
      )
    );

  return results;
}

function getAuthorizationToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return null;
  }
  return header.slice("Bearer ".length).trim();
}

async function requireSession(req, res, next, allowedTypes = []) {
  const accessToken = getAuthorizationToken(req);
  if (!accessToken) {
    return fail(res, 401, "未登录");
  }

  const db = await readDb();
  const session = db.sessions.find(
    (item) => item.accessToken === accessToken && !item.revokedAt && !isExpired(item.expiresAt)
  );

  if (!session) {
    return fail(res, 401, "登录态已失效");
  }

  const user = db.users.find((item) => item.id === session.userId);
  if (!user || user.status !== "active") {
    return fail(res, 401, "用户不可用");
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(user.userType)) {
    return fail(res, 403, "无权限访问");
  }

  req.currentUser = user;
  req.currentSession = session;
  next();
}

function requireAdmin(req, res, next) {
  return requireSession(req, res, next, ["admin_user"]);
}

function requireFrontendUser(req, res, next) {
  return requireSession(req, res, next, ["frontend_user"]);
}

function buildAircraftDetail(req, db, aircraft) {
  const relatedEvents = db.events
    .filter((event) => event.relatedAircraftIds?.includes(aircraft.id))
    .map((event) => ({
      id: event.id,
      slug: event.slug,
      title: event.title,
      summary: event.summary,
      coverImage: pickRelatedAircraftCover(req, db, event.relatedAircraftIds)
    }));

  const relatedPersons = db.persons
    .filter((person) => person.relatedAircraftIds?.includes(aircraft.id))
    .map((person) => ({
      id: person.id,
      slug: person.slug,
      nameZh: person.nameZh,
      summary: person.summary,
      coverImage: pickRelatedAircraftCover(req, db, person.relatedAircraftIds)
    }));

  return {
    ...pickPublicAircraft(req, aircraft),
    relatedEvents,
    relatedPersons
  };
}

function normalizeAircraftInput(payload, existing = {}) {
  const nameZh = String(payload.nameZh || payload.name || existing.nameZh || "").trim();
  const firstFlightYear = Number(payload.firstFlightYear || payload.firstFlight || existing.firstFlightYear || 0);
  const now = new Date().toISOString();

  return {
    id: existing.id || `aircraft-${cryptoRandomId()}`,
    slug:
      existing.slug ||
      String(payload.slug || nameZh)
        .trim()
        .toLowerCase()
        .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
        .replace(/-+/g, "-"),
    nameZh,
    nameEn: String(payload.nameEn || existing.nameEn || "").trim(),
    aircraftType: String(payload.aircraftType || payload.type || existing.aircraftType || "").trim(),
    manufacturer: String(payload.manufacturer || existing.manufacturer || "待补充").trim(),
    countryOfOrigin: String(payload.countryOfOrigin || existing.countryOfOrigin || "待补充").trim(),
    eraLabel: String(payload.eraLabel || existing.eraLabel || "待补充").trim(),
    firstFlightYear: firstFlightYear || null,
    firstFlightDate:
      payload.firstFlightDate ||
      existing.firstFlightDate ||
      (firstFlightYear ? `${firstFlightYear}-01-01` : null),
    serviceEntryDate: payload.serviceEntryDate || existing.serviceEntryDate || null,
    status: payload.status || existing.status || "draft",
    summary: String(payload.summary || existing.summary || "").trim(),
    description: String(payload.description || existing.description || "").trim(),
    source: String(payload.source || existing.source || "").trim(),
    sourceUrl: String(payload.sourceUrl || existing.sourceUrl || "").trim(),
    specSourceConfidence: payload.specSourceConfidence || existing.specSourceConfidence || "to_confirm",
    coverImage: normalizeStoredMediaPath(payload.coverImage || existing.coverImage || ""),
    specs: {
      lengthM: Number(payload.lengthM || existing.specs?.lengthM || 0) || null,
      wingspanM: Number(payload.wingspanM || existing.specs?.wingspanM || 0) || null,
      heightM: Number(payload.heightM || existing.specs?.heightM || 0) || null,
      maxSpeedKmh: Number(payload.maxSpeedKmh || existing.specs?.maxSpeedKmh || 0) || null,
      cruiseSpeedKmh: Number(payload.cruiseSpeedKmh || existing.specs?.cruiseSpeedKmh || 0) || null,
      rangeKm: Number(payload.rangeKm || payload.range || existing.specs?.rangeKm || 0) || null,
      engineType: String(payload.engineType || existing.specs?.engineType || "").trim(),
      engineCount: Number(payload.engineCount || existing.specs?.engineCount || 0) || null,
      powerplantModel: String(payload.powerplantModel || existing.specs?.powerplantModel || "").trim(),
      passengerCapacity:
        Number(payload.passengerCapacity || existing.specs?.passengerCapacity || 0) || null
    },
    createdAt: existing.createdAt || now,
    updatedAt: now
  };
}

app.get("/health", async (req, res) => {
  await ensureStorage();
  ok(res, { status: "ok" });
});

app.get("/api/public/aircraft", async (req, res) => {
  const db = await readDb();
  const keyword = String(req.query.keyword || "").trim().toLowerCase();
  const type = String(req.query.type || "").trim();

  const items = db.aircraft
    .filter((item) => item.status === "published")
    .filter((item) => (!type ? true : item.aircraftType === type))
    .filter((item) => {
      if (!keyword) return true;
      return `${item.nameZh} ${item.summary} ${item.manufacturer}`.toLowerCase().includes(keyword);
    })
    .map((item) => pickPublicAircraft(req, item));

  ok(res, items, { total: items.length });
});

app.post("/api/public/aircraft/compare", async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const db = await readDb();
  const comparison = db.aircraft
    .filter((item) => item.status === "published")
    .filter((item) => ids.includes(item.id) || ids.includes(item.slug))
    .map((item) => pickPublicAircraft(req, item));

  ok(res, comparison, { total: comparison.length });
});

app.get("/api/public/aircraft/:id", async (req, res) => {
  const db = await readDb();
  const aircraft = db.aircraft.find(
    (item) => item.id === req.params.id || item.slug === req.params.id
  );

  if (!aircraft || aircraft.status !== "published") {
    return fail(res, 404, "未找到对应飞行器");
  }

  ok(res, buildAircraftDetail(req, db, aircraft));
});

app.get("/api/public/events", async (req, res) => {
  const db = await readDb();
  const items = db.events
    .filter((item) => item.status === "published")
    .map((item) => pickPublicEvent(req, db, item));
  ok(
    res,
    items,
    { total: items.length }
  );
});

app.get("/api/public/events/:id", async (req, res) => {
  const db = await readDb();
  const event = db.events.find((item) => item.id === req.params.id || item.slug === req.params.id);

  if (!event || event.status !== "published") {
    return fail(res, 404, "未找到对应事件");
  }

  ok(res, pickPublicEvent(req, db, event));
});

app.get("/api/public/persons", async (req, res) => {
  const db = await readDb();
  const items = db.persons
    .filter((item) => item.status === "published")
    .map((item) => pickPublicPerson(req, db, item));
  ok(
    res,
    items,
    { total: items.length }
  );
});

app.get("/api/public/persons/:id", async (req, res) => {
  const db = await readDb();
  const person = db.persons.find((item) => item.id === req.params.id || item.slug === req.params.id);

  if (!person || person.status !== "published") {
    return fail(res, 404, "未找到对应人物");
  }

  ok(res, pickPublicPerson(req, db, person));
});

app.get("/api/public/search", async (req, res) => {
  const db = await readDb();
  const items = buildSearchResults(req, db, req.query.q, req.query.type);
  ok(res, items, { total: items.length });
});

app.get("/api/public/recommendations", async (req, res) => {
  const db = await readDb();
  const entityType = String(req.query.entityType || "aircraft");
  const entityId = String(req.query.entityId || "");

  let items = [];
  if (entityType === "aircraft") {
    const aircraft = findAircraftByIdOrSlug(db, entityId);
    if (aircraft && aircraft.status === "published") {
      items = db.aircraft
        .filter(
          (item) =>
            item.id !== aircraft.id &&
            item.status === "published" &&
            (item.aircraftType === aircraft.aircraftType || item.eraLabel === aircraft.eraLabel)
        )
        .slice(0, 3)
        .map((item) => pickPublicAircraft(req, item));
    }
  }

  ok(res, items, { total: items.length });
});

app.post("/api/user/auth/register", async (req, res) => {
  const username = String(req.body.username || "").trim();
  const password = String(req.body.password || "");

  if (!username || password.length < 6) {
    return fail(res, 422, "用户名或密码不符合要求");
  }

  const { hashPassword } = require("./auth");
  const result = await withDb(async (db) => {
    if (db.users.some((item) => item.username === username)) {
      return { error: "用户名已存在" };
    }

    const user = {
      id: `user-${cryptoRandomId()}`,
      username,
      passwordHash: hashPassword(password),
      userType: "frontend_user",
      status: "active",
      nickname: username,
      email: "",
      phone: "",
      avatarUrl: "",
      lastLoginAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    db.users.push(user);
    return { user };
  });

  if (result.error) {
    return fail(res, 409, result.error);
  }

  ok(res, { id: result.user.id, username: result.user.username });
});

app.post("/api/user/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await withDb(async (db) => {
    const user = db.users.find((item) => item.username === username && item.userType === "frontend_user");
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { error: "账号或密码错误" };
    }

    const session = createSession(user);
    user.lastLoginAt = new Date().toISOString();
    db.sessions.push(session);

    return {
      session,
      user
    };
  });

  if (result.error) {
    return fail(res, 401, result.error);
  }

  ok(res, {
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    user: {
      id: result.user.id,
      username: result.user.username,
      nickname: result.user.nickname,
      userType: result.user.userType
    }
  });
});

app.post("/api/user/auth/refresh", async (req, res) => {
  const refreshToken = String(req.body.refreshToken || "");
  const result = await withDb(async (db) => {
    const session = db.sessions.find(
      (item) =>
        item.refreshToken === refreshToken && !item.revokedAt && !isExpired(item.refreshExpiresAt)
    );

    if (!session) {
      return { error: "刷新令牌无效" };
    }

    const user = db.users.find((item) => item.id === session.userId);
    if (!user) {
      return { error: "用户不存在" };
    }

    session.accessToken = createSession(user).accessToken;
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60).toISOString();
    return { session };
  });

  if (result.error) {
    return fail(res, 401, result.error);
  }

  ok(res, { accessToken: result.session.accessToken });
});

app.post("/api/user/auth/logout", requireFrontendUser, async (req, res) => {
  await withDb(async (db) => {
    const session = db.sessions.find((item) => item.id === req.currentSession.id);
    if (session) {
      session.revokedAt = new Date().toISOString();
    }
  });

  ok(res, { success: true });
});

app.get("/api/user/profile", requireFrontendUser, async (req, res) => {
  ok(res, {
    id: req.currentUser.id,
    username: req.currentUser.username,
    nickname: req.currentUser.nickname,
    userType: req.currentUser.userType
  });
});

app.post("/api/user/favorites", requireFrontendUser, async (req, res) => {
  const entityType = String(req.body.entityType || "");
  const entityId = String(req.body.entityId || "");

  const result = await withDb(async (db) => {
    const exists = db.favorites.find(
      (item) =>
        item.userId === req.currentUser.id &&
        item.entityType === entityType &&
        item.entityId === entityId
    );

    if (exists) {
      return { favorite: exists };
    }

    const favorite = {
      id: `favorite-${cryptoRandomId()}`,
      userId: req.currentUser.id,
      entityType,
      entityId,
      createdAt: new Date().toISOString()
    };
    db.favorites.push(favorite);
    return { favorite };
  });

  ok(res, result.favorite);
});

app.delete("/api/user/favorites/:id", requireFrontendUser, async (req, res) => {
  await withDb(async (db) => {
    db.favorites = db.favorites.filter(
      (item) => !(item.id === req.params.id && item.userId === req.currentUser.id)
    );
  });

  ok(res, { success: true });
});

app.get("/api/user/favorites", requireFrontendUser, async (req, res) => {
  const db = await readDb();
  const items = db.favorites
    .filter((item) => item.userId === req.currentUser.id)
    .map((item) => ({
      ...item,
      ...resolveEntityMeta(req, db, item.entityType, item.entityId)
    }));

  ok(res, items, { total: items.length });
});

app.post("/api/user/history", requireFrontendUser, async (req, res) => {
  const entityType = String(req.body.entityType || "");
  const entityId = String(req.body.entityId || "");

  const result = await withDb(async (db) => {
    let item = db.browsingHistory.find(
      (history) =>
        history.userId === req.currentUser.id &&
        history.entityType === entityType &&
        history.entityId === entityId
    );

    if (!item) {
      item = {
        id: `history-${cryptoRandomId()}`,
        userId: req.currentUser.id,
        entityType,
        entityId,
        viewCount: 0,
        firstViewedAt: new Date().toISOString(),
        lastViewedAt: new Date().toISOString()
      };
      db.browsingHistory.push(item);
    }

    item.viewCount += 1;
    item.lastViewedAt = new Date().toISOString();
    return { item };
  });

  ok(res, result.item);
});

app.get("/api/user/history", requireFrontendUser, async (req, res) => {
  const db = await readDb();
  const items = db.browsingHistory
    .filter((item) => item.userId === req.currentUser.id)
    .sort((a, b) => new Date(b.lastViewedAt) - new Date(a.lastViewedAt))
    .map((item) => ({
      ...item,
      ...resolveEntityMeta(req, db, item.entityType, item.entityId)
    }));

  ok(res, items, { total: items.length });
});

app.post("/api/admin/auth/login", async (req, res) => {
  const { username, password } = req.body;
  const result = await withDb(async (db) => {
    const user = db.users.find((item) => item.username === username && item.userType === "admin_user");
    if (!user || !verifyPassword(password, user.passwordHash)) {
      return { error: "管理员账号或密码错误" };
    }

    const session = createSession(user);
    user.lastLoginAt = new Date().toISOString();
    db.sessions.push(session);
    createAuditLog(db, {
      operatorId: user.id,
      operatorName: user.username,
      action: "admin_login",
      entityType: "auth",
      entityId: user.id,
      summary: "管理员登录成功"
    });

    return { session, user };
  });

  if (result.error) {
    return fail(res, 401, result.error);
  }

  ok(res, {
    accessToken: result.session.accessToken,
    refreshToken: result.session.refreshToken,
    user: {
      id: result.user.id,
      username: result.user.username,
      nickname: result.user.nickname,
      userType: result.user.userType
    }
  });
});

app.get("/api/admin/dashboard/summary", requireAdmin, async (req, res) => {
  const db = await readDb();
  const publishedCount = db.aircraft.filter((item) => item.status === "published").length;
  const missingFieldCount = db.aircraft.reduce((count, item) => {
    const validation = validateAircraftPayload(item, { requirePublishReady: false });
    return count + validation.missingFields.length;
  }, 0);

  ok(res, {
    publishedCount,
    missingFieldCount,
    reviewPendingCount: db.approvalTasks.filter((item) => item.taskStatus === "pending").length,
    weeklyFixRate: "92%"
  });
});

app.get("/api/admin/aircraft", requireAdmin, async (req, res) => {
  const db = await readDb();
  const items = db.aircraft.map((item) => {
    const validation = validateAircraftPayload(item, { requirePublishReady: item.status === "published" });
    return {
      ...pickPublicAircraft(req, item),
      missingFieldCount: validation.missingFields.length,
      blockingIssueCount: validation.blockingIssues.length,
      warningIssueCount: validation.warningIssues.length
    };
  });
  ok(res, items, { total: items.length });
});

app.get("/api/admin/review-queue", requireAdmin, async (req, res) => {
  const db = await readDb();
  const items = db.approvalWorkflows
    .filter((workflow) => workflow.workflowStatus === "pending")
    .map((workflow) => {
      const aircraft = db.aircraft.find((item) => item.id === workflow.entityId);
      const task = db.approvalTasks.find(
        (item) => item.workflowId === workflow.id && item.taskStatus === "pending"
      );
      return {
        workflowId: workflow.id,
        entityId: workflow.entityId,
        entityName: aircraft?.nameZh || workflow.entityId,
        entityStatus: aircraft?.status || "unknown",
        entityCoverImage: normalizeMediaUrl(req, aircraft?.coverImage),
        submittedAt: workflow.submittedAt,
        reviewerId: workflow.currentReviewerId,
        taskId: task?.id || null,
        taskStatus: task?.taskStatus || null
      };
    });
  ok(res, items, { total: items.length });
});

app.post("/api/admin/content/validate", requireAdmin, async (req, res) => {
  const validation = validateAircraftPayload(req.body, {
    requirePublishReady: Boolean(req.body.requirePublishReady)
  });
  ok(res, validation);
});

app.post("/api/admin/aircraft", requireAdmin, async (req, res) => {
  const validation = validateAircraftPayload(req.body, { requirePublishReady: false });
  if (validation.blockingIssues.length > 0) {
    return fail(res, 422, "内容校验未通过", validation);
  }

  const result = await withDb(async (db) => {
    const aircraft = normalizeAircraftInput(req.body);
    if (!ensureUniqueAircraftSlug(db, aircraft.slug)) {
      return { error: "slug 已存在，请修改中文名或手动指定 slug" };
    }
    db.aircraft.unshift(aircraft);
    db.contentRevisions.unshift({
      id: `revision-${cryptoRandomId()}`,
      entityType: "aircraft",
      entityId: aircraft.id,
      snapshot: aircraft,
      createdAt: new Date().toISOString(),
      createdBy: req.currentUser.id
    });
    createAuditLog(db, {
      operatorId: req.currentUser.id,
      operatorName: req.currentUser.username,
      action: "create_aircraft",
      entityType: "aircraft",
      entityId: aircraft.id,
      summary: `新建航空器：${aircraft.nameZh}`
    });
    return { aircraft };
  });

  if (result.error) {
    return fail(res, 409, result.error);
  }

  ok(res, result.aircraft);
});

app.put("/api/admin/aircraft/:id", requireAdmin, async (req, res) => {
  const result = await withDb(async (db) => {
    const index = db.aircraft.findIndex((item) => item.id === req.params.id || item.slug === req.params.id);
    if (index < 0) {
      return { error: "未找到要更新的航空器" };
    }

    const updated = normalizeAircraftInput(req.body, db.aircraft[index]);
    if (!ensureUniqueAircraftSlug(db, updated.slug, updated.id)) {
      return { error: "slug 已存在，请修改中文名或手动指定 slug" };
    }
    db.aircraft[index] = updated;
    db.contentRevisions.unshift({
      id: `revision-${cryptoRandomId()}`,
      entityType: "aircraft",
      entityId: updated.id,
      snapshot: updated,
      createdAt: new Date().toISOString(),
      createdBy: req.currentUser.id
    });
    createAuditLog(db, {
      operatorId: req.currentUser.id,
      operatorName: req.currentUser.username,
      action: "update_aircraft",
      entityType: "aircraft",
      entityId: updated.id,
      summary: `更新航空器：${updated.nameZh}`
    });
    return { aircraft: updated };
  });

  if (result.error) {
    return fail(res, result.error.includes("slug 已存在") ? 409 : 404, result.error);
  }

  ok(res, result.aircraft);
});

app.post("/api/admin/content/submit-review", requireAdmin, async (req, res) => {
  const entityType = String(req.body.entityType || "aircraft");
  const entityId = String(req.body.entityId || "");
  const reviewerId = String(req.body.reviewerId || req.currentUser.id);

  const result = await withDb(async (db) => {
    if (entityType !== "aircraft") {
      return { error: "当前本地演示仅支持航空器提审" };
    }

    const aircraft = db.aircraft.find((item) => item.id === entityId || item.slug === entityId);
    if (!aircraft) {
      return { error: "未找到对应内容" };
    }

    const validation = validateAircraftPayload(aircraft, { requirePublishReady: true });
    if (!validation.passed) {
      return { error: "当前内容未满足提审条件", details: validation };
    }

    aircraft.status = "in_review";
    aircraft.updatedAt = new Date().toISOString();

    const latestRevision = db.contentRevisions.find(
      (item) => item.entityType === entityType && item.entityId === aircraft.id
    );
    const workflow = {
      id: `workflow-${cryptoRandomId()}`,
      entityType,
      entityId: aircraft.id,
      revisionId: latestRevision?.id || null,
      submitterId: req.currentUser.id,
      currentReviewerId: reviewerId,
      workflowStatus: "pending",
      submittedAt: new Date().toISOString(),
      completedAt: null
    };
    const task = {
      id: `task-${cryptoRandomId()}`,
      workflowId: workflow.id,
      reviewerId,
      taskStatus: "pending",
      decision: "pending",
      processedAt: null,
      createdAt: new Date().toISOString()
    };

    db.approvalWorkflows.unshift(workflow);
    db.approvalTasks.unshift(task);
    createAuditLog(db, {
      operatorId: req.currentUser.id,
      operatorName: req.currentUser.username,
      action: "submit_review",
      entityType,
      entityId: aircraft.id,
      summary: `提交审核：${aircraft.nameZh}`
    });
    return { workflow, task, aircraft };
  });

  if (result.error) {
    return fail(res, 422, result.error, result.details);
  }

  ok(res, result);
});

app.post("/api/admin/content/approve", requireAdmin, async (req, res) => {
  const workflowId = String(req.body.workflowId || "");
  const comment = String(req.body.comment || "审核通过");

  const result = await withDb(async (db) => {
    const workflow = db.approvalWorkflows.find((item) => item.id === workflowId);
    if (!workflow || workflow.workflowStatus !== "pending") {
      return { error: "审核流不存在或已处理" };
    }
    if (workflow.currentReviewerId !== req.currentUser.id) {
      return { error: "当前管理员不是该审核流的指定审核人" };
    }

    const task = db.approvalTasks.find((item) => item.workflowId === workflowId && item.taskStatus === "pending");
    const aircraft = db.aircraft.find((item) => item.id === workflow.entityId);
    if (!task || !aircraft) {
      return { error: "审核任务或内容不存在" };
    }

    workflow.workflowStatus = "approved";
    workflow.completedAt = new Date().toISOString();
    task.taskStatus = "done";
    task.decision = "approved";
    task.processedAt = new Date().toISOString();
    aircraft.status = "published";
    aircraft.updatedAt = new Date().toISOString();
    db.reviewComments.unshift({
      id: `comment-${cryptoRandomId()}`,
      workflowId,
      reviewerId: req.currentUser.id,
      comment,
      createdAt: new Date().toISOString()
    });
    createAuditLog(db, {
      operatorId: req.currentUser.id,
      operatorName: req.currentUser.username,
      action: "approve_review",
      entityType: workflow.entityType,
      entityId: workflow.entityId,
      summary: `审核通过：${aircraft.nameZh}`
    });

    return { workflow, task };
  });

  if (result.error) {
    return fail(res, 422, result.error);
  }

  ok(res, result);
});

app.post("/api/admin/content/reject", requireAdmin, async (req, res) => {
  const workflowId = String(req.body.workflowId || "");
  const comment = String(req.body.comment || "").trim();

  if (!comment) {
    return fail(res, 422, "驳回时必须填写原因");
  }

  const result = await withDb(async (db) => {
    const workflow = db.approvalWorkflows.find((item) => item.id === workflowId);
    if (!workflow || workflow.workflowStatus !== "pending") {
      return { error: "审核流不存在或已处理" };
    }
    if (workflow.currentReviewerId !== req.currentUser.id) {
      return { error: "当前管理员不是该审核流的指定审核人" };
    }

    const task = db.approvalTasks.find((item) => item.workflowId === workflowId && item.taskStatus === "pending");
    const aircraft = db.aircraft.find((item) => item.id === workflow.entityId);
    if (!task || !aircraft) {
      return { error: "审核任务或内容不存在" };
    }

    workflow.workflowStatus = "rejected";
    workflow.completedAt = new Date().toISOString();
    task.taskStatus = "done";
    task.decision = "rejected";
    task.processedAt = new Date().toISOString();
    aircraft.status = "draft";
    aircraft.updatedAt = new Date().toISOString();
    db.reviewComments.unshift({
      id: `comment-${cryptoRandomId()}`,
      workflowId,
      reviewerId: req.currentUser.id,
      comment,
      createdAt: new Date().toISOString()
    });
    createAuditLog(db, {
      operatorId: req.currentUser.id,
      operatorName: req.currentUser.username,
      action: "reject_review",
      entityType: workflow.entityType,
      entityId: workflow.entityId,
      summary: `审核驳回：${aircraft.nameZh}`
    });

    return { workflow, task };
  });

  if (result.error) {
    return fail(res, 422, result.error);
  }

  ok(res, result);
});

app.get("/api/admin/audit-logs", requireAdmin, async (req, res) => {
  const db = await readDb();
  ok(res, db.auditLogs.slice(0, 50), { total: db.auditLogs.length });
});

app.post("/api/admin/media/upload", requireAdmin, upload.single("file"), async (req, res) => {
  if (!req.file) {
    return fail(res, 422, "未接收到文件");
  }

  const storedPath = `/uploads/${path.basename(req.file.path)}`;
  ok(res, {
    filename: req.file.filename,
    originalName: req.file.originalname,
    path: storedPath,
    url: normalizeMediaUrl(req, storedPath)
  });
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return fail(res, 422, error.message);
  }
  if (error) {
    return fail(res, 422, error.message || "请求处理失败");
  }
  next();
});

app.use((req, res) => {
  fail(res, 404, "接口不存在");
});

async function start() {
  await ensureStorage();

  if (!fs.existsSync(uploadsDir)) {
    await fs.promises.mkdir(uploadsDir, { recursive: true });
  }

  app.listen(PORT, () => {
    console.log(`Flyer Guide backend running at http://localhost:${PORT}`);
    console.log("Default admin: admin / Admin123!");
    console.log("Default frontend user: demo / Demo123!");
  });
}

start().catch((error) => {
  console.error("Failed to start backend:", error);
  process.exit(1);
});
