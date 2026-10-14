import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthState = {
  AUTH_LOADING: 'AUTH_LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  DEMO_AUTHENTICATED: 'DEMO_AUTHENTICATED',
};

const STORAGE_KEY_AUTH_USER = 'edupath_authenticated_user_v1';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState(AuthState.AUTH_LOADING);
  const [user, setUser] = useState(null);
  const [currentCourse, setCurrentCourse] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    initAuth();
  }, []);

  const initAuth = async () => {
    try {
      setAuthState(AuthState.AUTH_LOADING);

      // 1. Check for active backend session (via HTTP-only cookie or current user)
      const sessionRes = await api.getCurrentUser().catch(() => null);
      if (sessionRes && sessionRes.user) {
        setUser(sessionRes.user);
        setAuthState(
          sessionRes.user.is_demo_user ? AuthState.DEMO_AUTHENTICATED : AuthState.AUTHENTICATED
        );
        localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(sessionRes.user));
      } else {
        // 2. Check local storage session fallback
        const stored = localStorage.getItem(STORAGE_KEY_AUTH_USER);
        if (stored) {
          try {
            const parsedUser = JSON.parse(stored);
            if (parsedUser && parsedUser.id) {
              setUser(parsedUser);
              setAuthState(
                parsedUser.is_demo_user ? AuthState.DEMO_AUTHENTICATED : AuthState.AUTHENTICATED
              );
            } else {
              setAuthState(AuthState.UNAUTHENTICATED);
            }
          } catch (_) {
            setAuthState(AuthState.UNAUTHENTICATED);
          }
        } else {
          // Unauthenticated state by default (prompts user to sign in, register, or click 1-Click Demo)
          setAuthState(AuthState.UNAUTHENTICATED);
        }
      }

      // Load active courses
      await loadCourses();
    } catch (err) {
      console.warn('Authentication check failed:', err);
      setAuthState(AuthState.UNAUTHENTICATED);
      await loadCourses();
    }
  };

  const loadCourses = async () => {
    try {
      const courseList = await api.listCourses();
      if (Array.isArray(courseList) && courseList.length > 0) {
        setCourses(courseList);
        setCurrentCourse(courseList[0]);
      } else {
        const defaultCourse = {
          id: 'OS_101',
          code: 'OS_101',
          title: 'Operating Systems & Concurrency',
          description: 'Multimodal computer science course covering deadlocks, Banker algorithm, CPU scheduling, and memory.'
        };
        setCourses([defaultCourse]);
        setCurrentCourse(defaultCourse);
      }
    } catch (_) {
      const defaultCourse = {
        id: 'OS_101',
        code: 'OS_101',
        title: 'Operating Systems & Concurrency',
        description: 'Multimodal computer science course covering deadlocks, Banker algorithm, CPU scheduling, and memory.'
      };
      setCourses([defaultCourse]);
      setCurrentCourse(defaultCourse);
    }
  };

  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res && res.user) {
      setUser(res.user);
      setAuthState(res.user.is_demo_user ? AuthState.DEMO_AUTHENTICATED : AuthState.AUTHENTICATED);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(res.user));
      return res;
    }
    throw new Error(res?.detail || 'Invalid username or password.');
  };

  const register = async (payload) => {
    return await api.register(payload);
  };

  const verifyEmail = async (token) => {
    return await api.verifyEmail(token);
  };

  const resendVerification = async (email) => {
    return await api.resendVerification(email);
  };

  const forgotPassword = async (email) => {
    return await api.forgotPassword(email);
  };

  const resetPassword = async (token, newPassword) => {
    return await api.resetPassword(token, newPassword);
  };

  const loginDemo = async () => {
    setAuthState(AuthState.AUTH_LOADING);
    const demoData = await api.getDemoUser();
    if (demoData && demoData.user) {
      setUser(demoData.user);
      setAuthState(AuthState.DEMO_AUTHENTICATED);
      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(demoData.user));
    }
  };

  const logout = async () => {
    try {
      await api.logout().catch(() => null);
    } finally {
      setUser(null);
      localStorage.removeItem(STORAGE_KEY_AUTH_USER);
      setAuthState(AuthState.UNAUTHENTICATED);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        user,
        setUser,
        currentCourse,
        setCurrentCourse,
        courses,
        login,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        loginDemo,
        logout,
        isDemo: authState === AuthState.DEMO_AUTHENTICATED,
        isAuthenticated:
          authState === AuthState.AUTHENTICATED || authState === AuthState.DEMO_AUTHENTICATED,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
