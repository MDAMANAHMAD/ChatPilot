/**
 * AUTHENTICATION CONTEXT
 * 
 * This provider manages the global user session state for the React app.
 * It provides methods for:
 * - Persisting user info in LocalStorage (keeping users logged in on refresh).
 * - Login, Registration, and Logout handling.
 * - Loading state management for slow network checks.
 */

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Custom hook for easier access to auth state in components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * ON LOAD: Check for existing session
   * Retrieves user data from LocalStorage to restore the session immediately.
   */
  useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (userInfo) {
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  /**
   * LOGIN METHOD
   * Calls the backend API and stores the returned User + JWT token.
   */
  const login = async (email, password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /**
   * REGISTRATION METHOD
   * Creates a new user account on the backend and initiates a session.
   */
  const register = async (username, email, phoneNumber, password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, phoneNumber, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('userInfo', JSON.stringify(data));
        setUser(data);
        return { success: true };
      }
      return { success: false, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  /**
   * LOGOUT METHOD
   * Clears state and local storage to terminate the session.
   */
  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
