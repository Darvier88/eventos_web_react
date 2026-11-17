// src/components/HistorySheet.jsx
import React, { useEffect, useRef } from 'react';
import './TransactionHistory.css';

/**
 * Contenedor para historiales: panel lateral en escritorio y hoja inferior en
 * móvil. Se cierra con la X, haciendo clic fuera o con Escape.
 */
const HistorySheet = ({ title, subtitle, onClose, children }) => {
  // Ref para no volver a registrar listeners cuando el padre pasa una función nueva
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    document.addEventListener('keydown', handleKeyDown);

    // Evita que la página de fondo haga scroll mientras la hoja está abierta
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="th-overlay" onClick={() => onCloseRef.current()}>
      <aside
        className="th-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="th-sheet-header">
          <div>
            <h2 className="th-sheet-title">{title}</h2>
            {subtitle && <p className="th-sheet-subtitle">{subtitle}</p>}
          </div>
          <button className="th-close" onClick={() => onCloseRef.current()} aria-label="Cerrar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </header>
        <div className="th-sheet-body">{children}</div>
      </aside>
    </div>
  );
};

export default HistorySheet;
