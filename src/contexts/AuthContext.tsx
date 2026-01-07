import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { UserRole } from "@/lib/mockData"; 

// 1. UPDATED INTERFACE: Added 'user_metadata'
interface AppUser {
  id: string;
  email: string | undefined;
  role: UserRole;
  user_metadata: any; // <--- This fixes your error
  sap_id?: string;
}

interface AuthContextType {
  user: AppUser | null;
  login: (sapId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        processUser(session.user);
      } else {
        setLoading(false);
      }
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          processUser(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const processUser = (supabaseUser: SupabaseUser) => {
    const role = (supabaseUser.user_metadata?.role as UserRole) || "student";
    
    // 2. UPDATED SET USER: Passing metadata
    setUser({
      id: supabaseUser.id,
      email: supabaseUser.email,
      role: role,
      user_metadata: supabaseUser.user_metadata, // <--- Passing the data here
      sap_id: supabaseUser.user_metadata?.sap_id,
    });
    setLoading(false);
  };

  const login = async (sapId: string, password: string) => {
    const normalizedSap = sapId.trim();
    if (!normalizedSap) throw new Error("SAP ID is required");

    // Prefer secure RPC to map SAP -> email (doesn't require public RLS)
    let emailFromSap: string | null = null;
    const { data: rpcEmail, error: rpcError } = await supabase.rpc('email_for_sap_id', { sap: normalizedSap });
    if (!rpcError && rpcEmail) {
      emailFromSap = typeof rpcEmail === 'string' ? rpcEmail : (rpcEmail as any).email;
    }

    // Fallback to direct select if RPC not available (requires RLS allowing select)
    if (!emailFromSap) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('email')
        .eq('sap_id', normalizedSap)
        .single();
      if (!profileError && profile?.email) emailFromSap = profile.email;
    }

    if (!emailFromSap) {
      throw new Error("SAP ID not found");
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: emailFromSap,
      password,
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
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