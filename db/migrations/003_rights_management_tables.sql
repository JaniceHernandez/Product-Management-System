-- ============================================================
-- 003_rights_management_tables.sql
-- Rights Management Schema: user, Module, rights,
-- user_module, UserModule_Rights
-- ============================================================
-- User table (application users — separate from Supabase auth.users)

CREATE TABLE IF NOT EXISTS public.user (

userId        TEXT          PRIMARY KEY,   -- matches auth.users.id (UUID as text)

username      VARCHAR(50)   NOT NULL,

lastName      VARCHAR(50),

firstName     VARCHAR(50),

user_type     VARCHAR(15)   NOT NULL CHECK (user_type IN ('SUPERADMIN', 'ADMIN', 'USER')),

record_status VARCHAR(10)   NOT NULL DEFAULT 'INACTIVE'

CHECK (record_status IN ('ACTIVE', 'INACTIVE')),

stamp         VARCHAR(60)

);


-- Module table (feature groups)

CREATE TABLE IF NOT EXISTS public.Module (

Module_ID   VARCHAR(20)   PRIMARY KEY,

description VARCHAR(60)   NOT NULL

);


-- Rights table (individual permission definitions)

CREATE TABLE IF NOT EXISTS public.rights (

Right_ID    VARCHAR(20)   PRIMARY KEY,

Description VARCHAR(60)   NOT NULL,

Module_ID   VARCHAR(20)   NOT NULL REFERENCES public.Module(Module_ID)

);


-- User-Module junction (which modules a user has access to)

CREATE TABLE IF NOT EXISTS public.user_module (

userid        TEXT          NOT NULL REFERENCES public.user(userId),

Module_ID     VARCHAR(20)   NOT NULL REFERENCES public.Module(Module_ID),

rights_value  SMALLINT      NOT NULL DEFAULT 0 CHECK (rights_value IN (0, 1)),

record_status VARCHAR(10)   NOT NULL DEFAULT 'ACTIVE'

CHECK (record_status IN ('ACTIVE', 'INACTIVE')),

stamp         VARCHAR(60),

PRIMARY KEY (userid, Module_ID)

);


-- User-Module-Rights junction (per-user permission values)

CREATE TABLE IF NOT EXISTS public.UserModule_Rights (

userid        TEXT          NOT NULL REFERENCES public.user(userId),

Right_ID      VARCHAR(20)   NOT NULL REFERENCES public.rights(Right_ID),

Right_value   SMALLINT      NOT NULL DEFAULT 0 CHECK (Right_value IN (0, 1)),

Record_status VARCHAR(10)   NOT NULL DEFAULT 'ACTIVE'

CHECK (Record_status IN ('ACTIVE', 'INACTIVE')),

Stamp         VARCHAR(60),

PRIMARY KEY (userid, Right_ID)

);
