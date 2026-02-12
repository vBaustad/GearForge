"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChecklistContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const ChecklistContext = createContext<ChecklistContextType | null>(null);

export function ChecklistProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return (
    <ChecklistContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </ChecklistContext.Provider>
  );
}

export function useChecklist() {
  const context = useContext(ChecklistContext);
  if (!context) {
    throw new Error("useChecklist must be used within ChecklistProvider");
  }
  return context;
}
