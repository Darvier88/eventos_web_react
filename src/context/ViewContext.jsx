import React, { createContext, useContext, useState } from 'react';

const ViewContext = createContext();

export const ViewProvider = ({ children }) => {
  const [viewMode, setViewMode] = useState('gallery'); // 'gallery' o 'list'

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'gallery' ? 'list' : 'gallery');
  };

  return (
    <ViewContext.Provider value={{ viewMode, toggleViewMode }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useViewMode = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useViewMode must be used within ViewProvider');
  }
  return context;
};
