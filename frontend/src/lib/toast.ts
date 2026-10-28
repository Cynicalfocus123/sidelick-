// Site-wide toast messages (F7). Shown by <Toaster /> in the root layout.
export type ToastItem = { text: string; kind: "ok" | "bad" | "info" };

export const TOAST_EVENT = "sl:toast";
export const TOAST_PENDING_KEY = "sl-toast-pending";

export function toast(text: string, kind: ToastItem["kind"] = "info") {
  window.dispatchEvent(new CustomEvent<ToastItem>(TOAST_EVENT, { detail: { text, kind } }));
}

// For a toast that must still show after moving to another page.
export function toastAfterNavigation(text: string, kind: ToastItem["kind"] = "info") {
  try {
    sessionStorage.setItem(TOAST_PENDING_KEY, JSON.stringify({ text, kind }));
  } catch {}
}
