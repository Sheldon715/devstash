export const PASSWORD_RESET_MIN_PASSWORD_LENGTH = 8;

export function isValidPasswordResetPassword(password: string) {
  return password.length >= PASSWORD_RESET_MIN_PASSWORD_LENGTH;
}
