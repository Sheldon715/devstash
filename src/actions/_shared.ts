import { z } from "zod";

import { auth } from "@/auth";

export type ActionResult<T> =
  | {
      success: true;
      data: T;
      error: null;
    }
  | {
      success: false;
      data: null;
      error: string;
    };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return {
    success: true,
    data,
    error: null,
  };
}

export function actionFailure(error: string): ActionResult<never> {
  return {
    success: false,
    data: null,
    error,
  };
}

export function getZodErrorMessage(error: z.ZodError) {
  return error.issues.map((issue) => issue.message).join(" ");
}

export function nonEmptyIdSchema(message: string) {
  return z.string().trim().min(1, message);
}

export async function getActionUserId() {
  const session = await auth();

  return session?.user?.id ?? null;
}

interface RunOwnedMutationOptions<TRecord, TResult> {
  id: string;
  idSchema: z.ZodType<string>;
  unauthorizedError: string;
  notFoundError: string;
  mutate: (userId: string, id: string) => Promise<TRecord | null>;
  serialize: (record: TRecord, id: string) => TResult;
}

export async function runOwnedMutation<TRecord, TResult>(
  options: RunOwnedMutationOptions<TRecord, TResult>,
): Promise<ActionResult<TResult>> {
  const parsedId = options.idSchema.safeParse(options.id);

  if (!parsedId.success) {
    return actionFailure(options.notFoundError);
  }

  const userId = await getActionUserId();

  if (!userId) {
    return actionFailure(options.unauthorizedError);
  }

  const record = await options.mutate(userId, parsedId.data);

  if (!record) {
    return actionFailure(options.notFoundError);
  }

  return actionSuccess(options.serialize(record, parsedId.data));
}
