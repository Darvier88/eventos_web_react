import React, { useEffect } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { termsContent, dataUsagePolicy, rechargePolicy } from '../constants/policy_text';
import './LegalPage.css';

// Mapa de slug → { título, contenido }
const LEGAL_DOCS = {
  terms: {
    title: 'Términos y Condiciones',
    subtitle: 'Política de compra de boletos',
    content: termsContent,
  },
  privacy: {
    title: 'Política de Uso de Datos',
    subtitle: 'Velecas S.A.S. — LOPDP Ecuador',
    content: dataUsagePolicy,
  },
  recargas: {
    title: 'Política de Recargas NFC',
    subtitle: 'Carga de dinero en pulseras y tarjetas NFC',
    content: rechargePolicy,
  },
};

const LegalPage = () => {
  const { slug } = useParams();
  const doc = LEGAL_DOCS[slug];

  // Al cambiar de política, volver arriba
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Si el slug no existe, redirigir al inicio
  if (!doc) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="legal-page">
      <div className="legal-container">

        <div className="legal-header">
          <Link to="/" className="legal-back">← Volver al inicio</Link>
          <h1 className="legal-title">{doc.title}</h1>
          {doc.subtitle && <p className="legal-subtitle">{doc.subtitle}</p>}
        </div>

        {/* Navegación entre políticas */}
        <nav className="legal-nav">
          {Object.entries(LEGAL_DOCS).map(([key, d]) => (
            <Link
              key={key}
              to={`/legal/${key}`}
              className={`legal-nav-link ${key === slug ? 'active' : ''}`}
            >
              {d.title}
            </Link>
          ))}
        </nav>

        <div className="legal-body">
          <ReactMarkdown>{doc.content}</ReactMarkdown>
        </div>

      </div>
    </div>
  );
};

export default LegalPage;