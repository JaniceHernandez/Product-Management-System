-- ============================================================
-- Migration 002: Rights Management Schema
-- Tables: user, Module, user_module, rights, UserModule_Rights
-- ============================================================

CREATE TABLE IF NOT EXISTS "user" (
  userID        VARCHAR(10) NOT NULL PRIMARY KEY,
  username      VARCHAR(30),
  password      VARCHAR(60),
  record_status VARCHAR(10) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS "Module" (
  moduleID   VARCHAR(10) NOT NULL PRIMARY KEY,
  moduleName VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS "user_module" (
  userID   VARCHAR(10) REFERENCES "user"(userID),
  moduleID VARCHAR(10) REFERENCES "Module"(moduleID),
  PRIMARY KEY (userID, moduleID)
);

CREATE TABLE IF NOT EXISTS "rights" (
  rightsID   VARCHAR(10) NOT NULL PRIMARY KEY,
  rightsName VARCHAR(30)
);

CREATE TABLE IF NOT EXISTS "UserModule_Rights" (
  userID   VARCHAR(10),
  moduleID VARCHAR(10),
  rightsID VARCHAR(10) REFERENCES "rights"(rightsID),
  PRIMARY KEY (userID, moduleID, rightsID),
  FOREIGN KEY (userID, moduleID) REFERENCES "user_module"(userID, moduleID)
);