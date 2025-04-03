// app/context/UserContext.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const UserContext = createContext({
  user: null,
  isLoading: true,
  error: null
});

export function UserProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('listtogether_user') || null)
          : null;

        setState({
          user: storedUser,
          isLoading: false,
          error: null
        });
      } catch (error) {
        setState({
          user: null,
          isLoading: false,
          error: error
        });
      }
    };

    loadUser();
  }, []);

  return (
    <UserContext.Provider value={state}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}