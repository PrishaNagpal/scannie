import type { ScanStatus } from "../../types"

interface StatusBadgeProps {
  status: ScanStatus
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = {
    pending: {
      dot: "bg-status-pending",
      text: "text-status-pending",
      label: "Pending",
      animate: false
    },
    running: {
      dot: "bg-status-running",
      text: "text-status-running",
      label: "Running",
      animate: true
    },
    completed: {
      dot: "bg-status-completed",
      text: "text-status-completed",
      label: "Completed",
      animate: false
    },
    failed: {
      dot: "bg-status-failed",
      text: "text-status-failed",
      label: "Failed",
      animate: false
    }
  }

  const { dot, text, label, animate } = config[status]

  return (
    <span className={`flex items-center gap-1.5 text-sm font-medium ${text}`}>
      <span
        className={`status-dot ${dot} ${animate ? "animate-pulse" : ""}`}
      />
      {label}
    </span>
  )
}
