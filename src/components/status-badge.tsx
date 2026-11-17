import { STATUS_STYLES, statusLabel } from "@/lib/status";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        STATUS_STYLES[status] ?? STATUS_STYLES.submitted,
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
