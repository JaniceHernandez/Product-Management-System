-- ============================================================
-- 09_rls_policies.sql
-- Complete RLS policy definitions for all application tables.
-- Policies use get_actor_level() and get_my_user_type() to
-- avoid recursive subqueries and enforce the hierarchy:
--   Level 4 = Seeded Superadmin
--   Level 3 = Authorized Superadmin
--   Level 2 = Admin
--   Level 1 = User
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- TABLE: product
-- ────────────────────────────────────────────────────────────
drop policy if exists user_sees_active_only         on public.product;
drop policy if exists product_insert_prd_add        on public.product;
drop policy if exists product_update_prd_edit       on public.product;
drop policy if exists product_softdelete_prd_del    on public.product;
drop policy if exists product_recover               on public.product;

-- SELECT: USER sees only ACTIVE rows; ADMIN/SUPERADMIN see all
create policy user_sees_active_only
  on public.product
  for select
  to authenticated
  using (
    record_status = 'ACTIVE'
    or get_actor_level() >= 2
  );

-- INSERT: requires PRD_ADD right = 1
create policy product_insert_prd_add
  on public.product
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.usermodule_rights umr
      where umr.userid        = auth.uid()::text
        and umr.right_id      = 'PRD_ADD'
        and umr.right_value   = 1
        and umr.record_status = 'ACTIVE'
    )
  );

-- UPDATE (edit fields): requires PRD_EDIT right = 1 on ACTIVE rows
create policy product_update_prd_edit
  on public.product
  for update
  to authenticated
  using (
    record_status = 'ACTIVE'
    and exists (
      select 1 from public.usermodule_rights umr
      where umr.userid        = auth.uid()::text
        and umr.right_id      = 'PRD_EDIT'
        and umr.right_value   = 1
        and umr.record_status = 'ACTIVE'
    )
  )
  with check (
    exists (
      select 1 from public.usermodule_rights umr
      where umr.userid        = auth.uid()::text
        and umr.right_id      = 'PRD_EDIT'
        and umr.right_value   = 1
        and umr.record_status = 'ACTIVE'
    )
  );

-- UPDATE (soft-delete): requires PRD_DEL right = 1
create policy product_softdelete_prd_del
  on public.product
  for update
  to authenticated
  using (
    record_status = 'ACTIVE'
    and exists (
      select 1 from public.usermodule_rights umr
      where umr.userid        = auth.uid()::text
        and umr.right_id      = 'PRD_DEL'
        and umr.right_value   = 1
        and umr.record_status = 'ACTIVE'
    )
  )
  with check (
    exists (
      select 1 from public.usermodule_rights umr
      where umr.userid        = auth.uid()::text
        and umr.right_id      = 'PRD_DEL'
        and umr.right_value   = 1
        and umr.record_status = 'ACTIVE'
    )
  );

-- UPDATE (recovery): ADMIN and SUPERADMIN only, on INACTIVE rows
create policy product_recover
  on public.product
  for update
  to authenticated
  using (
    record_status = 'INACTIVE'
    and get_actor_level() >= 2
  )
  with check (
    get_actor_level() >= 2
  );


-- ────────────────────────────────────────────────────────────
-- TABLE: pricehist
-- ────────────────────────────────────────────────────────────
drop policy if exists pricehist_select_authenticated on public.pricehist;
drop policy if exists pricehist_insert_authenticated on public.pricehist;

create policy pricehist_select_authenticated
  on public.pricehist
  for select
  to authenticated
  using (true);

create policy pricehist_insert_authenticated
  on public.pricehist
  for insert
  to authenticated
  with check (true);


-- ────────────────────────────────────────────────────────────
-- TABLE: salesdetail
-- ────────────────────────────────────────────────────────────
drop policy if exists salesdetail_select_authenticated on public.salesdetail;

create policy salesdetail_select_authenticated
  on public.salesdetail
  for select
  to authenticated
  using (true);


-- ────────────────────────────────────────────────────────────
-- TABLE: user
-- ────────────────────────────────────────────────────────────
drop policy if exists user_select_scoped              on public.user;
drop policy if exists user_update_hierarchy           on public.user;
drop policy if exists authenticated_insert_own_user   on public.user;
drop policy if exists trigger_insert_user             on public.user;

-- SELECT: hierarchical visibility per actor level
create policy user_select_scoped
  on public.user
  for select
  to authenticated
  using (
    get_actor_level() = 4
    or (get_actor_level() = 3 and (user_type != 'SUPERADMIN' or is_seeded = false))
    or (get_actor_level() = 2 and user_type = 'USER')
    or userid = auth.uid()::text
  );

-- INSERT: authenticated user can insert their own row (fallback for trigger race)
create policy authenticated_insert_own_user
  on public.user
  for insert
  to authenticated
  with check (userid = auth.uid()::text);

