import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ColorCode } from "@/types/database";

const COLOR_CLASSES: Record<NonNullable<ColorCode>, string> = {
  green: "bg-emerald-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-500",
  red: "bg-red-500",
};

const COLOR_LABEL: Record<NonNullable<ColorCode>, string> = {
  green: "More than 15 days left",
  yellow: "7–15 days left",
  orange: "0–6 days left",
  red: "Overdue",
};

/** The dashboard/register color code: green (>15 days left), yellow
 * (7–15), orange (0–6), red (overdue). Not shown for nets that aren't
 * currently in the water. */
export function ColorDot({ color }: { color: ColorCode }) {
  if (!color) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <Tooltip>
      <TooltipTrigger className="inline-flex items-center">
        <span
          className={cn("size-2.5 rounded-full", COLOR_CLASSES[color])}
          aria-label={COLOR_LABEL[color]}
        />
      </TooltipTrigger>
      <TooltipContent>{COLOR_LABEL[color]}</TooltipContent>
    </Tooltip>
  );
}
