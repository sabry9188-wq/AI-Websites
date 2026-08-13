/** Shared `items` list for every net-type Select in the app — base-ui's
 * Select only shows a proper label (instead of the raw "cage_net" value)
 * when given this. */
export const NET_TYPE_ITEMS = [
  { value: "cage_net", label: "Cage Net" },
  { value: "guard_net", label: "Guard Net" },
] as const;
