import { createContext, useContext, useEffect, useState } from "react";
import { ID, Models } from "react-native-appwrite";
import { account } from "./appwrite";

type AuthContextType = {
  user: Models.User<Models.Preferences> | null;
  loadingUser: boolean;
  signUp: (email: string, password: string) => Promise<string | null>;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(
    null
  );

  const [loadingUser, setLoadingUser] = useState<boolean>(true);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    try {
      const session = await account.get();
      setUser(session);
    } catch (error) {
      setUser(null);
    } finally {
      setLoadingUser(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await account.create(ID.unique(), email, password);
      await signIn(email, password);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occured during signup";
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      await account.createEmailPasswordSession(email, password);
      const sessionUser = await account.get();
      setUser(sessionUser);
      return null;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      return "An error occurred during signin";
    }
  };

  const signOut = async () => {
    try {
      await account.deleteSession("current");
      setUser(null);
    } catch (error) {
      ''
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, signIn, signUp, signOut, loadingUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be inside AuthProvider");
  }
  return context;
}
