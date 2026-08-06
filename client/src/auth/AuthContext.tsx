import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, api } from "@/lib/api";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  /** True until the initial session check finishes. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // The session lives in an httpOnly cookie the page cannot read, so the only
  // way to know whether one exists is to ask the server on mount.
  useEffect(() => {
    let cancelled = false;

    api
      .me()
      .then(({ user: me }) => {
        if (!cancelled) setUser(me);
      })
      .catch((err) => {
        // A 401 here is the normal "not signed in" case, not a failure.
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          console.error("[auth] session check failed:", err);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: me } = await api.login({ email, password });
    setUser(me);
  }, []);

  const signup = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
    }) => {
      const { user: me } = await api.signup(input);
      setUser(me);
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout }),
    [user, loading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
