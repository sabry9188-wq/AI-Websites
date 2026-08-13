export type UserRole = "admin" | "supervisor" | "viewer";

export type NetType = "cage_net" | "guard_net";

export type NetStatus =
  | "in_store"
  | "installed"
  | "washing"
  | "repair"
  | "ready"
  | "scrapped";

export type NetEventAction =
  | "created"
  | "installed"
  | "removed"
  | "status_changed"
  | "hole_count_updated"
  | "edited"
  | "scrapped"
  | "install_rejected_conflict";

export type ColorCode = "red" | "orange" | "yellow" | "green" | null;

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  name: string;
  code: string;
  diameter_m: number;
  created_at: string;
}

export interface Cage {
  id: string;
  site_id: string;
  cage_number: string;
  diameter_m: number;
  created_at: string;
}

export interface MeshSizeOption {
  id: string;
  site_id: string;
  net_type: NetType;
  mesh_size_mm: number;
  created_at: string;
}

export interface Net {
  id: string;
  net_number: string;
  net_type: NetType;
  mesh_size_mm: number;
  circumference_m: number | null;
  depth_m: number | null;
  max_allowed_days_in_water: number;
  current_status: NetStatus;
  hole_count: number;
  manually_flagged: boolean;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface NetDeployment {
  id: string;
  net_id: string;
  net_type: NetType;
  cage_id: string;
  date_in: string;
  date_out: string | null;
  hole_count_at_removal: number | null;
  comments: string | null;
  installed_by: string;
  removed_by: string | null;
  created_at: string;
}

export interface NetEvent {
  id: string;
  net_id: string;
  event_timestamp: string;
  user_id: string | null;
  action: NetEventAction;
  cage_id: string | null;
  from_status: NetStatus | null;
  to_status: NetStatus | null;
  hole_count: number | null;
  comments: string | null;
  metadata: Record<string, unknown>;
  client_generated_id: string | null;
}

/** Row shape of the `v_net_status` view — the single source of truth for
 * every calculated field (days in water, days left, change due date, days
 * overdue, overdue, change required, color). Read from this view, never
 * recompute these in the UI. */
export interface NetStatusView {
  net_id: string;
  net_number: string;
  net_type: NetType;
  mesh_size_mm: number;
  circumference_m: number | null;
  depth_m: number | null;
  max_allowed_days_in_water: number;
  current_status: NetStatus;
  hole_count: number;
  manually_flagged: boolean;
  notes: string | null;
  active_deployment_id: string | null;
  cage_id: string | null;
  cage_number: string | null;
  site_id: string | null;
  site_name: string | null;
  date_in: string | null;
  days_in_water: number | null;
  days_left: number | null;
  change_due_date: string | null;
  days_overdue: number;
  overdue: boolean;
  change_required: boolean;
  color_code: ColorCode;
  created_at: string;
  updated_at: string;
}

export interface CageCurrentView {
  cage_id: string;
  cage_number: string;
  site_id: string;
  site_name: string;
  cage_net_id: string | null;
  cage_net_number: string | null;
  cage_net_date_in: string | null;
  guard_net_id: string | null;
  guard_net_number: string | null;
  guard_net_date_in: string | null;
  has_cage_net: boolean;
  has_guard_net: boolean;
}

export interface DashboardSummaryView {
  total_nets: number;
  nets_in_water: number;
  nets_in_store: number;
  due_for_change_7d: number;
  overdue_count: number;
  nets_with_holes: number;
  avg_days_in_water: number | null;
}

/** Structured result returned by the RPC functions in supabase/schema.sql. */
export interface RpcResult {
  status: "ok" | "conflict" | "already_processed";
  message?: string;
  deployment_id?: string;
  action?: NetEventAction;
}
