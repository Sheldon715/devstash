export interface SignInActionState {
  email: string;
  error: string | null;
  redirectTo: string | null;
  resendVerificationEmail: string | null;
}

export const INITIAL_SIGN_IN_STATE: SignInActionState = {
  email: "",
  error: null,
  redirectTo: null,
  resendVerificationEmail: null,
};
