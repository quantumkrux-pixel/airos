import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      console.log('Starting session check...');
      
      const safetyTimeout = setTimeout(() => {
        console.log('Safety timeout triggered - showing login screen');
        setIsLoading(false);
      }, 3000);
      
      try {
        const { data, error } = await supabase.auth.getSession();
        console.log('Session check response:', { data, error });
        
        if (error) {
          console.error('Supabase connection error:', error);
        }
        
        if (data?.session) {
          console.log('User session found:', data.session.user.email);
          setCurrentUser(data.session.user);
        } else {
          console.log('No active session found - showing login');
        }
      } catch (error) {
        console.error('Error during session check:', error);
      } finally {
        clearTimeout(safetyTimeout);
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };
    
    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });
      if (error) throw error;
      if (data.user) {
        return { success: true, message: 'Account created! Check your email to confirm.' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  return {
    currentUser,
    isLoading,
    login,
    register,
    logout
  };
};