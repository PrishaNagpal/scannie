import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Shield, AlertTriangle,
  Link, FileText, RefreshCw
} from "lucide-react"
import { getScan, getFindings, getCorrelations, getReport } from "../api/scans"
import { PriorityBadge, CategoryBadge } from "../components/ui/Badge"
import { StatusBadge } from "../components/ui/StatusBadge"
import type { Scan, Finding, CorrelationGroup, Report } from "../types/index"

type Tab = "findings" | "correlations" | "report"

export function ScanResults() {
  const { scanId } = useParams<{ scanId: string }>()
  const navigate = useNavigate()

  const [scan, setScan] = useState<Scan | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const [correlations, setCorrelations] = useState<CorrelationGroup[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("findings")
  const [expandedFinding, setExpandedFinding] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [reportLoading, setReportLoading] = useState(false)
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (scanId) loadScan()
  }, [scanId])

  const loadScan = async () => {
    try {
      const scanData = await getScan(scanId!)
      setScan(scanData)

      if (scanData.status === "completed") {
        const [findingsData, correlationsData] = await Promise.all([
          getFindings(scanId!),
          getCorrelations(scanId!)
        ])
        setFindings(findingsData)
        setCorrelations(correlationsData)
      } else if (scanData.status === "running" || scanData.status === "pending") {
        setPolling(true)
        pollScan()
      }
    } catch (err) {
      console.error("Failed to load scan", err)
    } finally {
      setLoading(false)
    }
  }

  const pollScan = () => {
    const interval = setInterval(async () => {
      try {
        const scanData = await getScan(scanId!)
        setScan(scanData)

        if (scanData.status === "completed" || scanData.status === "failed") {
          clearInterval(interval)
          setPolling(false)

          if (scanData.status === "completed") {
            const [findingsData, correlationsData] = await Promise.all([
              getFindings(scanId!),
              getCorrelations(scanId!)
            ])
            setFindings(findingsData)
            setCorrelations(correlationsData)
          }
        }
      } catch (err) {
        clearInterval(interval)
        setPolling(false)
      }
    }, 4000)
  }

  const loadReport = async () => {
    if (report) { setActiveTab("report"); return }
    setReportLoading(true)
    try {
      const reportData = await getReport(scanId!)
      setReport(reportData)
      setActiveTab("report")
    } catch (err) {
      console.error("Failed to load report", err)
    } finally {
      setReportLoading(false)
    }
  }

  const highCount = findings.filter(f =>
    f.ai_priority === "high" || f.ai_priority === "critical"
  ).length
  const mediumCount = findings.filter(f => f.ai_priority === "medium").length
  const lowCount = findings.filter(f =>
    f.ai_priority === "low" || f.ai_priority === "info"
  ).length

  if (loading) {
    return (
      <div style={{ textAlign: "center", paddingTop: "80px" }}>
        <div style={{ color: "#94a3b8", fontSize: "14px" }}>
          Loading scan results...
        </div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div style={{ textAlign: "center", paddingTop: "80px" }}>
        <div style={{ color: "#ff3b3b", fontSize: "14px" }}>
          Scan not found
        </div>
      </div>
    )
  }

  return (
    <div>

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          color: "#94a3b8",
          fontSize: "13px",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginBottom: "20px",
          padding: 0
        }}
      >
        <ArrowLeft style={{ width: "14px", height: "14px" }} />
        Back to Dashboard
      </button>

      {/* Scan header */}
      <div className="card" style={{ marginBottom: "16px" }}>
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "6px"
            }}>
              <span style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "20px",
                fontWeight: "700",
                color: "#00d4ff"
              }}>
                {scan.target}
              </span>
              <StatusBadge status={scan.status} />
            </div>
            <div style={{
              display: "flex",
              gap: "16px",
              flexWrap: "wrap"
            }}>
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Started: {new Date(scan.created_at + "Z").toLocaleString("en-IN")}
              </span>
              {scan.completed_at && (
                <span style={{ fontSize: "12px", color: "#475569" }}>
                  Completed: {new Date(scan.completed_at + "Z").toLocaleString("en-IN")}
                </span>
              )}
              <span style={{ fontSize: "12px", color: "#475569" }}>
                Scanners: {scan.plugins_used.join(", ")}
              </span>
            </div>
          </div>

          {/* Severity summary */}
          {findings.length > 0 && (
            <div style={{ display: "flex", gap: "12px" }}>
              {highCount > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#ff6b35"
                  }}>
                    {highCount}
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569" }}>HIGH</div>
                </div>
              )}
              {mediumCount > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#f59e0b"
                  }}>
                    {mediumCount}
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569" }}>MEDIUM</div>
                </div>
              )}
              {lowCount > 0 && (
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: "#10b981"
                  }}>
                    {lowCount}
                  </div>
                  <div style={{ fontSize: "10px", color: "#475569" }}>LOW</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Polling indicator */}
        {polling && (
          <div style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "6px",
            background: "rgba(59,130,246,0.08)",
            border: "1px solid rgba(59,130,246,0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "13px",
            color: "#3b82f6"
          }}>
            <RefreshCw style={{
              width: "14px",
              height: "14px",
              animation: "spin 1s linear infinite"
            }} />
            Scan in progress — results will appear automatically
          </div>
        )}

        {/* Failed message */}
        {scan.status === "failed" && scan.error_message && (
          <div style={{
            marginTop: "12px",
            padding: "10px 14px",
            borderRadius: "6px",
            background: "rgba(255,59,59,0.08)",
            border: "1px solid rgba(255,59,59,0.2)",
            fontSize: "13px",
            color: "#ff6b6b"
          }}>
            Error: {scan.error_message}
          </div>
        )}
      </div>

      {/* Tabs */}
      {scan.status === "completed" && (
        <>
          <div style={{
            display: "flex",
            gap: "4px",
            marginBottom: "16px",
            background: "#0f1629",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid #1e2d4a",
            width: "fit-content"
          }}>
            {([
              { id: "findings", label: `Findings (${findings.length})`, icon: Shield },
              { id: "correlations", label: `Correlations (${correlations.length})`, icon: Link },
              { id: "report", label: "Report", icon: FileText }
            ] as { id: Tab, label: string, icon: any }[]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => id === "report" ? loadReport() : setActiveTab(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "6px",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                  background: activeTab === id
                    ? "rgba(0,212,255,0.1)"
                    : "transparent",
                  color: activeTab === id ? "#00d4ff" : "#475569",
                  boxShadow: activeTab === id
                    ? "0 0 0 1px rgba(0,212,255,0.2)"
                    : "none"
                }}
              >
                <Icon style={{ width: "14px", height: "14px" }} />
                {reportLoading && id === "report" ? "Loading..." : label}
              </button>
            ))}
          </div>

          {/* Findings tab */}
          {activeTab === "findings" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {findings.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#94a3b8" }}>No findings for this scan</p>
                </div>
              ) : (
                findings.map(finding => (
                  <div
                    key={finding.id}
                    className="card"
                    style={{ cursor: "pointer", padding: "16px" }}
                    onClick={() => setExpandedFinding(
                      expandedFinding === finding.id ? null : finding.id
                    )}
                  >
                    {/* Finding header */}
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap"
                    }}>
                      <PriorityBadge
                        priority={finding.ai_priority || finding.raw_severity}
                      />
                      <CategoryBadge category={finding.category} />
                      {finding.port && (
                        <span style={{
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "12px",
                          color: "#00d4ff",
                          background: "rgba(0,212,255,0.08)",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          border: "1px solid rgba(0,212,255,0.15)"
                        }}>
                          :{finding.port}
                        </span>
                      )}
                      <span style={{
                        fontSize: "13px",
                        color: "#e2e8f0",
                        flex: 1
                      }}>
                        {finding.description}
                      </span>
                      <span style={{
                        fontSize: "11px",
                        color: "#475569",
                        fontFamily: "JetBrains Mono, monospace"
                      }}>
                        {finding.source_plugin}
                      </span>
                      <span style={{ color: "#475569", fontSize: "12px" }}>
                        {expandedFinding === finding.id ? "▲" : "▼"}
                      </span>
                    </div>

                    {/* Expanded details */}
                    {expandedFinding === finding.id && (
                      <div style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "1px solid #1e2d4a",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px"
                      }}>
                        {finding.service_version && (
                          <div>
                            <p style={{
                              fontSize: "11px",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px"
                            }}>
                              Service Version
                            </p>
                            <p style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "12px",
                              color: "#94a3b8"
                            }}>
                              {finding.service_version}
                            </p>
                          </div>
                        )}

                        {finding.ai_reasoning && (
                          <div>
                            <p style={{
                              fontSize: "11px",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px"
                            }}>
                              AI Analysis
                            </p>
                            <p style={{
                              fontSize: "13px",
                              color: "#94a3b8",
                              lineHeight: "1.6",
                              background: "rgba(0,212,255,0.04)",
                              padding: "10px 12px",
                              borderRadius: "6px",
                              borderLeft: "3px solid rgba(0,212,255,0.3)"
                            }}>
                              {finding.ai_reasoning}
                            </p>
                          </div>
                        )}

                        {finding.suggested_fix && (
                          <div>
                            <p style={{
                              fontSize: "11px",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px"
                            }}>
                              Suggested Fix
                            </p>
                            <p style={{
                              fontSize: "13px",
                              color: "#10b981",
                              lineHeight: "1.6",
                              background: "rgba(16,185,129,0.04)",
                              padding: "10px 12px",
                              borderRadius: "6px",
                              borderLeft: "3px solid rgba(16,185,129,0.3)"
                            }}>
                              {finding.suggested_fix}
                            </p>
                          </div>
                        )}

                        {finding.correlation_reason && (
                          <div>
                            <p style={{
                              fontSize: "11px",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px"
                            }}>
                              Correlation
                            </p>
                            <p style={{
                              fontSize: "13px",
                              color: "#f59e0b",
                              lineHeight: "1.6",
                              background: "rgba(245,158,11,0.04)",
                              padding: "10px 12px",
                              borderRadius: "6px",
                              borderLeft: "3px solid rgba(245,158,11,0.3)"
                            }}>
                              {finding.correlation_reason}
                            </p>
                          </div>
                        )}

                        {finding.evidence && (
                          <div>
                            <p style={{
                              fontSize: "11px",
                              color: "#475569",
                              textTransform: "uppercase",
                              letterSpacing: "1px",
                              marginBottom: "4px"
                            }}>
                              Raw Evidence
                            </p>
                            <pre style={{
                              fontFamily: "JetBrains Mono, monospace",
                              fontSize: "11px",
                              color: "#475569",
                              background: "#0a0e1a",
                              padding: "10px 12px",
                              borderRadius: "6px",
                              overflow: "auto",
                              whiteSpace: "pre-wrap",
                              wordBreak: "break-all",
                              margin: 0
                            }}>
                              {finding.evidence}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Correlations tab */}
          {activeTab === "correlations" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {correlations.length === 0 ? (
                <div className="card" style={{ textAlign: "center", padding: "40px" }}>
                  <p style={{ color: "#94a3b8" }}>
                    No correlation groups found
                  </p>
                </div>
              ) : (
                correlations.map(group => (
                  <div key={group.correlation_group_id} className="card">
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px"
                    }}>
                      <AlertTriangle style={{
                        width: "16px",
                        height: "16px",
                        color: "#f59e0b",
                        flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#f59e0b",
                        textTransform: "uppercase",
                        letterSpacing: "1px"
                      }}>
                        Compound Risk Detected
                      </span>
                    </div>

                    <p style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      lineHeight: "1.6",
                      marginBottom: "16px",
                      background: "rgba(245,158,11,0.04)",
                      padding: "12px",
                      borderRadius: "6px",
                      borderLeft: "3px solid rgba(245,158,11,0.4)"
                    }}>
                      {group.correlation_reason}
                    </p>

                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px"
                    }}>
                      <p style={{
                        fontSize: "11px",
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                        marginBottom: "4px"
                      }}>
                        Involved Findings ({group.findings.length})
                      </p>
                      {group.findings.map(f => (
                        <div key={f.id} style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          padding: "8px 10px",
                          borderRadius: "6px",
                          background: "#0a0e1a",
                          border: "1px solid #1e2d4a"
                        }}>
                          <PriorityBadge priority={f.ai_priority} />
                          <CategoryBadge category={f.category} />
                          <span style={{
                            fontSize: "12px",
                            color: "#94a3b8"
                          }}>
                            {f.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Report tab */}
          {activeTab === "report" && report && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Executive summary */}
              <div className="card">
                <h3 style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#e2e8f0",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <Shield style={{
                    width: "16px",
                    height: "16px",
                    color: "#00d4ff"
                  }} />
                  Executive Summary
                </h3>
                <p style={{
                  fontSize: "14px",
                  color: "#94a3b8",
                  lineHeight: "1.8",
                  whiteSpace: "pre-wrap"
                }}>
                  {report.executive_summary}
                </p>
              </div>

              {/* Technical report */}
              <div className="card">
                <h3 style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#e2e8f0",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <FileText style={{ width: "16px", height: "16px", color: "#7c3aed" }} />
                  Technical Report
                </h3>

                <div style={{
                  fontSize: "13px",
                  color: "#94a3b8",
                  lineHeight: "1.8"
                }}
                  className="markdown-report"
                >
                  {report.technical_report
                    .split("\n")
                    .map((line, i) => {
                      // H3 headers: ### text
                      if (line.startsWith("### ")) {
                        return (
                          <h3 key={i} style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: "#e2e8f0",
                            marginTop: "20px",
                            marginBottom: "8px",
                            paddingBottom: "4px",
                            borderBottom: "1px solid #1e2d4a"
                          }}>
                            {line.replace("### ", "")}
                          </h3>
                        )
                      }
                      // H2 headers: ** text **
                      if (line.startsWith("**") && line.endsWith("**") && !line.includes(":**")) {
                        return (
                          <h2 key={i} style={{
                            fontSize: "14px",
                            fontWeight: "700",
                            color: "#00d4ff",
                            marginTop: "24px",
                            marginBottom: "10px"
                          }}>
                            {line.replace(/\*\*/g, "")}
                          </h2>
                        )
                      }
                      // Bullet points: * text or - text
                      if (line.startsWith("* ") || line.startsWith("- ")) {
                        const text = line.replace(/^[*-] /, "")
                        // Handle **bold:** inside bullet
                        const formatted = text.replace(/\*\*(.*?)\*\*/g, (_, b) =>
                          `<strong style="color:#e2e8f0">${b}</strong>`
                        )
                        return (
                          <div key={i} style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "4px",
                            paddingLeft: "8px"
                          }}>
                            <span style={{ color: "#00d4ff", flexShrink: 0 }}>•</span>
                            <span dangerouslySetInnerHTML={{ __html: formatted }} />
                          </div>
                        )
                      }
                      // Numbered list: 1. text
                      if (/^\d+\. /.test(line)) {
                        const num = line.match(/^(\d+)\. /)?.[1]
                        const text = line.replace(/^\d+\. /, "")
                        return (
                          <div key={i} style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "6px",
                            marginTop: "8px"
                          }}>
                            <span style={{
                              color: "#00d4ff",
                              fontWeight: "700",
                              flexShrink: 0,
                              minWidth: "16px"
                            }}>
                              {num}.
                            </span>
                            <span style={{ color: "#e2e8f0", fontWeight: "600" }}>
                              {text.replace(/\*\*/g, "")}
                            </span>
                          </div>
                        )
                      }
                      // Inline bold: **text:** pattern (key-value lines)
                      if (line.includes("**")) {
                        const formatted = line.replace(/\*\*(.*?)\*\*/g, (_, b) =>
                          `<strong style="color:#e2e8f0">${b}</strong>`
                        )
                        return (
                          <p key={i} style={{ marginBottom: "4px" }}
                            dangerouslySetInnerHTML={{ __html: formatted }} />
                        )
                      }
                      // Empty line
                      if (line.trim() === "") {
                        return <div key={i} style={{ height: "8px" }} />
                      }
                      // Normal text
                      return (
                        <p key={i} style={{ marginBottom: "4px" }}>
                          {line}
                        </p>
                      )
                    })
                  }
                </div>

                <button
                  onClick={() => window.print()}
                  className="btn-secondary"
                  style={{ marginTop: "20px", fontSize: "12px" }}
                >
                  Download as PDF
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
