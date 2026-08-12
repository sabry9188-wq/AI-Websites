-- ============================================================================
-- netlog — Supabase database schema
-- ============================================================================
-- HOW TO USE THIS FILE
-- Paste this entire file into the Supabase SQL Editor (Project > SQL Editor >
-- New query) and click "Run". It creates everything from scratch: tables,
-- constraints, views, indexes, security rules, and the starting list of
-- sites/cages/mesh sizes. Run it exactly once on a brand new project.
--
-- This script is NOT safe to re-run on a project where it already ran — it
-- will fail with "already exists" errors. See SETUP.md if you need to start
-- over on a fresh project.
--
-- If you already ran an earlier version of this file on a live project,
-- don't re-run this one — instead run the numbered scripts in
-- supabase/migrations/ (in order, ones you haven't run yet) to bring an
-- existing database up to date without touching your data.
-- ============================================================================


-- ============================================================================
-- SECTION 0 — Extensions
-- ============================================================================
-- gen_random_uuid() is used everywhere below to generate IDs.
create extension if not exists "pgcrypto";


-- ============================================================================
-- SECTION 1 — Enumerated types
-- ============================================================================
-- Using a fixed list of allowed values (instead of free text) stops typos
-- like "Instaled" or "washeing" from ever reaching the database.

create type user_role as enum ('admin', 'supervisor', 'viewer');

create type net_type as enum ('cage_net', 'guard_net');

create type net_status as enum (
  'in_store', 'installed', 'washing', 'repair', 'ready', 'scrapped'
);

create type net_event_action as enum (
  'created', 'installed', 'removed', 'status_changed', 'hole_count_updated',
  'edited', 'scrapped', 'install_rejected_conflict'
);


-- ============================================================================
-- SECTION 2 — Lookup tables (sites, cages, mesh sizes)
-- ============================================================================

create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  code text not null unique,
  diameter_m numeric(5,2) not null,
  created_at timestamptz not null default now()
);
comment on table sites is 'The two farm locations. Each has its own cage numbering and standard net diameter.';

create table cages (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id),
  cage_number text not null,
  diameter_m numeric(5,2) not null,
  created_at timestamptz not null default now(),
  unique (site_id, cage_number)
);
comment on table cages is 'Fixed list of real cages. The app always makes staff pick from this list — never type a cage number by hand.';

create table mesh_size_options (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id),
  net_type net_type not null,
  mesh_size_mm numeric(6,2) not null,
  created_at timestamptz not null default now(),
  unique (site_id, net_type, mesh_size_mm)
);
comment on table mesh_size_options is 'Which mesh sizes are valid for a given site + net type (cage net vs guard net). If the farm starts using a new mesh size, an admin adds a row here — no code change needed.';


-- ============================================================================
-- SECTION 3 — Profiles (one row per login account)
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role user_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table profiles is 'Extends each Supabase Auth login with a role. New accounts default to viewer (read-only) — an admin must deliberately promote someone to supervisor/admin. Nobody can promote themselves.';

-- Every new Supabase Auth user automatically gets a matching profile row.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), 'viewer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Keeps "updated_at" accurate automatically, so nobody has to remember to set it.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on profiles
  for each row execute function set_updated_at();


-- ============================================================================
-- SECTION 4 — Core tables: nets, net_deployments, net_events
-- ============================================================================

