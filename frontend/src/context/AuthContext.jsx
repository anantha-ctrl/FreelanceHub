import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true,
  sessionExpiry: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        sessionExpiry: action.payload.sessionExpiry
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false };
    case 'LOADING_DONE':
      return { ...state, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Intercept 401 (token expired / session invalid)
  useEffect(() => {
    const interceptor = API.interceptors.response.use(
      res => res,
      err => {
        if (err.response?.status === 401) {
          const code = err.response?.data?.code;
          if (code === 'TOKEN_EXPIRED') {
            toast.error('Your session has expired. Please login again.');
          } else if (code === 'SESSION_INVALID') {
            toast.error('Session is no longer valid. Please login again.');
          }
          if (state.isAuthenticated) logout(true);
        }
        return Promise.reject(err);
      }
    );
    return () => API.interceptors.response.eject(interceptor);
  }, [state.isAuthenticated]);

  // Restore session from HTTP Cookie on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await API.get('/auth/me');
        if (res.data.success && res.data.user) {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: { user: res.data.user, token: null, sessionExpiry: null }
          });
        } else {
          dispatch({ type: 'LOADING_DONE' });
        }
      } catch {
        dispatch({ type: 'LOADING_DONE' });
      }
    };
    restoreSession();
  }, []);

  const clearSession = () => {
    // Session is cleared on backend via clearCookie
  };

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, user, sessionExpiresIn } = res.data;
      const sessionExpiry = sessionExpiresIn ? Date.now() + sessionExpiresIn : null;

      if (token) {
        API.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token, sessionExpiry } });
      toast.success(`Welcome back, ${user.name}!`);
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const register = async (name, email, mobile, password) => {
    try {
      await API.post('/auth/register', { name, email, mobile, password });
      toast.success('Account created! Please login.');
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed.';
      toast.error(message);
      return { success: false, message };
    }
  };

  const logout = useCallback(async (silent = false) => {
    try {
      if (!silent) await API.post('/auth/logout');
    } catch {}
    clearSession();
    delete API.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
    if (!silent) toast.success('Logged out successfully.');
  }, []);

  const updateUser = (updates) => dispatch({ type: 'UPDATE_USER', payload: updates });

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
