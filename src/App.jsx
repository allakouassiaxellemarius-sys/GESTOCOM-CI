import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SectorProvider } from './context/SectorContext'
import { DeviceProvider } from './context/DeviceContext'
import { getCompanySettings } from './lib/db'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import InscriptionPage from './pages/InscriptionPage'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import StockPage from './pages/StockPage'
import VentesPage from './pages/VentesPage'
import HistoriqueVentesPage from './pages/HistoriqueVentesPage'
import RecusPage from './pages/RecusPage'
import RapportsVentesPage from './pages/RapportsVentesPage'
import ProfitPage from './pages/ProfitPage'
import DepensesPage from './pages/DepensesPage'
import FournisseursPage from './pages/FournisseursPage'
import IAPage from './pages/IAPage'
import ParametresPage from './pages/ParametresPage'
import DocumentsPage from './pages/DocumentsPage'
import DownloadPage from './pages/DownloadPage'
import RetoursPage from './pages/RetoursPage'
import CommandesPage from './pages/CommandesPage'
import ModuleSelectorPage from './pages/ModuleSelectorPage'
import FinancePage from './pages/FinancePage'
import IndustriePage from './pages/IndustriePage'
import TransportPage from './pages/TransportPage'
import SantePage from './pages/SantePage'
import EducationPage from './pages/EducationPage'
import ONGPage from './pages/ONGPage'
import LegalPage from './pages/LegalPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import VerifyReceiptPage from './pages/VerifyReceiptPage'
import StockInventairePage from './pages/StockInventairePage'
import SyncPage from './pages/SyncPage'
import './index.css'

function ProtectedRoute({ children, requireModules = true }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requireModules) {
    const settings = getCompanySettings()
    if (!settings.modulesConfigured) return <Navigate to="/app/modules" replace />
  }
  return <Layout>{children}</Layout>
}

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/app" replace /> : <LandingPage />} />
      <Route path="/download" element={<DownloadPage />} />
      <Route path="/login" element={user ? <Navigate to="/app" replace /> : <LoginPage />} />
      <Route path="/mot-de-passe-oublie" element={user ? <Navigate to="/app" replace /> : <ForgotPasswordPage />} />
      <Route path="/inscription" element={user ? <Navigate to="/app" replace /> : <InscriptionPage />} />
      <Route path="/mentions-legales" element={<LegalPage type="mentions-legales" />} />
      <Route path="/cgu" element={<LegalPage type="cgu" />} />
      <Route path="/confidentialite" element={<LegalPage type="confidentialite" />} />
      <Route path="/verify/:numero" element={<VerifyReceiptPage />} />
      <Route path="/verify" element={<VerifyReceiptPage />} />
      <Route path="/sync" element={<SyncPage />} />
      <Route path="/app/modules" element={<ProtectedRoute requireModules={false}><ModuleSelectorPage /></ProtectedRoute>} />

      {/* Commerce */}
      <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/app/stock" element={<ProtectedRoute><StockPage /></ProtectedRoute>} />
      <Route path="/app/stock/inventaire" element={<ProtectedRoute><StockInventairePage /></ProtectedRoute>} />
      <Route path="/app/ventes" element={<ProtectedRoute><VentesPage /></ProtectedRoute>} />
      <Route path="/app/ventes/historique" element={<ProtectedRoute><HistoriqueVentesPage /></ProtectedRoute>} />
      <Route path="/app/ventes/recus" element={<ProtectedRoute><RecusPage /></ProtectedRoute>} />
      <Route path="/app/ventes/rapports" element={<ProtectedRoute><RapportsVentesPage /></ProtectedRoute>} />
      <Route path="/app/profit" element={<ProtectedRoute><ProfitPage /></ProtectedRoute>} />
      <Route path="/app/depenses" element={<ProtectedRoute><DepensesPage /></ProtectedRoute>} />
      <Route path="/app/fournisseurs" element={<ProtectedRoute><FournisseursPage /></ProtectedRoute>} />
      <Route path="/app/fournisseurs/commandes" element={<ProtectedRoute><CommandesPage /></ProtectedRoute>} />
      <Route path="/app/retours" element={<ProtectedRoute><RetoursPage /></ProtectedRoute>} />

      {/* Finance */}
      <Route path="/app/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />

      {/* Industrie */}
      <Route path="/app/industrie" element={<ProtectedRoute><IndustriePage /></ProtectedRoute>} />

      {/* Transport */}
      <Route path="/app/transport" element={<ProtectedRoute><TransportPage /></ProtectedRoute>} />

      {/* Santé */}
      <Route path="/app/sante" element={<ProtectedRoute><SantePage /></ProtectedRoute>} />

      {/* Éducation */}
      <Route path="/app/education" element={<ProtectedRoute><EducationPage /></ProtectedRoute>} />

      {/* ONG */}
      <Route path="/app/ong" element={<ProtectedRoute><ONGPage /></ProtectedRoute>} />

      {/* Transversal */}
      <Route path="/app/ia" element={<ProtectedRoute><IAPage /></ProtectedRoute>} />
      <Route path="/app/documents" element={<ProtectedRoute><DocumentsPage /></ProtectedRoute>} />
      <Route path="/app/parametres" element={<ProtectedRoute><ParametresPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  )
}