create table nets (
  id uuid primary key default gen_random_uuid(),
  net_number text not null unique check (length(trim(net_number)) > 0),
  net_type net_type not null,
  mesh_size_mm numeric(6,2) not null,
  dimensions text,
  max_allowed_days_in_water integer not null default 60 check (max_allowed_days_in_water > 0),
  current_status net_status not null default 'in_store',
  hole_count integer not null default 0 check (hole_count >= 0),
  manually_flagged boolean not null default false,
  notes text,
  created_by uuid references profiles(id),
  updated_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table nets is 'The physical net asset. One row per physical net for its entire life. Default max_allowed_days_in_water is 60 (2 months) per the farm''s standard; can be overridden per net.';

create trigger nets_set_updated_at
  before update on nets
  for each row execute function set_updated_at();

create index idx_nets_status on nets(current_status);
create index idx_nets_net_number on nets(net_number);


create table net_deployments (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets(id),
  net_type net_type not null,
  cage_id uuid not null references cages(id),
  date_in date not null,
  date_out date,
  hole_count_at_removal integer check (hole_count_at_removal >= 0),
  comments text,
  installed_by uuid not null references profiles(id),
  removed_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint date_out_after_date_in check (date_out is null or date_out >= date_in),
  constraint date_in_not_future check (date_in <= (now() at time zone 'Asia/Dubai')::date)
);
comment on table net_deployments is 'One row per time a net spends in the water. net_type is copied from the net at install time. date_out is null while the net is still submerged.';

-- A physical net can only be in the water in ONE place at a time.
create unique index one_active_deployment_per_net
  on net_deployments (net_id) where date_out is null;

-- A cage must have exactly one cage_net and one guard_net installed at a
-- time — this index stops two guard nets (or two cage nets) ever being
-- active in the same cage simultaneously.
create unique index one_active_slot_per_cage_type
  on net_deployments (cage_id, net_type) where date_out is null;

create index idx_net_deployments_net_id on net_deployments(net_id);
create index idx_net_deployments_cage_id on net_deployments(cage_id);


create table net_events (
  id uuid primary key default gen_random_uuid(),
  net_id uuid not null references nets(id),
  event_timestamp timestamptz not null default now(),
  user_id uuid references profiles(id),
  action net_event_action not null,
  cage_id uuid references cages(id),
  from_status net_status,
  to_status net_status,
  hole_count integer,
  comments text,
  metadata jsonb not null default '{}'::jsonb,
  client_generated_id uuid unique
);
comment on table net_events is 'Permanent audit trail. Nothing is ever deleted or edited here — not even by an admin through the app. client_generated_id lets an offline action, once it finally syncs, avoid being recorded twice if the sync is retried.';

create index idx_net_events_net_id on net_events(net_id);
create index idx_net_events_timestamp on net_events(event_timestamp desc);


create table conflict_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  net_event_id uuid not null references net_events(id) unique,
  acknowledged_by uuid not null references profiles(id),
  acknowledged_at timestamptz not null default now(),
  resolution_notes text
);
comment on table conflict_acknowledgements is 'Marks an install_rejected_conflict event as reviewed by a supervisor/admin. Never modifies net_events itself — the audit log stays permanent and append-only; this is a separate record that someone looked at it.';


-- ============================================================================
-- SECTION 5 — Calculated views (Gulf Standard Time, never browser time)
-- ============================================================================
-- 'Asia/Dubai' is UTC+04:00 year-round (no daylight saving) — this is what
-- makes "Gulf Standard Time" — so every date calculation below uses it
-- explicitly instead of the database server's or the visitor's browser's
-- own timezone. A net's status can never change just because someone opened
-- the app on a phone set to a different timezone.

create view v_net_status as
select
  n.id as net_id,
  n.net_number,
  n.net_type,
  n.mesh_size_mm,
  n.dimensions,
  n.max_allowed_days_in_water,
  n.current_status,
  n.hole_count,
  n.manually_flagged,
  n.notes,
  d.id as active_deployment_id,
  d.cage_id,
  c.cage_number,
  c.site_id,
  s.name as site_name,
  d.date_in,
  case when d.id is not null
    then ((now() at time zone 'Asia/Dubai')::date - d.date_in)
    else null
  end as days_in_water,
  case when d.id is not null
    then n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)
    else null
  end as days_left,
  coalesce(
    d.id is not null
    and (n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)) < 0,
    false
  ) as overdue,
  (
    coalesce(
      d.id is not null
      and (n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)) < 0,
      false
    )
    or n.hole_count > 10
    or n.manually_flagged
  ) as change_required,
  case
    when d.id is null then null
    when (n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)) < 0 then 'red'
    when (n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)) <= 6 then 'orange'
    when (n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)) <= 15 then 'yellow'
    else 'green'
  end as color_code,
  n.created_at,
  n.updated_at
