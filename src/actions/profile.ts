"use server";

import { compare, hash } from "bcryptjs";

import { signOut } from "@/auth";
import { auth } from "@/auth";
import {
  isValidPasswordResetPassword,
  PASSWORD_RESET_MIN_PASSWORD_LENGTH,
} from "@/lib/password-rules";
import { prisma } from "@/lib/prisma";

interface DeleteAccountActionState {
  error: string | null;
}

interface ChangePasswordActionState {
  error: string | null;
  success: string | null;
}

export async function changePasswordAction(
  _previousState: ChangePasswordActionState,
  formData: FormData,
): Promise<ChangePasswordActionState> {
  const currentPasswordValue = formData.get("currentPassword");
  const newPasswordValue = formData.get("newPassword");
  const confirmPasswordValue = formData.get("confirmPassword");
  const currentPassword =
    typeof currentPasswordValue === "string" ? currentPasswordValue : "";
  const newPassword = typeof newPasswordValue === "string" ? newPasswordValue : "";
  const confirmPassword =
    typeof confirmPasswordValue === "string" ? confirmPasswordValue : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      error: "Enter your current password, new password, and confirmation.",
      success: null,
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: "New password and confirmation do not match.",
      success: null,
    };
  }

  if (!isValidPasswordResetPassword(newPassword)) {
    return {
      error: `Use at least ${PASSWORD_RESET_MIN_PASSWORD_LENGTH} characters for your new password.`,
      success: null,
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "You need to be signed in to change your password.",
      success: null,
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      passwordHash: true,
    },
  });

  if (!user?.passwordHash) {
    return {
      error: "This account does not use an email password.",
      success: null,
    };
  }

  const isCurrentPasswordValid = await compare(currentPassword, user.passwordHash);

  if (!isCurrentPasswordValid) {
    return {
      error: "Current password is incorrect.",
      success: null,
    };
  }

  const isSamePassword = await compare(newPassword, user.passwordHash);

  if (isSamePassword) {
    return {
      error: "Choose a new password that is different from your current password.",
      success: null,
    };
  }

  const passwordHash = await hash(newPassword, 12);

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      passwordHash,
    },
  });

  return {
    error: null,
    success: "Your password has been updated.",
  };
}

export async function deleteAccountAction(
  _previousState: DeleteAccountActionState,
  formData: FormData,
): Promise<DeleteAccountActionState> {
  const confirmation = formData.get("confirmation");
  const confirmationValue = typeof confirmation === "string" ? confirmation.trim() : "";

  if (confirmationValue !== "DELETE") {
    return {
      error: 'Type "DELETE" to confirm account deletion.',
    };
  }

  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: "You need to be signed in to delete your account.",
    };
  }

  await prisma.user.delete({
    where: {
      id: session.user.id,
    },
  });

  await signOut({
    redirectTo: "/sign-in?deleted=1",
  });

  return {
    error: null,
  };
}
