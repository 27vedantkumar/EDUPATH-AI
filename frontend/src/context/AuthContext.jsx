import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export const AuthState = {
  AUTH_LOADING: 'AUTH_LOADING',
  AUTHENTICATED: 'AUTHENTICATED',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  DEMO_AUTHENTICATED: 'DEMO_AUTHENTICATED',
};

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
      // Automatically provision or restore demo profile for hackathon showcase
      const demoData = await api.getDemoUser();
      if (demoData && demoData.user) {
        setUser({
          ...demoData.user,
          profile: demoData.profile || {
            overall_mastery: 0.62,
            level: 4,
            xp_points: 1240,
            current_streak_days: 7,
          }
        });
        setAuthState(AuthState.DEMO_AUTHENTICATED);
      } else {
        setAuthState(AuthState.UNAUTHENTICATED);
      }

      // Fetch active courses
      const courseList = await api.listCourses();
      if (Array.isArray(courseList) && courseList.length > 0) {
        setCourses(courseList);
        setCurrentCourse(courseList[0]);
      } else {
        // Fallback default course
        const defaultCourse = {
          id: 'OS_101',
          code: 'OS_101',
          title: 'Operating Systems & Concurrency',
          description: 'Multimodal computer science course covering deadlocks, Banker algorithm, CPU scheduling, and memory.'
        };
        setCourses([defaultCourse]);
        setCurrentCourse(defaultCourse);
      }
    } catch (err) {
      console.warn('Backend offline or initializing; activating demo fallback profile:', err);
      setUser({
        id: 'demo-user-1',
        username: 'alex_rivera',
        full_name: 'Alex Rivera',
        email: 'alex.rivera@edupath.ai',
        avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
        profile: {
          overall_mastery: 0.62,
          level: 4,
          xp_points: 1240,
          current_streak_days: 7,
        }
      });
      setAuthState(AuthState.DEMO_AUTHENTICATED);
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

  const loginDemo = async () => {
    await initAuth();
  };

  const logout = () => {
    setUser(null);
    setAuthState(AuthState.UNAUTHENTICATED);
  };

  return (
    <AuthContext.Provider value={{
      authState,
      user,
      setUser,
      currentCourse,
      setCurrentCourse,
      courses,
      loginDemo,
      logout,
      isDemo: authState === AuthState.DEMO_AUTHENTICATED,
      isAuthenticated: authState === AuthState.AUTHENTICATED || authState === AuthState.DEMO_AUTHENTICATED
    }}>
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
