import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }       from '@/context/AuthContext'
import { RequireAuth }        from '@/middleware/RequireAuth'
import { RequireRole }        from '@/middleware/RequireRole'
import { RedirectIfAuthed }   from '@/middleware/RedirectIfAuthed'
import { PublicLayout }       from '@/components/layout/PublicLayout'
import { DashboardLayout }    from '@/components/layout/DashboardLayout'
import { PageSpinner }        from '@/components/ui/Spinner'
import AdminLayout            from '@/components/layout/AdminLayout'

// ── Public pages ─────────────────────────────────────────────────────────────
const LandingPage    = lazy(() => import('@/pages/landing/LandingPage'))
const Marketplace    = lazy(() => import('@/pages/marketplace/Marketplace'))
const ShopPage       = lazy(() => import('@/pages/shop/ShopPage'))
const ProductPage    = lazy(() => import('@/pages/product/ProductPage'))
const CartPage       = lazy(() => import('@/pages/cart/CartPage'))
const AboutPage      = lazy(() => import('@/pages/company/AboutPage'))
const PrivacyPage    = lazy(() => import('@/pages/company/PrivacyPage'))
const TermsPage      = lazy(() => import('@/pages/company/TermsPage'))
const SupportPage    = lazy(() => import('@/pages/company/SupportPage'))

// ── Auth pages ────────────────────────────────────────────────────────────────
const Login          = lazy(() => import('@/pages/auth/Login'))
const Register       = lazy(() => import('@/pages/auth/Register'))

// ── Buyer pages (require login) ───────────────────────────────────────────────
const CheckoutPage   = lazy(() => import('@/pages/checkout/CheckoutPage'))
const AccountPage    = lazy(() => import('@/pages/account/AccountPage'))
const MyOrders       = lazy(() => import('@/pages/account/MyOrders'))
const ProfilePage    = lazy(() => import('@/pages/account/ProfilePage'))
const SettingsPage   = lazy(() => import('@/pages/account/SettingsPage'))
const MessagesPage       = lazy(() => import('@/pages/messages/MessagesPage'))
const NotificationsPage  = lazy(() => import('@/pages/notifications/NotificationsPage'))

// ── Admin pages (require login + admin role) ──────────────────────────────────
const AdminDashboard = lazy(() => import('@/pages/admin/AdminDashboard'))
const AdminUsers     = lazy(() => import('@/pages/admin/AdminUsers'))
const AdminShops     = lazy(() => import('@/pages/admin/AdminShops'))
const AdminOrders    = lazy(() => import('@/pages/admin/AdminOrders'))
const AdminProducts  = lazy(() => import('@/pages/admin/AdminProducts'))
const AdminReports   = lazy(() => import('@/pages/admin/AdminReports'))

// ── Seller dashboard pages (require login + seller role) ─────────────────────
const DashboardOverview    = lazy(() => import('@/pages/dashboard/Overview'))
const DashboardProducts    = lazy(() => import('@/pages/dashboard/Products'))
const DashboardOrders      = lazy(() => import('@/pages/dashboard/Orders'))
const DashboardMessages    = lazy(() => import('@/pages/dashboard/Messages'))
const DashboardSettings    = lazy(() => import('@/pages/dashboard/ShopSettings'))
const DashboardPayments    = lazy(() => import('@/pages/dashboard/PaymentSettings'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageSpinner />}>
          <Routes>
            {/* ── Public (with Navbar + Footer) ── */}
            <Route element={<PublicLayout />}>
              <Route index        element={<LandingPage />} />
              <Route path="marketplace" element={<Marketplace />} />
              <Route path="shop/:slug"  element={<ShopPage />} />
              <Route path="product/:id" element={<ProductPage />} />
              <Route path="cart"        element={<CartPage />} />
              <Route path="about"       element={<AboutPage />} />
              <Route path="privacy"     element={<PrivacyPage />} />
              <Route path="terms"       element={<TermsPage />} />
              <Route path="support"     element={<SupportPage />} />
            </Route>

            {/* ── Auth (redirect if already logged in) ── */}
            <Route element={<RedirectIfAuthed />}>
              <Route path="auth/login"    element={<Login />} />
              <Route path="auth/register" element={<Register />} />
            </Route>

            {/* ── Buyer protected routes ── */}
            <Route element={<RequireAuth />}>
              <Route element={<PublicLayout />}>
                <Route path="checkout"          element={<CheckoutPage />} />
                <Route path="account"           element={<AccountPage />} />
                <Route path="account/orders"    element={<MyOrders />} />
                <Route path="account/profile"   element={<ProfilePage />} />
                <Route path="account/settings"  element={<SettingsPage />} />
                <Route path="messages"          element={<MessagesPage />} />
                <Route path="notifications"    element={<NotificationsPage />} />
              </Route>
            </Route>

            {/* ── Admin panel (RequireAuth → RequireRole admin only) ── */}
            <Route element={<RequireAuth />}>
              <Route element={<RequireRole allowedRoles={['admin']} redirectTo="/marketplace" />}>
                <Route path="admin" element={<AdminLayout />}>
                  <Route index               element={<AdminDashboard />} />
                  <Route path="users"        element={<AdminUsers />} />
                  <Route path="shops"        element={<AdminShops />} />
                  <Route path="orders"       element={<AdminOrders />} />
                  <Route path="products"     element={<AdminProducts />} />
                  <Route path="reports"      element={<AdminReports />} />
                </Route>
              </Route>
            </Route>

            {/* ── Seller dashboard (RequireAuth → RequireRole seller only) ── */}
            <Route element={<RequireAuth />}>
              <Route element={<RequireRole allowedRoles={['seller']} redirectTo="/marketplace" />}>
                <Route path="dashboard" element={<DashboardLayout />}>
                  <Route index               element={<DashboardOverview />} />
                  <Route path="products"     element={<DashboardProducts />} />
                  <Route path="orders"       element={<DashboardOrders />} />
                  <Route path="messages"     element={<DashboardMessages />} />
                  <Route path="settings"     element={<DashboardSettings />} />
                  <Route path="payments"     element={<DashboardPayments />} />
                </Route>
              </Route>
            </Route>

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
