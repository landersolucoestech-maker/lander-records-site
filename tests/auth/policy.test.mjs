import assert from "node:assert/strict";
import test from "node:test";
import { evaluateAdminAuthorization, hasMinimumRole, isValidSessionRecord } from "../../lib/auth/policy.ts";

const now = new Date("2026-08-29T12:00:00.000Z");

test("visitor without a session is denied", () => {
  assert.equal(isValidSessionRecord(null, now), false);
});

test("session with an invalid privileged-looking role is denied", () => {
  const session = { isActive: true, expiresAt: new Date("2026-08-30T12:00:00.000Z"), role: "superadmin" };
  assert.equal(isValidSessionRecord(session, now), false);
  assert.equal(hasMinimumRole(session.role, "viewer"), false);
});

test("expired session is denied", () => {
  const session = { isActive: true, expiresAt: new Date("2026-08-29T11:59:59.999Z"), role: "owner" };
  assert.equal(isValidSessionRecord(session, now), false);
});

test("active authorized session is accepted and respects RBAC", () => {
  const session = { isActive: true, expiresAt: new Date("2026-08-30T12:00:00.000Z"), role: "editor" };
  assert.equal(isValidSessionRecord(session, now), true);
  assert.equal(hasMinimumRole(session.role, "viewer"), true);
  assert.equal(hasMinimumRole(session.role, "editor"), true);
  assert.equal(hasMinimumRole(session.role, "admin"), false);
  assert.equal(hasMinimumRole(session.role, "owner"), false);
});

test("inactive and malformed sessions fail closed", () => {
  assert.equal(isValidSessionRecord({ isActive: false, expiresAt: new Date("2026-08-30T12:00:00.000Z"), role: "owner" }, now), false);
  assert.equal(isValidSessionRecord({ isActive: true, expiresAt: new Date(Number.NaN), role: "owner" }, now), false);
});

test("authoritative guard denies visitors", () => {
  assert.equal(evaluateAdminAuthorization(null, "viewer"), "unauthenticated");
});

test("authoritative guard blocks every role until mandatory password change", () => {
  const session = { user: { role: "owner", mustChangePassword: true } };
  assert.equal(evaluateAdminAuthorization(session, "viewer"), "password-change-required");
  assert.equal(evaluateAdminAuthorization(session, "owner"), "password-change-required");
});

test("authoritative guard enforces RBAC and rejects invalid roles", () => {
  const editor = { user: { role: "editor", mustChangePassword: false } };
  const invalid = { user: { role: "superadmin", mustChangePassword: false } };
  assert.equal(evaluateAdminAuthorization(editor, "viewer"), "authorized");
  assert.equal(evaluateAdminAuthorization(editor, "editor"), "authorized");
  assert.equal(evaluateAdminAuthorization(editor, "admin"), "forbidden");
  assert.equal(evaluateAdminAuthorization(editor, "owner"), "forbidden");
  assert.equal(evaluateAdminAuthorization(invalid, "viewer"), "forbidden");
});
