const crypto = require("crypto");

const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const derivedKey = crypto
    .pbkdf2Sync(password, salt, 100000, 64, "sha512")
    .toString("hex");
  return `${salt}:${derivedKey}`;
}

function verifyPassword(password, hashedPassword) {
  if (!hashedPassword || !hashedPassword.includes(":")) {
    return false;
  }

  const [salt] = hashedPassword.split(":");
  return hashPassword(password, salt) === hashedPassword;
}

function createOpaqueToken() {
  return crypto.randomBytes(24).toString("hex");
}

function createSession(user) {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    userId: user.id,
    userType: user.userType,
    accessToken: createOpaqueToken(),
    refreshToken: createOpaqueToken(),
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + ACCESS_TOKEN_TTL_MS).toISOString(),
    refreshExpiresAt: new Date(now + REFRESH_TOKEN_TTL_MS).toISOString(),
    revokedAt: null
  };
}

function isExpired(isoDate) {
  return !isoDate || new Date(isoDate).getTime() <= Date.now();
}

module.exports = {
  createSession,
  hashPassword,
  isExpired,
  verifyPassword
};
