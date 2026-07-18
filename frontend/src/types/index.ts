// Matches your backend Pydantic schemas exactly

export interface Scan {
  id: string
  target: string
  status: "pending" | "running" | "completed" | "failed"
  plugins_used: string[]
  consent_confirmed: boolean
  created_at: string
  completed_at: string | null
  error_message: string | null
}

export interface Finding {
  id: string
  scan_id: string
  target: string
  source_plugin: string
  category: string
  port: number | null
  service: string | null
  service_version: string | null
  raw_severity: string | null
  description: string
  evidence: string | null
  discovered_at: string
  ai_priority: string | null
  ai_reasoning: string | null
  suggested_fix: string | null
  correlation_group_id: string | null
  correlation_reason: string | null
}

export interface CorrelationGroup {
  correlation_group_id: string
  correlation_reason: string
  findings: {
    id: string
    description: string
    ai_priority: string | null
    category: string
  }[]
}

export interface Report {
  executive_summary: string
  technical_report: string
}

export interface ScanCreate {
  target: string
  plugins_used: string[]
  consent_confirmed: boolean
}

export type Priority = "critical" | "high" | "medium" | "low" | "info"
export type ScanStatus = "pending" | "running" | "completed" | "failed"
