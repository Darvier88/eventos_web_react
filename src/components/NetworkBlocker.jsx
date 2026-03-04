import React from 'react';
import './NetworkBlocker.css';

const NetworkBlocker = ({ show, message }) => {
  if (!show) return null;
  return (
    <div className="network-blocker-overlay">
      <div className="network-blocker-modal">
        <h2>Problema de conexión</h2>
        <p>{message || 'No se detecta una conexión estable a internet. Por favor, revisa tu red.'}</p>
      </div>
    </div>
  );
};

export default NetworkBlocker;
