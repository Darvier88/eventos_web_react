import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../components/logo.png';
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">

        {/* Brand column */}
        <div className="footer-brand">
          <img src={logo} alt="MACAK Eventos" className="footer-logo" />
          <p className="footer-tagline">
            La plataforma líder en gestión y venta de entradas para eventos en Ecuador.
          </p>
          <div className="footer-social">
            {/* Instagram */}
            <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Instagram">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <circle cx="12" cy="12" r="4"></circle>
                <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"></circle>
              </svg>
            </a>
            {/* Facebook */}
            <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-link" aria-label="Facebook">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
              </svg>
            </a>
            {/* TikTok */}
            <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="social-link" aria-label="TikTok">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
              </svg>
            </a>
            {/* WhatsApp */}
            <a href="https://wa.me/593987654321" target="_blank" rel="noreferrer" className="social-link" aria-label="WhatsApp">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
              </svg>
            </a>
          </div>
        </div>

        {/* Links column */}
        <div className="footer-col">
          <h4 className="footer-heading">Navegación</h4>
          <ul className="footer-links">
            <li><Link to="/">Eventos</Link></li>
            <li><Link to="/explore">Explorar</Link></li>
            <li><Link to="/my-tickets">Mis tickets</Link></li>
            <li><Link to="/profile">Mi perfil</Link></li>
          </ul>
        </div>

        {/* Legal column */}
        <div className="footer-col">
          <h4 className="footer-heading">Legal</h4>
          <ul className="footer-links">
            <li><Link to="/terms">Términos y condiciones</Link></li>
            <li><Link to="/privacy">Política de privacidad</Link></li>
            <li><Link to="/refunds">Política de reembolsos</Link></li>
            <li><Link to="/cookies">Cookies</Link></li>
          </ul>
        </div>

        {/* Contact column */}
        <div className="footer-col">
          <h4 className="footer-heading">Contacto</h4>
          <ul className="footer-contact">
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span> Av. de las Américas #510 y Conector Benjamín Rosales,<br />Guayaquil, Ecuador</span>
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
              </svg>
              <span>+593 98 765 4321</span>
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>velecas.ec@gmail.com</span>
            </li>
            <li>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Lun–Vie: 09:00 – 18:00 (EC)</span>
            </li>
          </ul>
        </div>

      </div>
      <div className="footer-app-download">
        <h4 className="footer-heading">
          Descarga nuestra <span style={{ color: '#ff6600' }}>app</span>
        </h4>
        <p className="footer-app-subtitle">Encuentra nuestra app disponible en:</p>
        <div className="footer-app-buttons">
          
          {/* App Store */}
          <a href="https://apps.apple.com/" target="_blank" rel="noreferrer" className="store-btn" aria-label="App Store">
            <svg className="store-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="28" height="28" fill="currentColor">
              <path d="M255.9 120.9l9.1-15.7c5.6-9.8 18.1-13.1 27.9-7.5s13.1 18.1 7.5 27.9l-87.5 151.5 63.3 0c20.5 0 32 24.1 23.1 40.8l-185.5 0c-11.3 0-20.4-9.1-20.4-20.4s9.1-20.4 20.4-20.4l52 0 66.6-115.4-20.8-36.1c-5.6-9.8-2.3-22.2 7.5-27.9 9.8-5.6 22.2-2.3 27.9 7.5l8.9 15.7zm-78.7 218l-19.6 34c-5.6 9.8-18.1 13.1-27.9 7.5s-13.1-18.1-7.5-27.9l14.6-25.2c16.4-5.1 29.8-1.2 40.4 11.6zm168.9-61.7l53.1 0c11.3 0 20.4 9.1 20.4 20.4S410.5 318 399.2 318l-29.5 0 19.9 34.5c5.6 9.8 2.3 22.2-7.5 27.9-9.8 5.6-22.2 2.3-27.9-7.5-33.5-58.1-58.7-101.6-75.4-130.6-17.1-29.5-4.9-59.1 7.2-69.1 13.4 23 33.4 57.7 60.1 104zM256 8a248 248 0 1 0 0 496 248 248 0 1 0 0-496zM40 256a216 216 0 1 1 432 0 216 216 0 1 1 -432 0z"/>
            </svg>
            <div className="store-text">
              <span className="store-label">Descárgalo en el</span>
              <span className="store-name">App Store</span>
            </div>
          </a>

          {/* Google Play */}
          <a href="https://play.google.com/store" target="_blank" rel="noreferrer" className="store-btn" aria-label="Google Play">
            <svg className="store-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="28" height="28" fill="currentColor">
              <path d="M293.6 234.3L72.9 13 353.7 174.2 293.6 234.3zM15.3 0C2.3 6.8-6.4 19.2-6.4 35.3l0 441.3c0 16.1 8.7 28.5 21.7 35.3L271.9 255.9 15.3 0zM440.5 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM72.9 499L353.7 337.8 293.6 277.7 72.9 499z"/>
            </svg>
            <div className="store-text">
              <span className="store-label">Descargar de</span>
              <span className="store-name">Google Play</span>
            </div>
          </a>

        </div>
      </div>
    </footer>
  );
};

export default Footer;