import { create } from 'zustand';

export interface User {
  id: number;
  username: string;
  email: string;
  token: string;
  followings?: number[];
  profilePicture?: string;
  coverPicture?: string;
  isAdmin: boolean;
  from?: string;
  city?: string;
  relationship?: number;
  desc?: string;
}

interface UserStore {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  updateCurrentUser: (patch: Partial<User>) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,

  setCurrentUser: (user) => set({ currentUser: user }),

  updateCurrentUser: (patch) =>
    set((state) => ({
      currentUser: state.currentUser ? { ...state.currentUser, ...patch } : null,
    })),

  clearUser: () => set({ currentUser: null }),
}));
