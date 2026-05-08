import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AdminRoute } from '@/components/auth/AdminRoute';
import { GuestRoute } from '@/components/auth/GuestRoute';
import { WelcomeOverlay } from '@/components/WelcomeOverlay';
import { AuthProvider } from '@/contexts/AuthProvider';
import { SiteHealthBanner } from '@/components/SiteHealthBanner';
import { SiteCopyProvider } from '@/contexts/SiteCopyProvider';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import { WelcomeLayoutProvider } from '@/contexts/WelcomeLayoutContext';
import { I18nProvider } from '@/i18n/I18nProvider';
import { AdminLayout } from '@/layouts/AdminLayout';
import { MainLayout } from '@/layouts/MainLayout';
import { HomePage } from '@/pages/HomePage';
import { AdminLoginPage } from '@/pages/admin/AdminLoginPage';
import { AdminSiteContentPage } from '@/pages/admin/AdminSiteContentPage';
import { AdminSiteAccessPage } from '@/pages/admin/AdminSiteAccessPage';
import { ServicesCatalogPage } from '@/pages/ServicesCatalogPage';
import { ServiceDetailPage } from '@/pages/ServiceDetailPage';

export default function App() {
  return (
    <SiteCopyProvider>
      <I18nProvider>
        <ThemeProvider>
          <WelcomeLayoutProvider>
            <AuthProvider>
              <BrowserRouter>
                <SiteHealthBanner />
                <WelcomeOverlay />
                <Routes>
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/servicos" element={<ServicesCatalogPage />} />
                    <Route path="/servicos/:productId" element={<ServiceDetailPage />} />
                  </Route>

                  <Route
                    path="/login"
                    element={
                      <GuestRoute>
                        <AdminLoginPage />
                      </GuestRoute>
                    }
                  />

                  <Route
                    element={
                      <AdminRoute>
                        <AdminLayout />
                      </AdminRoute>
                    }
                  >
                    <Route path="/admin" element={<Navigate to="/admin/home" replace />} />
                    <Route path="/admin/home" element={<AdminSiteContentPage />} />
                    <Route path="/admin/casos" element={<Navigate to="/admin/home" replace />} />
                    <Route path="/admin/acessos" element={<AdminSiteAccessPage />} />
                    <Route path="/admin/contatos" element={<Navigate to="/admin/acessos" replace />} />
                    <Route path="/admin/produtos" element={<Navigate to="/admin/home" replace />} />
                    <Route
                      path="/admin/conteudo"
                      element={<Navigate to="/admin/home" replace />}
                    />
                  </Route>

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </AuthProvider>
          </WelcomeLayoutProvider>
        </ThemeProvider>
      </I18nProvider>
    </SiteCopyProvider>
  );
}
