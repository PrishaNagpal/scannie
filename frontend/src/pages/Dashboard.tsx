import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, ScanSearch, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { getScans } from "../api/scans"
import { StatusBadge } from "../components/ui/StatusBadge"
import type { Scan } from "../types/index"

export function Dashboard() {
  const navigate = useNavigate()
  const [scans, setScans] = useState<Scan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchScans()
  }, [])

  const fetchScans = async () => {
    try {
      const data = await getScans()
      setScans(data)
    } catch (err) {
      setError("Failed to load scans")
    } finally {
      setLoading(false)
    }
  }

  const completed = scans.filter(s => s.status === "completed").length
  const running = scans.filter(s => s.status === "running").length
  const failed = scans.filter(s => s.status === "failed").length
  const pending = scans.filter(s => s.status === "pending").length

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>
            Overview of all your security scans
          </p>
        </div>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => navigate("/scan/new")}
        >
          <Plus className="w-4 h-4" />
          New Scan
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <ScanSearch className="w-8 h-8" style={{ color: "#00d4ff" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
                {scans.length}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Total Scans
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" style={{ color: "#10b981" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
                {completed}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Completed
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8" style={{ color: "#3b82f6" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
                {running + pending}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                In Progress
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8" style={{ color: "#ef4444" }} />
            <div>
              <p className="text-2xl font-bold" style={{ color: "#e2e8f0" }}>
                {failed}
              </p>
              <p className="text-xs" style={{ color: "#94a3b8" }}>
                Failed
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scans table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#1e2d4a" }}>
          <h2 className="font-semibold" style={{ color: "#e2e8f0" }}>
            Recent Scans
          </h2>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center" style={{ color: "#94a3b8" }}>
            Loading scans...
          </div>
        ) : error ? (
          <div className="px-5 py-8 text-center" style={{ color: "#ff3b3b" }}>
            {error}
          </div>
        ) : scans.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ScanSearch className="w-12 h-12 mx-auto mb-3"
                        style={{ color: "#475569" }} />
            <p className="font-medium" style={{ color: "#94a3b8" }}>
              No scans yet
            </p>
            <p className="text-sm mt-1" style={{ color: "#475569" }}>
              Start your first scan to see results here
            </p>
            <button
              className="btn-primary mt-4"
              onClick={() => navigate("/scan/new")}
            >
              Start First Scan
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #1e2d4a" }}>
                {["Target", "Status", "Findings", "Plugins", "Started", ""].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium"
                      style={{ color: "#475569" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scans.map((scan, i) => (
                <tr
                  key={scan.id}
                  style={{
                    borderBottom: i < scans.length - 1
                      ? "1px solid #1e2d4a" : "none",
                    cursor: "pointer"
                  }}
                  className="hover:bg-bg-tertiary transition-colors"
                  onClick={() => navigate(`/scan/${scan.id}`)}
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-sm"
                          style={{ color: "#00d4ff" }}>
                      {scan.target}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={scan.status} />
                  </td>
                  <td className="px-5 py-4">
                    <span style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      fontFamily: "JetBrains Mono, monospace",
                      color: (scan.findings_count ?? 0) > 0
                        ? "#ff6b35"
                        : "#475569"
                    }}>
                      {scan.findings_count ?? 0}
                      <span style={{
                        color: "#475569",
                        fontWeight: 400,
                        fontSize: "11px"
                      }}>
                        {" "}findings
                      </span>
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-1 flex-wrap">
                      {scan.plugins_used.map(p => (
                        <span key={p}
                              className="text-xs px-2 py-0.5 rounded font-mono"
                              style={{
                                background: "rgba(0,212,255,0.1)",
                                color: "#00d4ff",
                                border: "1px solid rgba(0,212,255,0.2)"
                              }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm" style={{ color: "#94a3b8" }}>
                    {new Date(scan.created_at + "Z").toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-xs" style={{ color: "#475569" }}>
                      View →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
