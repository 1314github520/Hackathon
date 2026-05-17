"use client";

import { create } from "zustand";

import type { SessionPayload } from "@/types/api";
import {
  getAdminSession,
  getFrontendSession,
  setAdminSession,
  setFrontendSession,
} from "@/lib/storage";

type AuthStore = {
  frontendSession: SessionPayload | null;
  adminSession: SessionPayload | null;
  hasHydrated: boolean;
  hydrate: () => void;
  setFrontendSession: (session: SessionPayload | null) => void;
  setAdminSession: (session: SessionPayload | null) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  frontendSession: null,
  adminSession: null,
  hasHydrated: false,
  hydrate: () =>
    set({
      frontendSession: getFrontendSession(),
      adminSession: getAdminSession(),
      hasHydrated: true,
    }),
  setFrontendSession: (session) => {
    setFrontendSession(session);
    set({ frontendSession: session });
  },
  setAdminSession: (session) => {
    setAdminSession(session);
    set({ adminSession: session });
  },
}));