from nets n
left join net_deployments d on d.net_id = n.id and d.date_out is null
left join cages c on c.id = d.cage_id
left join sites s on s.id = c.site_id;

comment on view v_net_status is 'One row per net with every calculated field (days in water, days left, overdue, change required, color). This is what the Net Register table and dashboard both read from, so they can never disagree. Change Required = overdue OR hole_count > 10 OR manually flagged. Color reflects days-left only: red = overdue, orange = 0-6 days left, yellow = 7-15, green = 16+.';


create view v_cage_current as
select
  c.id as cage_id,
  c.cage_number,
  c.site_id,
  s.name as site_name,
  cn.net_id as cage_net_id,
  cnn.net_number as cage_net_number,
  cn.date_in as cage_net_date_in,
  gn.net_id as guard_net_id,
  gnn.net_number as guard_net_number,
  gn.date_in as guard_net_date_in,
  (cn.net_id is not null) as has_cage_net,
  (gn.net_id is not null) as has_guard_net
from cages c
join sites s on s.id = c.site_id
left join net_deployments cn on cn.cage_id = c.id and cn.date_out is null and cn.net_type = 'cage_net'
left join net_deployments gn on gn.cage_id = c.id and gn.date_out is null and gn.net_type = 'guard_net'
left join nets cnn on cnn.id = cn.net_id
left join nets gnn on gnn.id = gn.net_id;

comment on view v_cage_current is 'One row per cage showing whether its cage_net and guard_net slots are currently filled. Powers the "cage missing its guard net" alert — a cage silently missing one of its two required nets is otherwise easy to miss.';


create view v_dashboard_summary as
select
  count(*) as total_nets,
  count(*) filter (where current_status = 'installed') as nets_in_water,
  count(*) filter (where current_status = 'in_store') as nets_in_store,
  count(*) filter (where active_deployment_id is not null and days_left between 0 and 7) as due_for_change_7d,
  count(*) filter (where overdue) as overdue_count,
  count(*) filter (where hole_count > 10) as nets_with_holes,
  round(avg(days_in_water) filter (where active_deployment_id is not null), 1) as avg_days_in_water
from v_net_status
where current_status <> 'scrapped';

comment on view v_dashboard_summary is 'The numbers behind the dashboard summary cards. Scrapped nets are excluded from every count.';


create view v_unacknowledged_conflicts as
select
  e.id as event_id,
  e.net_id,
  n.net_number,
  e.cage_id,
  c.cage_number,
  e.event_timestamp,
  e.user_id,
  p.full_name as user_full_name,
  e.comments,
  e.metadata
from net_events e
join nets n on n.id = e.net_id
left join cages c on c.id = e.cage_id
left join profiles p on p.id = e.user_id
left join conflict_acknowledgements a on a.net_event_id = e.id
where e.action = 'install_rejected_conflict' and a.id is null;

comment on view v_unacknowledged_conflicts is 'Offline-sync conflicts nobody has reviewed yet — this is what the "Needs Attention" screen shows.';


-- ============================================================================
-- SECTION 6 — Role helper functions
-- ============================================================================

create or replace function require_role(min_role user_role)
returns void
language plpgsql
stable
as $$
declare
  caller_role user_role;
begin
  select role into caller_role from profiles where id = auth.uid();
  if caller_role is null then
    raise exception 'You must be signed in to do that.';
  end if;
  if min_role = 'admin' and caller_role <> 'admin' then
    raise exception 'Only an administrator can do that.';
  end if;
  if min_role = 'supervisor' and caller_role not in ('admin', 'supervisor') then
    raise exception 'Only a supervisor or administrator can do that. Viewers have read-only access.';
  end if;
end;
$$;

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;


-- ============================================================================
-- SECTION 7 — Mutation functions (RPCs)
-- ============================================================================
-- Every action that changes data goes through one of these functions instead
-- of the app writing to tables directly. Each one: (1) checks the caller's
-- role, (2) makes the change, and (3) writes a matching net_events row, all
-- in a single all-or-nothing transaction. This is also what makes the
-- offline queue safe: each call optionally carries a client_generated_id: if
-- that same id was already processed (e.g. a retried sync after a dropped
-- connection), the function returns immediately instead of applying the
-- change twice.

