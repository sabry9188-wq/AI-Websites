-- ============================================================================
-- netlog — Migration 0003
-- ============================================================================
-- Run this in the Supabase SQL Editor on your existing project. Safe to
-- run — it doesn't touch your existing nets' identity or history, it only
-- changes how a net's size is recorded and adds two calculated columns.
--
-- What this does, in plain English:
-- 1. Replaces the single free-text "Dimensions" field on a net with two
--    real number fields: Circumference (m) and Depth (m) — matching how
--    the farm's old spreadsheet tracked net size, and letting the app sort
--    and export them properly instead of as one typed-in sentence.
-- 2. Adds two new calculated fields to the net register: "Change Date"
--    (the calendar date a net is due for changing — Date In + Max Allowed
--    Days) and "Days Overdue" (0 if not overdue, otherwise how many days
--    past due). Both are computed the same way everywhere, same as every
--    other calculated field in this project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Step 1: swap the dimensions field for circumference_m / depth_m.
-- ----------------------------------------------------------------------------
alter table nets add column circumference_m numeric(6, 2);
alter table nets add column depth_m numeric(6, 2);
alter table nets drop column dimensions;

-- ----------------------------------------------------------------------------
-- Step 2: recreate v_net_status (with the new fields) and v_dashboard_summary
-- (which reads from it, so it has to be dropped and recreated too).
-- ----------------------------------------------------------------------------
drop view if exists v_dashboard_summary;
drop view if exists v_net_status;

create view v_net_status as
select
  n.id as net_id,
  n.net_number,
  n.net_type,
  n.mesh_size_mm,
  n.circumference_m,
  n.depth_m,
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
  case when d.id is not null
    then d.date_in + n.max_allowed_days_in_water
    else null
  end as change_due_date,
  case when d.id is not null
    and (n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in)) < 0
    then abs(n.max_allowed_days_in_water - ((now() at time zone 'Asia/Dubai')::date - d.date_in))
    else 0
  end as days_overdue,
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

comment on view v_net_status is 'One row per net with every calculated field (days in water, days left, change due date, days overdue, overdue, change required, color). This is what the Net Register table, dashboard, and reports all read from, so they can never disagree. Change Required = overdue OR hole_count > 10 OR manually flagged. Color reflects days-left only: red = overdue, orange = 0-6 days left, yellow = 7-15, green = 16+.';

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

-- ----------------------------------------------------------------------------
-- Step 3: update create_net / edit_net to use circumference_m / depth_m
-- instead of dimensions. Changing a function's parameter list creates a
-- second overloaded function instead of replacing the old one, so the old
-- versions are dropped first.
-- ----------------------------------------------------------------------------
drop function if exists create_net(text, net_type, numeric, text, integer, text);
drop function if exists edit_net(uuid, text, numeric, text, integer, text, boolean, text);

create or replace function create_net(
  p_net_number text,
  p_net_type net_type,
  p_mesh_size_mm numeric,
  p_circumference_m numeric default null,
  p_depth_m numeric default null,
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
    net_number, net_type, mesh_size_mm, circumference_m, depth_m,
    max_allowed_days_in_water, notes, current_status, created_by, updated_by
  ) values (
    p_net_number, p_net_type, p_mesh_size_mm, p_circumference_m, p_depth_m,
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
  p_circumference_m numeric default null,
  p_depth_m numeric default null,
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
    circumference_m = coalesce(p_circumference_m, circumference_m),
    depth_m = coalesce(p_depth_m, depth_m),
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

-- New/changed function signatures need the same callable-by-authenticated
-- grant as everything else (schema.sql's blanket grant only covered
-- functions that existed when it first ran).
grant execute on function create_net(text, net_type, numeric, numeric, numeric, integer, text) to authenticated;
grant execute on function edit_net(uuid, text, numeric, numeric, numeric, integer, text, boolean, text) to authenticated;

-- ============================================================================
-- End of migration 0003.
-- ============================================================================
