import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Search } from "lucide-react"
import { getScans } from "../api/scans"
import { StatusBadge } from "../components/ui/StatusBadge"
import type { Scan, ScanStatus } from "../types/index"

export function History() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<Scan[]>([])
  const [filtered, setFiltered] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<ScanStatus | "all">("all")

  useEffect(() => {
    fetchScans()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [scans, search, statusFilter])

  const fetchScans = async () => {
    try {
      const data = await getScans()
      setScans(data)
    } catch (err) {
      console.error("Failed to load scans")
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...scans]

    if (search.trim()) {
      result = result.filter(s =>
        s.target.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (statusFilter !== "all") {
      result = result.filter(s => s.status === statusFilter)
    }

    setFiltered(result)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#e2e8f0",
          marginBottom: "6px"
        }}>
          Scan History
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          All past scans — search, filter, and review results
        </p>
      </div>

      {/* Filters */}
      <div style={{
        display: "flex",
        gap: "12px",
        marginBottom: "16px",
        flexWrap: "wrap"
      }}>
        {/* Search */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "#0f1629",
          border: "1px solid #1e2d4a",
          borderRadius: "6px",
          padding: "8px 12px",
          flex: 1,
          minWidth: "200px"
        }}>
          <Search style={{
            width: "14px",
            height: "14px",
            color: "#475569",
            flexShrink: 0
          }} />
          <input
            type="text"
            placeholder="Search by target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              background: "none",
              border: "none",
              outline: "none",
              color: "#e2e8f0",
              fontSize: "13px",
              width: "100%"
            }}
          />
        </div>

        {/* Status filter */}
        <div style={{
          display: "flex",
          gap: "4px",
          background: "#0f1629",
          border: "1px solid #1e2d4a",
          borderRadius: "6px",
          padding: "4px"
        }}>
          {(["all", "completed", "failed", "pending"] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: "6px 12px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                fontSize: "12px",
                fontWeight: "500",
                transition: "all 0.2s ease",
                background: statusFilter === s
                  ? "rgba(0,212,255,0.1)"
                  : "transparent",
                color: statusFilter === s ? "#00d4ff" : "#475569",
                boxShadow: statusFilter === s
                  ? "0 0 0 1px rgba(0,212,255,0.2)"
                  : "none"
              }}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {/* Count */}
        <div style={{
          display: "flex",
          alignItems: "center",
          padding: "8px 12px",
          fontSize: "12px",
          color: "#475569"
        }}>
          {filtered.length} of {scans.length} scans
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{
            padding: "40px",
            textAlign: "center",
            color: "#94a3b8"
          }}>
            Loading history...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            padding: "40px",
            textAlign: "center",
            color: "#475569"
          }}>
            {search || statusFilter !== "all"
              ? "No scans match your filters"
              : "No scan history yet"
            }
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                {["Target", "Status", "Findings", "Plugins", "Started", "Duration", ""].map(h => (
                  <th key={h} style={{
                    padding: "12px 20px",
                    textAlign: "left",
                    fontSize: "11px",
                    fontWeight: "600",
                    color: "#475569",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase"
                  }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((scan, i) => {
                const duration = scan.completed_at
                  ? Math.round(
                      (new Date(scan.completed_at).getTime() -
                       new Date(scan.created_at).getTime()) / 1000
                    )
                  : null

                return (
                  <tr
                    key={scan.id}
                    style={{
                      borderBottom: i < filtered.length - 1
                        ? "1px solid #1e2d4a" : "none",
                      cursor: "pointer",
                      transition: "background 0.15s ease"
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = "#1a2035")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = "transparent")
                    }
                    onClick={() => navigate(`/scan/${scan.id}`)}
                  >
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        fontFamily: "JetBrains Mono, monospace",
                        fontSize: "13px",
                        fontWeight: "500",
                        color: "#00d4ff"
                      }}>
                        {scan.target}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <StatusBadge status={scan.status} />
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <span style={{
                        fontSize: "13px",
                        fontWeight: "600",
                        fontFamily: "JetBrains Mono, monospace",
                        color: (scan.findings_count ?? 0) > 0
                          ? "#ff6b35" : "#475569"
                      }}>
                        {scan.findings_count ?? 0}
                      </span>
                    </td>
                    <td style={{ padding: "14px 20px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {scan.plugins_used.map(p => (
                          <span key={p} style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "3px",
                            fontFamily: "JetBrains Mono, monospace",
                            background: "rgba(0,212,255,0.08)",
                            color: "#00d4ff",
                            border: "1px solid rgba(0,212,255,0.15)"
                          }}>
                            {p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{
                      padding: "14px 20px",
                      fontSize: "12px",
                      color: "#94a3b8"
                    }}>
                      {new Date(scan.created_at + "Z").toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td style={{
                      padding: "14px 20px",
                      fontSize: "12px",
                      color: "#475569",
                      fontFamily: "JetBrains Mono, monospace"
                    }}>
                      {duration !== null ? `${duration}s` : "—"}
                    </td>
                    <td style={{
                      padding: "14px 20px",
                      textAlign: "right"
                    }}>
                      <span style={{
                        fontSize: "11px",
                        color: "#475569"
                      }}>
                        View →
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
