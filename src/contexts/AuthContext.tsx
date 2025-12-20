import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = 'admin' | 'user';
type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  approved_at: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isApproved: boolean;
  isPending: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (name: string, avatarUrl?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = roles.includes('admin');
  const isApproved = profile?.status === 'approved';
  const isPending = profile?.status === 'pending';

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchUserData(session.user.id);
            // Atualizar estatísticas de login quando faz login
            if (event === 'SIGNED_IN') {
              updateLoginStats(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateLoginStats = async (userId: string) => {
    try {
      // Incrementar login_count e atualizar last_login_at usando update direto
      await supabase
        .from('profiles')
        .update({ 
          last_login_at: new Date().toISOString(),
          last_active_at: new Date().toISOString()
        })
        .eq('id', userId);
      
      // Incrementar login_count separadamente
      const { data: profile } = await supabase
        .from('profiles')
        .select('login_count')
        .eq('id', userId)
        .single();
      
      if (profile) {
        await supabase
          .from('profiles')
          .update({ login_count: (profile.login_count || 0) + 1 })
          .eq('id', userId);
      }
    } catch (e) {
      console.error('Error updating login stats:', e);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      // Buscar profile e roles em paralelo
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, name, avatar_url, status, approved_at")
          .eq("id", userId)
          .single(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
      ]);

      if (profileResult.error) {
        console.error("Error fetching profile:", profileResult.error);
      } else {
        setProfile(profileResult.data as Profile);
      }

      if (rolesResult.error) {
        console.error("Error fetching roles:", rolesResult.error);
        setRoles([]);
      } else {
        const userRoles = rolesResult.data?.map(r => r.role as AppRole) || [];
        setRoles(userRoles);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserData(user.id);
    }
  };

  const updateProfile = async (name: string, avatarUrl?: string) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ 
        name, 
        ...(avatarUrl && { avatar_url: avatarUrl })
      })
      .eq("id", user.id);

    if (error) throw error;
    
    await fetchUserData(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        isAdmin,
        isApproved,
        isPending,
        loading,
        signOut,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
