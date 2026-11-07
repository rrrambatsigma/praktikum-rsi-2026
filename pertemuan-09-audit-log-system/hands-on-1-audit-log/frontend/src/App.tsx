import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { ToastProvider } from './context/ToastContext'
import { AdminOrdersPage } from './pages/AdminOrdersPage'
import { AuditLogPage } from './pages/AuditLogPage'
import { CatalogPage } from './pages/CatalogPage'
import { CheckoutPage } from './pages/CheckoutPage'
import { DashboardPage } from './pages/DashboardPage'
import { ForbiddenPage } from './pages/ForbiddenPage'
import { LoginPage } from './pages/LoginPage'
import { NotFoundPage } from './pages/NotFoundPage'
import { OwnerOrdersPage } from './pages/OwnerOrdersPage'
import { RegisterPage } from './pages/RegisterPage'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forbidden" element={<ForbiddenPage />} />

              {/* Katalog bisa dilihat semua orang, termasuk yang belum login. */}
              <Route path="/" element={<CatalogPage />} />

              <Route element={<ProtectedRoute roles={['customer']} />}>
                <Route path="/checkout" element={<CheckoutPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['owner']} />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/dashboard/orders" element={<OwnerOrdersPage />} />
              </Route>

              <Route element={<ProtectedRoute roles={['admin']} />}>
                <Route path="/admin/orders" element={<AdminOrdersPage />} />
                <Route path="/admin/audit-logs" element={<AuditLogPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </CartProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
