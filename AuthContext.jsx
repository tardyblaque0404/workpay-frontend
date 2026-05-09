import { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import api from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  // 1. On mount, check if a token exists in localStorage
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const token = localStorage.getItem('access_token');
    
    if (!token) {
      setLoading(false);
      return;
    }

    // Use the stored token to get user details
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => {
        // If token is invalid/expired, clean up
        localStorage.removeItem('access_token');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // 2. Updated Login: Save the token
  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    
    const { access_token, user } = res.data;
    
    // Save the "passport" to the browser's storage
    localStorage.setItem('access_token', access_token);
    
    setUser(user);
    return user;
  };

  // 3. Updated Logout: Remove the token
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error("Logout failed on server, but clearing local session anyway.");
    } finally {
      localStorage.removeItem('access_token');
      setUser(null);
    }
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);