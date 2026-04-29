import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuthVerify, getAuthVerifyQueryKey } from "@workspace/api-client-react";
import type { User } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    typeof window !== "undefined" ? localStorage.getItem("tv_token") : null
  );

  const { data: verifyData, isLoading: verifyLoading, isError } = useAuthVerify({
    query: {
      queryKey: getAuthVerifyQueryKey(),
      enabled: !!token,
      retry: false,
    },
  });

  useEffect(() => {
    if (verifyData?.user) {
      setUser(verifyData.user);
    } else if (isError) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("tv_token");
    }
  }, [verifyData, isError]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("tv_token", newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("tv_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading: !!token && verifyLoading, login, logout }}>
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
