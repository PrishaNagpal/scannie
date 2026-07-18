import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  ScanSearch,
  History,
  Shield,
  LogOut
} from "lucide-react"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/scan/new", icon: ScanSearch, label: "New Scan" },
  { to: "/history", icon: History, label: "History" }
]

export function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem("scannie_token")
    window.location.href = "/login"
  }

  return (
    <aside className="w-60 min-h-screen bg-bg-secondary border-r
                      border-border-primary flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border-primary">
        <div className="flex items-center gap-3">
          <Shield className="text-accent-primary w-7 h-7" />
          <span className="text-xl font-bold text-accent-primary
                           tracking-wider font-mono">
            SCANNIE
          </span>
        </div>
        <p className="text-text-muted text-xs mt-1 font-mono">
          AI Security Scanner
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
               font-medium transition-all duration-200 ${
                isActive
                  ? "bg-accent-primary/10 text-accent-primary border border-accent-primary/20"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-tertiary"
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-border-primary">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md
                     text-sm font-medium text-text-secondary
                     hover:text-severity-high hover:bg-bg-tertiary
                     transition-all duration-200 w-full"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