-- INSERT: service_role (trigger) can insert new rows
create policy trigger_insert_user
  on public.user
  for insert
  to service_role
  with check (true);

-- UPDATE: hierarchical — each level can only update rows below their authority
create policy user_update_hierarchy
  on public.user
  for update
  to authenticated
  using (
    (get_actor_level() = 4 and is_seeded = false)
    or (get_actor_level() = 3 and user_type in ('ADMIN', 'USER'))
    or (get_actor_level() = 2 and user_type = 'USER')
  )
  with check (
    is_seeded = false
    and user_type in ('SUPERADMIN', 'ADMIN', 'USER')
    and get_actor_level() >= 2
  );


-- ────────────────────────────────────────────────────────────
-- TABLE: module
-- ────────────────────────────────────────────────────────────
drop policy if exists module_select_authenticated on public.module;

create policy module_select_authenticated
  on public.module
  for select
  to authenticated
  using (true);


-- ────────────────────────────────────────────────────────────
-- TABLE: rights
-- ────────────────────────────────────────────────────────────
drop policy if exists rights_select_authenticated on public.rights;

create policy rights_select_authenticated
  on public.rights
  for select
  to authenticated
  using (true);


-- ────────────────────────────────────────────────────────────
-- TABLE: user_module
-- ────────────────────────────────────────────────────────────
drop policy if exists user_module_select_own               on public.user_module;
drop policy if exists authenticated_insert_own_user_module on public.user_module;
drop policy if exists protect_superadmin_modules           on public.user_module;

create policy user_module_select_own
  on public.user_module
  for select
  to authenticated
  using (
    userid = auth.uid()::text
    or get_actor_level() >= 2
  );

create policy authenticated_insert_own_user_module
  on public.user_module
  for insert
  to authenticated
  with check (userid = auth.uid()::text);

create policy protect_superadmin_modules
  on public.user_module
  for all
  to authenticated
  using (
    get_actor_level() = 4
    or (get_actor_level() = 3 and userid in (select u.userid from public.user u where u.user_type in ('ADMIN', 'USER')))
    or (get_actor_level() = 2 and userid in (select u.userid from public.user u where u.user_type = 'USER'))
    or userid = auth.uid()::text
  )
  with check (get_actor_level() >= 2);


-- ────────────────────────────────────────────────────────────
-- TABLE: usermodule_rights
-- ────────────────────────────────────────────────────────────
drop policy if exists umr_select_own                  on public.usermodule_rights;
drop policy if exists authenticated_insert_own_umr    on public.usermodule_rights;
drop policy if exists umr_hierarchy_all               on public.usermodule_rights;

create policy umr_select_own
  on public.usermodule_rights
  for select
  to authenticated
  using (userid = auth.uid()::text or get_actor_level() >= 2);

create policy authenticated_insert_own_umr
  on public.usermodule_rights
  for insert
  to authenticated
  with check (userid = auth.uid()::text);

-- ALL (select/insert/update): hierarchical — matches actor level to target user type
create policy umr_hierarchy_all
  on public.usermodule_rights
  for all
  to authenticated
  using (
    get_actor_level() = 4
    or (get_actor_level() = 3 and userid in (select u.userid from public.user u where u.user_type in ('ADMIN', 'USER')))
    or (get_actor_level() = 2 and userid in (select u.userid from public.user u where u.user_type = 'USER'))
    or userid = auth.uid()::text
  )
  with check (get_actor_level() >= 2);


-- ────────────────────────────────────────────────────────────
-- TABLE: activity_log
-- ────────────────────────────────────────────────────────────
drop policy if exists activity_log_select on public.activity_log;
drop policy if exists activity_log_insert on public.activity_log;

-- SELECT: scoped by role
-- Seeded/Authorized Superadmin → all entries
-- Admin → all entries EXCEPT those by SUPERADMIN actors
-- User → only product and price action entries (read-only audit trail)
create policy activity_log_select
  on public.activity_log
  for select
  to authenticated
  using (
    get_actor_level() >= 3
    or (get_actor_level() = 2 and actor_role != 'SUPERADMIN')
    or (
      get_actor_level() = 1
      and action in (
        'PRODUCT_ADDED',
        'PRODUCT_EDITED',
        'PRODUCT_DELETED',
        'PRODUCT_RECOVERED',
        'PRICE_ADDED'
      )
    )
  );

-- INSERT: any authenticated user can write their own log entry
create policy activity_log_insert
  on public.activity_log
  for insert
  to authenticated
  with check (actor_id = auth.uid()::text);

-- Grants for activity_log (inserts + sequence access)
grant select, insert on public.activity_log to authenticated;
grant usage on sequence public.activity_log_log_id_seq to authenticated;