import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken, clearToken } from './api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  // On page load, restore the logged-in user from the saved token.
  useEffect(() => {
    if (!getToken()) return;
    api('/auth/me')
      .then((d) => setUser(d.user))
      .catch(clearToken)
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = ({ token, user }) => {
    setToken(token);
    setUser(user);
  };

  const value = {
    user,
    loading,
    login: (email, password) => api('/auth/login', { method: 'POST', body: { email, password } }).then(handleAuth),
    register: (name, email, password) =>
      api('/auth/register', { method: 'POST', body: { name, email, password } }).then(handleAuth),
    logout: () => {
      clearToken();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
