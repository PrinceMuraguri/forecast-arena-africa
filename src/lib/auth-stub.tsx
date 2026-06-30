import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

// Phase 0 stub auth context — replaced with real Supabase session in Phase 1.

export type StubUser = {
  id: string;
  fullName: string;
  email: string;
  walletKes: number;
};

type AuthContextValue = {
  user: StubUser | null;
  isAuthenticated: boolean;
  signInStub: () => void;
  signOutStub: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const DEMO_USER: StubUser = {
  id: "demo-user",
  fullName: "Wanjiru K.",
  email: "demo@forecastarena.africa",
  walletKes: 1240,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StubUser | null>(null);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      signInStub: () => setUser(DEMO_USER),
      signOutStub: () => setUser(null),
    }),
    [user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
