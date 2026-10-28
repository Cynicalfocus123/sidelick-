// Opens the sign-up popup (<SignupPopup /> in the root layout). action = what the visitor tried, e.g. "follow Ava Rae".
export const SIGNUP_EVENT = "sl:signup";

export function askToSignUp(action: string) {
  window.dispatchEvent(new CustomEvent<string>(SIGNUP_EVENT, { detail: action }));
}
