import { useState } from "react"
import { useNavigate } from "react-router-dom"
import apiClient from "../api/client"

export function Login() {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setError("")

    if (!email || !password) {
      setError("Email and password are required")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    if (isSignup && password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const endpoint = isSignup ? "/auth/signup" : "/auth/login"
      const response = await apiClient.post(endpoint, { email, password })
      localStorage.setItem("scannie_token", response.data.access_token)
      navigate("/")
    } catch (err: any) {
      setError(err.response?.data?.detail || "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a0e1a",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden"
    }}>

      {/* Enhanced grid background */}
    <div style={{
      position: "absolute",
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(0, 212, 255, 0.07) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 212, 255, 0.07) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px"
    }} />

      {/* Cyan glow blob behind card */}
      <div style={{
        position: "absolute",
        width: "600px",
        height: "600px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none"
      }} />

      {/* Content */}
      <div style={{
        position: "relative",
        zIndex: 10,
        width: "100%",
        maxWidth: "420px",
        padding: "0 16px"
      }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>

          {/* Icon container with glow */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "72px",
            height: "72px",
            borderRadius: "16px",
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.2)",
            marginBottom: "16px",
            boxShadow: "0 0 30px rgba(0,212,255,0.15), inset 0 0 20px rgba(0,212,255,0.05)"
          }}>
            {/* Custom scan target SVG icon */}
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="14" stroke="#00d4ff" strokeWidth="1.5" opacity="0.4"/>
              <circle cx="18" cy="18" r="9" stroke="#00d4ff" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="18" cy="18" r="4" fill="#00d4ff"/>
              <line x1="18" y1="2" x2="18" y2="8" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="18" y1="28" x2="18" y2="34" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="2" y1="18" x2="8" y2="18" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
              <line x1="28" y1="18" x2="34" y2="18" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          <div style={{
            fontSize: "28px",
            fontWeight: "800",
            fontFamily: "'JetBrains Mono', monospace",
            color: "#00d4ff",
            letterSpacing: "6px",
            textShadow: "0 0 20px rgba(0,212,255,0.5)",
            marginBottom: "6px"
          }}>
            SCANNIE
          </div>

          <div style={{
            fontSize: "12px",
            color: "#475569",
            letterSpacing: "2px",
            textTransform: "uppercase",
            fontFamily: "Inter, sans-serif"
          }}>
            AI Security Intelligence Platform
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(15, 22, 41, 0.8)",
          border: "1px solid rgba(30, 45, 74, 0.8)",
          borderRadius: "12px",
          padding: "28px",
          backdropFilter: "blur(10px)",
          boxShadow: "0 0 0 1px rgba(0,212,255,0.05), 0 20px 60px rgba(0,0,0,0.5)"
        }}>

          {/* Tab switcher */}
          <div style={{
            display: "flex",
            background: "#0a0e1a",
            borderRadius: "8px",
            padding: "4px",
            marginBottom: "24px",
            border: "1px solid #1e2d4a"
          }}>
            {["Sign in", "Sign up"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => { setIsSignup(i === 1); setError("") }}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  background: isSignup === (i === 1)
                    ? "rgba(0,212,255,0.1)"
                    : "transparent",
                  color: isSignup === (i === 1) ? "#00d4ff" : "#475569",
                  boxShadow: isSignup === (i === 1)
                    ? "0 0 0 1px rgba(0,212,255,0.2)"
                    : "none"
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: "16px",
              padding: "10px 12px",
              borderRadius: "6px",
              fontSize: "13px",
              background: "rgba(255,59,59,0.08)",
              color: "#ff6b6b",
              border: "1px solid rgba(255,59,59,0.2)",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Email field */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "500",
              color: "#94a3b8",
              marginBottom: "6px",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }}>
              Email Address
            </label>
            <input
              type="email"
              className="input-field"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Password field */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{
              display: "block",
              fontSize: "12px",
              fontWeight: "500",
              color: "#94a3b8",
              marginBottom: "6px",
              letterSpacing: "0.5px",
              textTransform: "uppercase"
            }}>
              Password {isSignup && (
                <span style={{ color: "#475569", fontWeight: 400 }}>
                  (min 8 characters)
                </span>
              )}
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            />
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "8px",
              border: "none",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: "14px",
              fontWeight: "600",
              background: loading
                ? "rgba(0,212,255,0.4)"
                : "linear-gradient(135deg, #00d4ff 0%, #0099cc 100%)",
              color: "#0a0e1a",
              transition: "all 0.2s ease",
              boxShadow: loading ? "none" : "0 0 20px rgba(0,212,255,0.3)",
              letterSpacing: "0.5px"
            }}
          >
            {loading ? "Authenticating..." : isSignup ? "Create Account" : "Sign In"}
          </button>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: "center",
          fontSize: "11px",
          color: "#2d3748",
          marginTop: "20px",
          letterSpacing: "1px",
          textTransform: "uppercase"
        }}>
          Only scan targets you have explicit permission to scan
        </p>
      </div>
    </div>
  )
}
