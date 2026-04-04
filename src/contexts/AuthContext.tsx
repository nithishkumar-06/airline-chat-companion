import { createContext, useContext, useState, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

interface User {
  username: string;
  token: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  getToken: () => string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

// Simple base64url encoder (no padding, URL-safe)
const base64url = (str: string) =>
  btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

const createJwt = (username: string) => {
  const header = { alg: "HS256", typ: "JWT" };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    sub: uuidv4(),
    firstName: username.charAt(0).toUpperCase() + username.slice(1),
    personId: `${uuidv4()}`,
    profileId: `pro-${String(Math.floor(Math.random() * 999) + 1).padStart(3, "0")}`,
    lastName: "User",
    email: `${username.toLowerCase()}@tataairways.com`,
    loyaltyId: String(Math.floor(100000 + Math.random() * 900000)),
    admin: false,
    iat: now,
    exp: now + 86400,
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedPayload = base64url(JSON.stringify(payload));
  // Mock signature (not cryptographically valid, but structurally correct JWT)
  const mockSignature = base64url(`mock-sig-${now}`);

  return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
};

const COOKIE_NAME = "tata_auth_token";

const setTokenCookie = (token: string) => {
  const maxAge = 86400; // 1 day
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
};

const getTokenFromCookie = (): string | null => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match ? match[1] : null;
};

const clearTokenCookie = () => {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("auth_user");
    const token = getTokenFromCookie();
    if (stored && token) {
      const parsed = JSON.parse(stored);
      return { ...parsed, token };
    }
    return null;
  });

  const login = async (username: string, _password: string) => {
    const token = createJwt(username);
    setTokenCookie(token);
    const userData = { username, token };
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify({ username }));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    localStorage.removeItem("chat_session_id");
    clearTokenCookie();
  };

  const getToken = () => getTokenFromCookie();

  return (
    <AuthContext.Provider value={{ user, login, logout, getToken, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
