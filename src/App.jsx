import React, { useEffect, useState }  from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ViewProvider } from './context/ViewContext';
import Header from './components/Header';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ExplorePage from './pages/ExplorePage';
import CategoryEventsPage from './pages/CategoryEventsPage';
import PurchaseTicketsPage from './pages/PurchaseTicketPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import PurchaseConfirmationPage from './pages/PurchaseConfirmationPage';
import LinkDocumentPage from './pages/LinkDocumentPage';
import MyTicketsPage from './pages/MyTicketsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePassword';
import ProfilePage from './pages/ProfilePage';
import AccountSettings from './pages/AccountSettings';
import './styles/global.css';
import NetworkBlocker from './components/NetworkBlocker';
import { isOnline, quickPing } from './utils/networkUtils';

// Componente para proteger rutas
const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" state={{ from: location }} replace />;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
};

function AppContent() {
  const [netBlocked, setNetBlocked] = useState(false);
  const [netMsg, setNetMsg] = useState('');

  useEffect(() => {
    let interval;
    const checkNet = async () => {
      if (!isOnline()) {
        setNetBlocked(true);
        setNetMsg('No tienes conexión a internet.');
        return;
      }
      const ok = await quickPing();
      if (!ok) {
        setNetBlocked(true);
        setNetMsg('Tu conexión es inestable o lenta.');
      } else {
        setNetBlocked(false);
        setNetMsg('');
      }
    };
    checkNet();
  }, [location]);

  return (
    <div className="app">
      <ScrollToTop />
      <NetworkBlocker show={netBlocked} message={netMsg} />
      <Header />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/:categoryKey" element={<CategoryEventsPage />} />
          <Route path="/" element={<EventsPage />} />
          <Route path="/evento/:id" element={<EventDetailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/profile" element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } />
          <Route path="/account-settings" element={
            <PrivateRoute>
              <AccountSettings />
            </PrivateRoute>
          } />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route 
            path="/purchase" 
            element={
              <PrivateRoute>
                <PurchaseTicketsPage />
              </PrivateRoute>
            } 
          />
          <Route
            path="/my-tickets"
            element={
              <PrivateRoute>
                <MyTicketsPage />
              </PrivateRoute>
            }
          />
          <Route path="/link-document" element={<LinkDocumentPage />} />
          <Route path="/payment-callback" element={<PaymentCallbackPage />} />
          <Route path="/purchase-confirmation" element={<PurchaseConfirmationPage />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ViewProvider>
        <AppContent />
      </ViewProvider>
    </AuthProvider>
  );
}

export default App;