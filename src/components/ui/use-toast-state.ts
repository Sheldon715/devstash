"use client";

import { useCallback, useState } from "react";

export interface ToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

export function useToastState() {
  const [toastState, setToastState] = useState<ToastState | null>(null);

  const clearToast = useCallback(() => {
    setToastState(null);
  }, []);

  const showToast = useCallback((nextToast: ToastState) => {
    setToastState(nextToast);
  }, []);

  return {
    clearToast,
    setToastState: showToast,
    toastState,
  };
}
