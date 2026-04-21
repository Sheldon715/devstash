import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RegisterRequestBody = {
  name?: unknown;
  email?: unknown;
  password?: unknown;
  confirmPassword?: unknown;
};

function parseRegisterRequestBody(body: RegisterRequestBody) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

  if (!email || !password || !confirmPassword) {
    return {
      error: "Email, password, and confirmPassword are required.",
    };
  }

  if (password !== confirmPassword) {
    return {
      error: "Passwords do not match.",
    };
  }

  return {
    data: {
      name: name || null,
      email,
      password,
    },
  };
}

export async function POST(request: Request) {
  let body: RegisterRequestBody;

  try {
    body = (await request.json()) as RegisterRequestBody;
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  const parsedBody = parseRegisterRequestBody(body);

  if ("error" in parsedBody) {
    return NextResponse.json(
      {
        success: false,
        error: parsedBody.error,
      },
      { status: 400 },
    );
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: parsedBody.data.email,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return NextResponse.json(
      {
        success: false,
        error: "An account with this email already exists.",
      },
      { status: 409 },
    );
  }

  const passwordHash = await hash(parsedBody.data.password, 12);

  const user = await prisma.user.create({
    data: {
      name: parsedBody.data.name,
      email: parsedBody.data.email,
      passwordHash,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: user,
    },
    { status: 201 },
  );
}
