import React from 'react';
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
import './styles/global.css';

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

function AppContent() {
  return (
    <div className="app">
      <Header />
      <main>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/explore/:categoryKey" element={<CategoryEventsPage />} />
          <Route path="/" element={<EventsPage />} />
          <Route path="/evento/:id" element={<EventDetailPage />} />
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