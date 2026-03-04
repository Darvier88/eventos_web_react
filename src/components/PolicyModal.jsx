
import React from 'react';
import ReactMarkdown from 'react-markdown';
import './PolicyModal.css';

const PolicyModal = ({ open, title, content, onClose }) => {
  if (!open) return null;
  return (
    <div className="terms-modal-backdrop">
      <div className="terms-modal">
        <div className="terms-modal-header">
          <h2>{title}</h2>
          <button className="terms-close" onClick={onClose}>×</button>
        </div>
        <div className="terms-modal-body">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;
