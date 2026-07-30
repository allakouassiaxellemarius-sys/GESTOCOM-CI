import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SectorProvider } from './context/SectorContext'
import { DeviceProvider } from './context/DeviceContext'
import { NetworkProvider } from './context/NetworkContext'
import { SyncProvider } from './context/SyncContext'
import ErrorBoundary from './components/ErrorBoundary'
import Layout from './components/Layout'
import {
  LandingScreen, LoginScreen, RegisterScreen, ForgotPasswordScreen,
  DownloadScreen, LegalScreen, VerifyReceiptScreen, SyncScreen,
  DashboardScreen, StockScreen, InventoryScreen, SalesScreen,
  SalesHistoryScreen, ReceiptsScreen, ReportsScreen, ProfitScreen,
  ExpensesScreen, SuppliersScreen, PurchaseOrdersScreen, ReturnsScreen,
  ConnectionsScreen,
  FinanceScreen, IndustryScreen, TransportScreen, HealthScreen,
  EducationScreen, NGOScreen,
  AIScreen, DocumentsScreen, SoftwareScreen, SettingsScreen,
} from './screens'
import './index.css'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <LandingScreen />} />
      <Route path="/download" element={<DownloadScreen />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginScreen />} />
      <Route path="/mot-de-passe-oublie" element={user ? <Navigate to="/app" replace /> : <ForgotPasswordScreen />} />
      <Route path="/inscription" element={user ? <Navigate to="/app" replace /> : <RegisterScreen />} />
      <Route path="/mentions-legales" element={<LegalScreen type="mentions-legales" />} />
      <Route path="/cgu" element={<LegalScreen type="cgu" />} />
      <Route path="/confidentialite" element={<LegalScreen type="confidentialite" />} />
      <Route path="/verify/:numero" element={<VerifyReceiptScreen />} />
      <Route path="/verify" element={<VerifyReceiptScreen />} />
      <Route path="/sync" element={<SyncScreen />} />

      {/* Commerce */}
      <Route path="/app" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
      <Route path="/app/stock" element={<ProtectedRoute><StockScreen /></ProtectedRoute>} />
      <Route path="/app/stock/inventaire" element={<ProtectedRoute><InventoryScreen /></ProtectedRoute>} />
      <Route path="/app/ventes" element={<ProtectedRoute><SalesScreen /></ProtectedRoute>} />
      <Route path="/app/ventes/historique" element={<ProtectedRoute><SalesHistoryScreen /></ProtectedRoute>} />
      <Route path="/app/ventes/recus" element={<ProtectedRoute><ReceiptsScreen /></ProtectedRoute>} />
      <Route path="/app/ventes/rapports" element={<ProtectedRoute><ReportsScreen /></ProtectedRoute>} />
      <Route path="/app/profit" element={<ProtectedRoute><ProfitScreen /></ProtectedRoute>} />
      <Route path="/app/depenses" element={<ProtectedRoute><ExpensesScreen /></ProtectedRoute>} />
      <Route path="/app/fournisseurs" element={<ProtectedRoute><SuppliersScreen /></ProtectedRoute>} />
      <Route path="/app/fournisseurs/commandes" element={<ProtectedRoute><PurchaseOrdersScreen /></ProtectedRoute>} />
      <Route path="/app/retours" element={<ProtectedRoute><ReturnsScreen /></ProtectedRoute>} />

      {/* Finance */}
      <Route path="/app/finance" element={<ProtectedRoute><FinanceScreen /></ProtectedRoute>} />

      {/* Industrie */}
      <Route path="/app/industrie" element={<ProtectedRoute><IndustryScreen /></ProtectedRoute>} />

      {/* Transport */}
      <Route path="/app/transport" element={<ProtectedRoute><TransportScreen /></ProtectedRoute>} />

      {/* Santé */}
      <Route path="/app/sante" element={<ProtectedRoute><HealthScreen /></ProtectedRoute>} />

      {/* Éducation */}
      <Route path="/app/education" element={<ProtectedRoute><EducationScreen /></ProtectedRoute>} />

      {/* ONG */}
      <Route path="/app/ong" element={<ProtectedRoute><NGOScreen /></ProtectedRoute>} />

      {/* Transversal */}
      <Route path="/app/ia" element={<ProtectedRoute><AIScreen /></ProtectedRoute>} />
      <Route path="/app/documents" element={<ProtectedRoute><DocumentsScreen /></ProtectedRoute>} />
      <Route path="/app/logiciels" element={<ProtectedRoute><SoftwareScreen /></ProtectedRoute>} />
      <Route path="/app/parametres" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
      <Route path="/app/connexions" element={<ProtectedRoute><ConnectionsScreen /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
      <NetworkProvider>
        <SyncProvider>
          <AuthProvider>
            <ThemeProvider>
              <SectorProvider>
                <DeviceProvider>
                  <ErrorBoundary>
                    <AppRoutes />
                  </ErrorBoundary>
                </DeviceProvider>
              </SectorProvider>
            </ThemeProvider>
          </AuthProvider>
        </SyncProvider>
      </NetworkProvider>
    </HashRouter>
  )
}
