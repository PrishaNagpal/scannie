interface BadgeProps {
  priority: string | null
  size?: "sm" | "md"
}

export function PriorityBadge({ priority }: BadgeProps) {
  const p = priority?.toLowerCase() || "info"

  const classMap: Record<string, string> = {
    critical: "badge-critical",
    high: "badge-high",
    medium: "badge-medium",
    low: "badge-low",
    info: "badge-info"
  }

  const label = priority?.toUpperCase() || "INFO"
  const className = classMap[p] || "badge-info"

  return <span className={className}>{label}</span>
}

interface CategoryBadgeProps {
  category: string
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const colorMap: Record<string, string> = {
    remote_access: "text-purple-400 bg-purple-400/10 border-purple-400/30",
    web_service: "text-blue-400 bg-blue-400/10 border-blue-400/30",
    database: "text-red-400 bg-red-400/10 border-red-400/30",
    misconfig: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    tls_issue: "text-orange-400 bg-orange-400/10 border-orange-400/30",
    open_port: "text-gray-400 bg-gray-400/10 border-gray-400/30"
  }

  const classes = colorMap[category] ||
    "text-gray-400 bg-gray-400/10 border-gray-400/30"

  return (
    <span className={`text-xs font-medium px-2 py-1 rounded border ${classes}`}>
      {category.replace(/_/g, " ")}
    </span>
  )
}
