import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { User } from "@shared/schema";

type AuthMode = "login" | "signup";

type RequireAuthOptions = {
  /** Title shown in toast when user is not logged in. */
  title?: string;
  /** Description shown in toast when user is not logged in. */
  description?: string;
  /** Mode the auth modal opens in (default: "login"). */
  mode?: AuthMode;
};

type AuthContextType = {
  user: Omit<User, "password"> | null;
  loading: boolean;
  authModalOpen: boolean;
  authModalMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
  /**
   * Run `action` if the user is signed in; otherwise open the auth modal
   * and queue the action to run automatically after a successful sign-in.
   * Returns true if the action ran immediately, false if it was queued.
   */
  requireAuth: (action: () => void, opts?: RequireAuthOptions) => boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithGoogle: (credential: string, rememberMe?: boolean) => Promise<void>;
  register: (data: RegisterData, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<RegisterData>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  gotra?: string;
  birthDate?: string;
  birthTime?: string;
  birthCity?: string;
  referralCode?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const STORAGE_KEY = "vedic-tatva-user";

function loadUser(): Omit<User, "password"> | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return null;
}

function persistUser(user: Omit<User, "password">, remember: boolean) {
  const json = JSON.stringify(user);
  try {
    if (remember) {
      localStorage.setItem(STORAGE_KEY, json);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, json);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

function clearStoredUser() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Omit<User, "password"> | null>(loadUser);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const pendingActionRef = useRef<(() => void) | null>(null);
  const rememberPrefRef = useRef<boolean>(true);

  // Persist any change to user, but don't change which storage was chosen
  // at sign-in time — that decision lives in rememberPrefRef.
  useEffect(() => {
    if (user) {
      persistUser(user, rememberPrefRef.current);
      const queued = pendingActionRef.current;
      if (queued) {
        pendingActionRef.current = null;
        setTimeout(() => {
          try { queued(); } catch {}
        }, 50);
      }
    } else {
      clearStoredUser();
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session")
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setUser(null);
          return;
        }
        setUser(await res.json());
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const openAuth = useCallback((mode: AuthMode = "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);
  const closeAuth = useCallback(() => {
    setAuthModalOpen(false);
    // Modal closed without a successful sign-in: drop any pending action
    pendingActionRef.current = null;
  }, []);

  const requireAuth = useCallback((action: () => void, opts?: RequireAuthOptions) => {
    if (user) {
      action();
      return true;
    }
    pendingActionRef.current = action;
    setAuthModalMode(opts?.mode || "login");
    setAuthModalOpen(true);
    if (opts?.title || opts?.description) {
      // Lightweight inline toast via window event (decoupled from useToast)
      try {
        window.dispatchEvent(new CustomEvent("auth-required-toast", {
          detail: { title: opts.title, description: opts.description },
        }));
      } catch {}
    }
    return false;
  }, [user]);

  const login = async (email: string, password: string, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Login failed");
      }
      const data = await res.json();
      rememberPrefRef.current = rememberMe;
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Google sign-in failed");
      }
      const data = await res.json();
      rememberPrefRef.current = rememberMe;
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData, rememberMe: boolean = true) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Registration failed");
      }
      const userData = await res.json();
      rememberPrefRef.current = rememberMe;
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Could not send reset link");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Could not reset password");
      }
      const data = await res.json();
      rememberPrefRef.current = true;
      setUser(data);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    setUser(null);
  };

  const updateProfile = async (data: Partial<RegisterData>) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/profile/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Update failed");
      }
      const updated = await res.json();
      setUser(updated);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading,
      authModalOpen, authModalMode, openAuth, closeAuth, requireAuth,
      login, loginWithGoogle, register, logout, updateProfile,
      requestPasswordReset, resetPassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
