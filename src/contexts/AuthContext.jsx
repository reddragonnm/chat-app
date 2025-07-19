import { useContext, createContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

import LoadingSpinner from "@/components/LoadingSpinner";

// instantiate supbase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error.message);
      return false;
    }

    return true;
  };

  const register = async ({ email, password, name, username }) => {
    const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${username}`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, name, avatarUrl },
      },
    });

    if (error) {
      console.error("Error during registration:", error.message);
      return false;
    }

    return true;
  };

  const getUsername = async () => {
    const { data, error } = await supabase
      .from("userdata")
      .select("username")
      .eq("user_id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching username:", error.message);
      return null;
    }

    return data.username;
  };

  const logout = () => {
    supabase.auth.signOut().then(() => {
      setSession(null);
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <AuthContext.Provider
      value={{ session, login, logout, register, getUsername }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
