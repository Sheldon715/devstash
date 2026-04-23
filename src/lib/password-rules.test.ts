import { describe, expect, it } from "vitest";

import {
  isValidPasswordResetPassword,
  PASSWORD_RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";

describe("password-rules", () => {
  it("accepts passwords at the minimum length", () => {
    expect(isValidPasswordResetPassword("a".repeat(PASSWORD_RESET_MIN_PASSWORD_LENGTH))).toBe(
      true,
    );
  });

  it("rejects passwords shorter than the minimum length", () => {
    expect(
      isValidPasswordResetPassword("a".repeat(PASSWORD_RESET_MIN_PASSWORD_LENGTH - 1)),
    ).toBe(false);
  });
});
