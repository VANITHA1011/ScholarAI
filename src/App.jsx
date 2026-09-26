import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/dashboard/ProfilePage';
import { DocumentsPage } from './pages/dashboard/DocumentsPage';
import { EligibilityPage } from './pages/dashboard/EligibilityPage';
import { RecommendationsPage } from './pages/dashboard/RecommendationsPage';
import { InsightsPage } from './pages/dashboard/InsightsPage';
import { AssistantPage } from './pages/dashboard/AssistantPage';
import { SavedPage } from './pages/dashboard/SavedPage';
import { JourneyPage } from './pages/dashboard/JourneyPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';
import { CertificateGeneratorPage } from './pages/dashboard/CertificateGeneratorPage';
import { HistoryPage } from './pages/dashboard/HistoryPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminRoute } from './components/AdminRoute';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './components/Toast';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/dashboard/profile" element={<ProfilePage />} />
            <Route path="/dashboard/documents" element={<DocumentsPage />} />
            <Route path="/dashboard/eligibility" element={<EligibilityPage />} />
            <Route path="/dashboard/recommendations" element={<RecommendationsPage />} />
            <Route path="/dashboard/insights" element={<InsightsPage />} />
            <Route path="/dashboard/assistant" element={<AssistantPage />} />
            <Route path="/dashboard/saved" element={<SavedPage />} />
            <Route path="/dashboard/journey" element={<JourneyPage />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/dashboard/certificates" element={<CertificateGeneratorPage />} />
            <Route path="/dashboard/applications" element={<HistoryPage />} />
            <Route path="/dashboard/applications/:id" element={<HistoryPage />} />
            <Route path="/my-applications" element={<HistoryPage />} />
            <Route path="/applications" element={<HistoryPage />} />
            <Route path="/applications/:id" element={<HistoryPage />} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </LanguageProvider>
  </BrowserRouter>
  );
}

export default App;
