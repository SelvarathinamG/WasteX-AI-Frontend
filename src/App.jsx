import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'

import Login from './pages/Login'
import VendorRegister from './pages/VendorRegister'
import AdminDashboard from './pages/AdminDashboard'
import Overview from './pages/admin/Overview'
import SmartBins from './pages/admin/SmartBins'
import Simulator from './pages/admin/Simulator'
import Collectors from './pages/admin/Collectors'
import Fleet from './pages/admin/Fleet'
import Vendors from './pages/admin/Vendors'
import Inventory from './pages/admin/Inventory'
import CollectorDashboard from './pages/CollectorDashboard'
import VendorDashboard from './pages/VendorDashboard'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/vendor/register" element={<VendorRegister />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute role="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Overview />} />
              <Route path="smart-bins" element={<SmartBins />} />
              <Route path="simulator" element={<Simulator />} />
              <Route path="collectors" element={<Collectors />} />
              <Route path="fleet" element={<Fleet />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="inventory" element={<Inventory />} />
            </Route>

            <Route
              path="/collector/dashboard"
              element={
                <ProtectedRoute role="collector">
                  <CollectorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute role="vendor">
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
