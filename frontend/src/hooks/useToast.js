import { useState, useCallback } from "react";

let toastIdCounter = 0;

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = "info") => {
    const id = ++toastIdCounter;
    setToasts((prev) => {
      const next = [...prev, { id, message, type }];
      return next.slice(-3); // max 3
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, show, dismiss };
};

export default useToast;
