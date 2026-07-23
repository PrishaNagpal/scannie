import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { Layout } from "./components/layout/Layout"
import { Dashboard } from "./pages/Dashboard"
import { NewScan } from "./pages/NewScan"
import { ScanResults } from "./pages/ScanResults"
import { Login } from "./pages/Login"
import { History } from "./pages/History"

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("scannie_token")
  if (!token) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/scan/new" element={
          <ProtectedRoute><NewScan /></ProtectedRoute>
        } />
        <Route path="/scan/:scanId" element={
          <ProtectedRoute><ScanResults /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><History /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
