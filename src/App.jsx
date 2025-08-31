import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import VerifyEmail from './pages/VerifyEmail'
import Dashboard from './pages/Dashboard'
import Tasks from './pages/Tasks'
import Projects from './pages/Projects'
import Users from './pages/Users'
import Companies from './pages/Companies'
import Clients from './pages/Clients'
import ClientPortal from './pages/ClientPortal'
import Invoices from './pages/Invoices'
import Reports from './pages/Reports'
import TimeTracking from './pages/TimeTracking'
import Settings from './pages/Settings'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import MainLayout from './components/Layout/MainLayout'
import useAuthStore from './store/auth'
import { RoleProtectedRoute } from './utils/permissions.jsx'

function ProtectedRoute({ children }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return children
}

// Component to handle role-based dashboard routing
function DashboardRoute() {
  const { user } = useAuthStore()
  
  if (user?.role === 'client') {
    return <ClientPortal />
  }
  
  return <Dashboard />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRoute />} />
          <Route 
            path="projects" 
            element={
              <RoleProtectedRoute requiredPermission="view" resource="projects">
                <Projects />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="tasks" 
            element={
              <RoleProtectedRoute requiredPermission="view" resource="tasks">
                <Tasks />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="users" 
            element={
              <RoleProtectedRoute requiredRoles={['administrator']}>
                <Users />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="companies" 
            element={
              <RoleProtectedRoute requiredRoles={['administrator', 'developer']}>
                <Companies />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="clients" 
            element={
              <RoleProtectedRoute requiredRoles={['administrator']}>
                <Clients />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="invoices" 
            element={
              <RoleProtectedRoute requiredPermission="view" resource="invoices">
                <Invoices />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="reports" 
            element={
              <RoleProtectedRoute requiredPermission="view" resource="reports">
                <Reports />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="time-tracking" 
            element={
              <RoleProtectedRoute requiredPermission="view" resource="time-tracking">
                <TimeTracking />
              </RoleProtectedRoute>
            } 
          />
          <Route 
            path="settings" 
            element={
              <RoleProtectedRoute requiredRoles={['administrator']}>
                <Settings />
              </RoleProtectedRoute>
            } 
          />
          <Route path="chat" element={<Chat />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