create or replace function create_net(
  p_net_number text,
  p_net_type net_type,
  p_mesh_size_mm numeric,
  p_dimensions text default null,
  p_max_allowed_days_in_water integer default 60,
  p_notes text default null
) returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_net_id uuid;
begin
  perform require_role('supervisor');

  insert into nets (
    net_number, net_type, mesh_size_mm, dimensions,
    max_allowed_days_in_water, notes, current_status, created_by, updated_by
  ) values (
    p_net_number, p_net_type, p_mesh_size_mm, p_dimensions,
    coalesce(p_max_allowed_days_in_water, 60), p_notes, 'in_store', auth.uid(), auth.uid()
  ) returning id into v_net_id;

  insert into net_events (net_id, user_id, action, comments)
  values (v_net_id, auth.uid(), 'created', p_notes);

  return v_net_id;
end;
$$;


create or replace function edit_net(
  p_net_id uuid,
  p_net_number text default null,
  p_mesh_size_mm numeric default null,
  p_dimensions text default null,
  p_max_allowed_days_in_water integer default null,
  p_notes text default null,
  p_manually_flagged boolean default null,
  p_comments text default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  perform require_role('supervisor');

  update nets set
    net_number = coalesce(p_net_number, net_number),
    mesh_size_mm = coalesce(p_mesh_size_mm, mesh_size_mm),
    dimensions = coalesce(p_dimensions, dimensions),
    max_allowed_days_in_water = coalesce(p_max_allowed_days_in_water, max_allowed_days_in_water),
    notes = coalesce(p_notes, notes),
    manually_flagged = coalesce(p_manually_flagged, manually_flagged),
    updated_by = auth.uid(),
    updated_at = now()
  where id = p_net_id;

  if not found then
    raise exception 'Net not found.';
  end if;

  insert into net_events (net_id, user_id, action, comments)
  values (p_net_id, auth.uid(), 'edited', p_comments);

  return jsonb_build_object('status', 'ok');
end;
$$;


create or replace function install_net(
  p_net_id uuid,
  p_cage_id uuid,
  p_date_in date,
  p_comments text default null,
  p_client_generated_id uuid default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing net_events%rowtype;
  v_net nets%rowtype;
  v_cage cages%rowtype;
  v_valid_mesh boolean;
  v_deployment_id uuid;
begin
  perform require_role('supervisor');

  if p_client_generated_id is not null then
    select * into v_existing from net_events where client_generated_id = p_client_generated_id;
    if found then
      return jsonb_build_object('status', 'already_processed', 'action', v_existing.action);
    end if;
  end if;

  select * into v_net from nets where id = p_net_id for update;
  if not found then
    raise exception 'Net not found.';
  end if;
  if v_net.current_status = 'scrapped' then
    raise exception 'This net has been scrapped and cannot be installed.';
  end if;

  select * into v_cage from cages where id = p_cage_id;
  if not found then
    raise exception 'Cage not found.';
  end if;

  select exists(
    select 1 from mesh_size_options
    where site_id = v_cage.site_id
      and net_type = v_net.net_type
      and mesh_size_mm = v_net.mesh_size_mm
  ) into v_valid_mesh;
  if not v_valid_mesh then
    raise exception 'Net % is a % mm % — that mesh size is not used at this cage''s site.',
      v_net.net_number, v_net.mesh_size_mm, v_net.net_type;
  end if;

  if p_date_in > (now() at time zone 'Asia/Dubai')::date then
    raise exception 'Date in cannot be in the future.';
  end if;

  begin
    insert into net_deployments (net_id, net_type, cage_id, date_in, comments, installed_by)
    values (p_net_id, v_net.net_type, p_cage_id, p_date_in, p_comments, auth.uid())
    returning id into v_deployment_id;
  exception when unique_violation then
    -- Someone else already has this net in the water, or this cage's slot
    -- for this net type is already filled. This is the offline-conflict
    -- case: never silently drop the attempt or silently overwrite the
    -- winner — log it and hand it to a supervisor to sort out.
    insert into net_events (net_id, user_id, action, cage_id, comments, client_generated_id, metadata)
    values (
      p_net_id, auth.uid(), 'install_rejected_conflict', p_cage_id, p_comments, p_client_generated_id,
      jsonb_build_object('attempted_date_in', p_date_in)
    );
    return jsonb_build_object(
      'status', 'conflict',
      'message', 'This net (or this cage''s slot) was already claimed by another action. A supervisor needs to review it on the Needs Attention screen.'
    );
  end;

  update nets set current_status = 'installed', updated_by = auth.uid(), updated_at = now()
  where id = p_net_id;

  insert into net_events (net_id, user_id, action, cage_id, to_status, comments, client_generated_id)
  values (p_net_id, auth.uid(), 'installed', p_cage_id, 'installed', p_comments, p_client_generated_id);

  return jsonb_build_object('status', 'ok', 'deployment_id', v_deployment_id);
end;
$$;


create or replace function remove_net(
  p_deployment_id uuid,
  p_hole_count_at_removal integer,
  p_destination_status net_status,
  p_comments text default null,
  p_client_generated_id uuid default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing net_events%rowtype;
  v_deployment net_deployments%rowtype;
begin
  perform require_role('supervisor');

  if p_client_generated_id is not null then
    select * into v_existing from net_events where client_generated_id = p_client_generated_id;
    if found then
      return jsonb_build_object('status', 'already_processed', 'action', v_existing.action);
    end if;
  end if;

  if p_hole_count_at_removal < 0 then
    raise exception 'Hole count cannot be negative.';
  end if;
  if p_destination_status = 'installed' then
    raise exception 'Destination status cannot be "installed" — use the install action for that.';
  end if;
  if p_destination_status = 'scrapped' then
    raise exception 'Removing a net can''t scrap it directly. Remove it to another status first, then use the Scrap action (administrators only).';
  end if;

  select * into v_deployment from net_deployments where id = p_deployment_id for update;
  if not found then
    raise exception 'Deployment not found.';
  end if;
  if v_deployment.date_out is not null then
    raise exception 'This net was already removed.';
  end if;

  update net_deployments set
    date_out = (now() at time zone 'Asia/Dubai')::date,
    hole_count_at_removal = p_hole_count_at_removal,
    removed_by = auth.uid(),
    comments = coalesce(p_comments, comments)
  where id = p_deployment_id;

  update nets set
    current_status = p_destination_status,
    hole_count = p_hole_count_at_removal,
    updated_by = auth.uid(),
    updated_at = now()
  where id = v_deployment.net_id;

  insert into net_events (net_id, user_id, action, cage_id, to_status, hole_count, comments, client_generated_id)
  values (v_deployment.net_id, auth.uid(), 'removed', v_deployment.cage_id, p_destination_status, p_hole_count_at_removal, p_comments, p_client_generated_id);

  return jsonb_build_object('status', 'ok');
end;
$$;


create or replace function update_hole_count(
  p_net_id uuid,
  p_hole_count integer,
  p_comments text default null,
  p_client_generated_id uuid default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing net_events%rowtype;
begin
  perform require_role('supervisor');

  if p_client_generated_id is not null then
    select * into v_existing from net_events where client_generated_id = p_client_generated_id;
    if found then
      return jsonb_build_object('status', 'already_processed', 'action', v_existing.action);
    end if;
  end if;

  if p_hole_count < 0 then
    raise exception 'Hole count cannot be negative.';
  end if;

  update nets set hole_count = p_hole_count, updated_by = auth.uid(), updated_at = now()
  where id = p_net_id;
  if not found then
    raise exception 'Net not found.';
  end if;

  insert into net_events (net_id, user_id, action, hole_count, comments, client_generated_id)
  values (p_net_id, auth.uid(), 'hole_count_updated', p_hole_count, p_comments, p_client_generated_id);

  return jsonb_build_object('status', 'ok');
end;
$$;


create or replace function change_status(
  p_net_id uuid,
  p_to_status net_status,
  p_comments text default null,
  p_client_generated_id uuid default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing net_events%rowtype;
  v_net nets%rowtype;
begin
  perform require_role('supervisor');

  if p_client_generated_id is not null then
    select * into v_existing from net_events where client_generated_id = p_client_generated_id;
    if found then
      return jsonb_build_object('status', 'already_processed', 'action', v_existing.action);
    end if;
  end if;

  select * into v_net from nets where id = p_net_id for update;
  if not found then
    raise exception 'Net not found.';
  end if;
  if p_to_status = 'installed' then
    raise exception 'Use the install action to put a net in the water.';
  end if;
  if v_net.current_status = 'installed' then
    raise exception 'This net is currently installed — remove it from the water first.';
  end if;
  if v_net.current_status = 'scrapped' then
    raise exception 'This net has been scrapped and its status cannot change.';
  end if;

  update nets set current_status = p_to_status, updated_by = auth.uid(), updated_at = now()
  where id = p_net_id;

  insert into net_events (net_id, user_id, action, from_status, to_status, comments, client_generated_id)
  values (p_net_id, auth.uid(), 'status_changed', v_net.current_status, p_to_status, p_comments, p_client_generated_id);

  return jsonb_build_object('status', 'ok');
end;
$$;


create or replace function scrap_net(
  p_net_id uuid,
  p_comments text default null,
  p_client_generated_id uuid default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
declare
  v_existing net_events%rowtype;
  v_net nets%rowtype;
begin
  perform require_role('admin');

  if p_client_generated_id is not null then
    select * into v_existing from net_events where client_generated_id = p_client_generated_id;
    if found then
      return jsonb_build_object('status', 'already_processed', 'action', v_existing.action);
    end if;
  end if;

  select * into v_net from nets where id = p_net_id for update;
  if not found then
    raise exception 'Net not found.';
  end if;
  if v_net.current_status = 'installed' then
    raise exception 'This net is currently installed — remove it from the water before scrapping it.';
  end if;

  update nets set current_status = 'scrapped', updated_by = auth.uid(), updated_at = now()
  where id = p_net_id;

  insert into net_events (net_id, user_id, action, from_status, to_status, comments, client_generated_id)
  values (p_net_id, auth.uid(), 'scrapped', v_net.current_status, 'scrapped', p_comments, p_client_generated_id);

  return jsonb_build_object('status', 'ok');
end;
$$;


create or replace function acknowledge_conflict(
  p_net_event_id uuid,
  p_resolution_notes text default null
) returns jsonb
language plpgsql
security definer set search_path = public
as $$
begin
  perform require_role('supervisor');

  insert into conflict_acknowledgements (net_event_id, acknowledged_by, resolution_notes)
  values (p_net_event_id, auth.uid(), p_resolution_notes)
  on conflict (net_event_id) do nothing;

  return jsonb_build_object('status', 'ok');
end;
$$;


-- ============================================================================
-- SECTION 8 — Row Level Security (the real access control)
-- ============================================================================
-- These rules run inside the database itself. Even if someone bypassed the
-- app entirely and called Supabase directly, these rules still apply — this
-- is why RLS is the real control, not just hiding buttons in the UI.
--
-- The pattern used everywhere below:
--   - viewer, supervisor, and admin can all READ (select) everything.
--   - Nobody can INSERT/UPDATE/DELETE the core tables directly — every
--     change must go through one of the functions in Section 7, which each
--     check the caller's role themselves before doing anything. This is
--     what guarantees every change is properly role-checked AND leaves a
--     matching audit trail — there's no back door that skips the log.
--   - Lookup tables (sites/cages/mesh sizes) can be edited directly by
--     admins only, since those are simple reference data, not audited
--     events.

alter table sites enable row level security;
alter table cages enable row level security;
alter table mesh_size_options enable row level security;
alter table profiles enable row level security;
alter table nets enable row level security;
alter table net_deployments enable row level security;
alter table net_events enable row level security;
alter table conflict_acknowledgements enable row level security;

-- Anyone signed in can view the lookup lists (sites, cages, mesh options) —
-- these aren't sensitive and every screen needs them for dropdowns/filters.
create policy sites_select on sites for select to authenticated using (true);
create policy cages_select on cages for select to authenticated using (true);
create policy mesh_options_select on mesh_size_options for select to authenticated using (true);

-- Only admins can edit the lookup lists — e.g. adding a new mesh size.
create policy sites_admin_write on sites for all to authenticated using (is_admin()) with check (is_admin());
create policy cages_admin_write on cages for all to authenticated using (is_admin()) with check (is_admin());
create policy mesh_options_admin_write on mesh_size_options for all to authenticated using (is_admin()) with check (is_admin());

-- Everyone signed in can see everyone's name/role (needed to show "installed
-- by Ahmed" in the register and reports). Only an admin can change a role.
create policy profiles_select on profiles for select to authenticated using (true);
create policy profiles_admin_update on profiles for update to authenticated using (is_admin()) with check (is_admin());

-- Every signed-in role (including viewer) can read the net register, its
-- deployment history, and the audit log — read access is not restricted by
-- role, only write access is.
create policy nets_select on nets for select to authenticated using (true);
create policy deployments_select on net_deployments for select to authenticated using (true);
create policy events_select on net_events for select to authenticated using (true);
create policy conflict_ack_select on conflict_acknowledgements for select to authenticated using (true);
-- No insert/update/delete policy on conflict_acknowledgements — only the
-- acknowledge_conflict() function above can write here.

-- Deliberately no insert/update/delete policies on nets, net_deployments,
-- or net_events for the authenticated role: all writes happen through the
-- SECURITY DEFINER functions in Section 7, which enforce supervisor/admin
-- checks themselves. A viewer account calling those functions gets a clear
-- "Only a supervisor or administrator can do that" error; a viewer trying
-- to write to the tables directly is blocked by RLS with no matching policy.

-- Functions run with elevated privileges (SECURITY DEFINER) so they can
-- write despite the policies above, but only after they've checked the
-- caller's role themselves. Lock down who may even call them.
revoke execute on all functions in schema public from public;
grant execute on all functions in schema public to authenticated;
grant select on v_unacknowledged_conflicts to authenticated;
-- Ensures functions added in future migrations are callable too, without
-- needing a separate grant statement added by hand each time.
alter default privileges in schema public grant execute on functions to authenticated;


-- ============================================================================
-- SECTION 9 — Seed data: sites, cages, mesh sizes
-- ============================================================================
-- This is real operational reference data (not sample/fake nets), so it's
-- included directly in the schema rather than a separate optional script.

insert into sites (name, code, diameter_m) values
  ('Station-05', 'STATION-05', 15),
  ('Offshore', 'OFFSHORE', 20);

insert into cages (site_id, cage_number, diameter_m)
select (select id from sites where code = 'STATION-05'), 'C' || lpad(g::text, 2, '0'), 15
from generate_series(1, 20) as g;

insert into cages (site_id, cage_number, diameter_m)
select (select id from sites where code = 'OFFSHORE'), 'OC' || lpad(g::text, 2, '0'), 20
from generate_series(1, 24) as g;

insert into mesh_size_options (site_id, net_type, mesh_size_mm)
select (select id from sites where code = 'STATION-05'), 'cage_net', v
from unnest(array[10, 12, 22]) as v;

insert into mesh_size_options (site_id, net_type, mesh_size_mm)
values ((select id from sites where code = 'STATION-05'), 'guard_net', 80);

insert into mesh_size_options (site_id, net_type, mesh_size_mm)
select (select id from sites where code = 'OFFSHORE'), 'cage_net', v
from unnest(array[10, 15, 20]) as v;

insert into mesh_size_options (site_id, net_type, mesh_size_mm)
values ((select id from sites where code = 'OFFSHORE'), 'guard_net', 55);

-- ============================================================================
-- End of script. Next: follow SETUP.md to create your first admin user.
-- ============================================================================
