-- ============================================================================
-- netlog — Migration 0002 (Phase 3)
-- ============================================================================
-- Run this in the Supabase SQL Editor on your EXISTING project (the one you
-- already ran supabase/schema.sql on). It's safe to run — it doesn't touch
-- any of your existing nets, cages, or history, it only fixes/adds a couple
-- of database functions and one small new table.
--
-- What this does, in plain English:
-- 1. Fixes a gap in "Remove a net": until now, a supervisor could
--    accidentally scrap a net while removing it, when scrapping is meant
--    to be an admin-only action. Removing a net can no longer set its
--    status straight to "scrapped" — scrapping now only happens through
--    the dedicated (admin-only) scrap action.
-- 2. Adds support for the offline "Needs Attention" screen (Phase 3): a
--    small table + function that lets a supervisor mark an offline-sync
--    conflict as reviewed, without ever editing the permanent history log.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Fix 1: remove_net can no longer be used to scrap a net.
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
-- Fix 2: conflict acknowledgements for the offline "Needs Attention" screen.
-- ----------------------------------------------------------------------------
create table conflict_acknowledgements (
  id uuid primary key default gen_random_uuid(),
  net_event_id uuid not null references net_events(id) unique,
  acknowledged_by uuid not null references profiles(id),
  acknowledged_at timestamptz not null default now(),
  resolution_notes text
);
comment on table conflict_acknowledgements is 'Marks an install_rejected_conflict event as reviewed by a supervisor/admin. Never modifies net_events itself — the audit log stays permanent and append-only; this is a separate record that someone looked at it.';

alter table conflict_acknowledgements enable row level security;

create policy conflict_ack_select on conflict_acknowledgements for select to authenticated using (true);
-- No direct insert/update/delete policy — only the function below can write here.

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

-- Make sure this new function (and any future ones) can actually be called —
-- schema.sql's blanket grant only covered functions that existed at the time.
alter default privileges in schema public grant execute on functions to authenticated;
grant execute on function acknowledge_conflict(uuid, text) to authenticated;
grant select on v_unacknowledged_conflicts to authenticated;

-- ============================================================================
-- End of migration 0002.
-- ============================================================================
