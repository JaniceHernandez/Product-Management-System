-- ============================================================
-- 03_rights_management_tables.sql
-- Rights management schema:
-- user, module, rights, user_module, usermodule_rights
-- ============================================================

create table if not exists public.user (
  userid        text          primary key,
  username      varchar(50)   not null,
  lastname      varchar(50),
  firstname     varchar(50),
  email         text,
  user_type     varchar(15)   not null check (user_type in ('SUPERADMIN', 'ADMIN', 'USER')),
  is_seeded     boolean       not null default false,
  record_status varchar(10)   not null default 'INACTIVE'
                              check (record_status in ('ACTIVE', 'INACTIVE')),
  stamp         varchar(60)
);

create table if not exists public.module (
  module_id     varchar(20)   primary key,
  description   varchar(60)   not null
);

create table if not exists public.rights (
  right_id      varchar(20)   primary key,
  description   varchar(60)   not null,
  module_id     varchar(20)   not null references public.module(module_id)
);

create table if not exists public.user_module (
  userid        text          not null references public.user(userid),
  module_id     varchar(20)   not null references public.module(module_id),
  rights_value  smallint      not null default 0 check (rights_value in (0, 1)),
  record_status varchar(10)   not null default 'ACTIVE'
                              check (record_status in ('ACTIVE', 'INACTIVE')),
  stamp         varchar(60),
  primary key (userid, module_id)
);

create table if not exists public.usermodule_rights (
  userid        text          not null references public.user(userid),
  right_id      varchar(20)   not null references public.rights(right_id),
  right_value   smallint      not null default 0 check (right_value in (0, 1)),
  record_status varchar(10)   not null default 'ACTIVE'
                              check (record_status in ('ACTIVE', 'INACTIVE')),
  stamp         varchar(60),
  primary key (userid, right_id)
);