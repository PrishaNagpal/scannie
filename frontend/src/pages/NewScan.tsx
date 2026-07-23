import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ScanSearch, Globe, Lock } from "lucide-react"
import { createScan } from "../api/scans"

const PLUGINS = [
  {
    id: "nmap",
    label: "Port Scanner",
    description: "Discovers open ports and identifies running services with version detection",
    icon: ScanSearch,
    color: "#00d4ff"
  },
  {
    id: "tls",
    label: "TLS/SSL Checker",
    description: "Validates certificates, checks expiry and weak encryption protocols",
    icon: Lock,
    color: "#10b981"
  },
  {
    id: "web",
    label: "Web Misconfig Scanner",
    description: "Detects missing security headers and exposed sensitive paths",
    icon: Globe,
    color: "#7c3aed"
  }
]

export function NewScan() {
  const navigate = useNavigate()
  const [target, setTarget] = useState("")
  const [plugins, setPlugins] = useState<string[]>(["nmap", "tls", "web"])
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const togglePlugin = (id: string) => {
    setPlugins(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleScan = async () => {
    setError("")

    if (!target.trim()) {
      setError("Please enter a target IP or domain")
      return
    }

    if (plugins.length === 0) {
      setError("Select at least one scanner")
      return
    }

    if (!consent) {
      setError("You must confirm you have permission to scan this target")
      return
    }

    setLoading(true)

    try {
      const scan = await createScan({
        target: target.trim(),
        plugins_used: plugins,
        consent_confirmed: consent
      })
      navigate(`/scan/${scan.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start scan")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: "2640px" }}>

      {/* Header */}
      <div style={{ marginBottom: "46px" }}>
        <h1 style={{
          fontSize: "24px",
          fontWeight: "700",
          color: "#e2e8f0",
          marginBottom: "6px"
        }}>
          New Scan
        </h1>
        <p style={{ fontSize: "14px", color: "#94a3b8" }}>
          Configure and launch a security scan against a target
        </p>
      </div>

      {/* Target input */}
      <div className="card" style={{ marginBottom: "46px" }}>
        <label style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "600",
          color: "#94a3b8",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "10px"
        }}>
          Target
        </label>
        <input
          type="text"
          className="input-field"
          placeholder="e.g. scanme.nmap.org or 192.168.1.1"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleScan()}
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        />
        <p style={{
          fontSize: "11px",
          color: "#475569",
          marginTop: "8px"
        }}>
          Enter an IP address or domain name you have permission to scan
        </p>
      </div>

      {/* Scanner selection */}
      <div className="card" style={{ marginBottom: "46px" }}>
        <label style={{
          display: "block",
          fontSize: "12px",
          fontWeight: "600",
          color: "#94a3b8",
          letterSpacing: "1px",
          textTransform: "uppercase",
          marginBottom: "14px"
        }}>
          Scanners
        </label>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {PLUGINS.map(({ id, label, description, icon: Icon, color }) => {
            const selected = plugins.includes(id)
            return (
              <div
                key={id}
                onClick={() => togglePlugin(id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px",
                  borderRadius: "8px",
                  border: `1px solid ${selected
                    ? `${color}40`
                    : "#1e2d4a"}`,
                  background: selected
                    ? `${color}08`
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
              >
                {/* Checkbox */}
                <div style={{
                  width: "18px",
                  height: "18px",
                  borderRadius: "4px",
                  border: `2px solid ${selected ? color : "#475569"}`,
                  background: selected ? color : "transparent",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease"
                }}>
                  {selected && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1"
                            stroke="#0a0e1a"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>

                {/* Icon */}
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <Icon style={{ color, width: "18px", height: "18px" }} />
                </div>

                {/* Text */}
                <div>
                  <p style={{
                    fontSize: "14px",
                    fontWeight: "600",
                    color: selected ? "#e2e8f0" : "#94a3b8",
                    marginBottom: "2px"
                  }}>
                    {label}
                  </p>
                  <p style={{
                    fontSize: "12px",
                    color: "#475569",
                    lineHeight: "1.4"
                  }}>
                    {description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Consent */}
      <div className="card" style={{ marginBottom: "46px" }}>
        <div
          onClick={() => setConsent(!consent)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: "12px",
            cursor: "pointer"
          }}
        >
          {/* Checkbox */}
          <div style={{
            width: "18px",
            height: "18px",
            borderRadius: "4px",
            border: `2px solid ${consent ? "#00d4ff" : "#475569"}`,
            background: consent ? "#00d4ff" : "transparent",
            flexShrink: 0,
            marginTop: "2px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s ease"
          }}>
            {consent && (
              <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1"
                      stroke="#0a0e1a"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          <div>
            <p style={{
              fontSize: "14px",
              fontWeight: "600",
              color: "#e2e8f0",
              marginBottom: "4px"
            }}>
              I have permission to scan this target
            </p>
            <p style={{ fontSize: "12px", color: "#475569", lineHeight: "1.5" }}>
              Scanning systems without explicit authorization is illegal.
              By checking this box you confirm you own or have written
              permission to scan the target.
            </p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          marginBottom: "16px",
          padding: "10px 14px",
          borderRadius: "6px",
          fontSize: "13px",
          background: "rgba(255,59,59,0.08)",
          color: "#ff6b6b",
          border: "1px solid rgba(255,59,59,0.2)"
        }}>
          ⚠ {error}
        </div>
      )}

      {/* Submit */}
      <button
        onClick={handleScan}
        disabled={loading}
        style={{
          width: "100%",
          padding: "13px",
          borderRadius: "8px",
          border: "none",
          cursor: loading ? "not-allowed" : "pointer",
          fontSize: "14px",
          fontWeight: "600",
          background: loading
            ? "rgba(0,212,255,0.3)"
            : "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
          color: "#0a0e1a",
          letterSpacing: "0.5px",
          boxShadow: loading ? "none" : "0 0 20px rgba(0,212,255,0.25)",
          transition: "all 0.2s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px"
        }}
      >
        {loading ? (
          "Starting scan..."
        ) : (
          <>
            <ScanSearch style={{ width: "16px", height: "16px" }} />
            Launch Scan
          </>
        )}
      </button>
    </div>
  )
}
