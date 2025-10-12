import React, { createContext, useState } from 'react';

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [metas, setMetas] = useState({
    study: 5,
    leisure: 5,
    dev: 5,
  });

  return (
    <SettingsContext.Provider value={{ metas, setMetas }}>
      {children}
    </SettingsContext.Provider>
  );
};

