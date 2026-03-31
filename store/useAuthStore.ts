import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getClientPersistStorage } from "@/lib/zustand-persist-storage";

interface AuthStore {
  isLoggedIn: boolean;
  userEmail: string | null;
  login: (email: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      userEmail: null,
      login:  (email: string) => set({ isLoggedIn: true, userEmail: email }),
      logout: ()              => set({ isLoggedIn: false, userEmail: null }),
    }),
    { name: "julius-auth", storage: getClientPersistStorage() }
  )
);
