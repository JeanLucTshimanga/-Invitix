import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, organizations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, signToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, password, organizationName, phone } =
      await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Tous les champs obligatoires doivent être remplis" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 409 }
      );
    }

    // Check if this is the first user (becomes super_admin)
    const allUsers = await db.select({ id: users.id }).from(users).limit(1);
    const isFirstUser = allUsers.length === 0;

    const passwordHash = await hashPassword(password);

    // Create organization if provided
    let organizationId: string | null = null;
    if (organizationName) {
      const [org] = await db
        .insert(organizations)
        .values({
          name: organizationName,
        })
        .returning({ id: organizations.id });
      organizationId = org.id;
    }

    const [user] = await db
      .insert(users)
      .values({
        firstName,
        lastName,
        email: email.toLowerCase(),
        passwordHash,
        phone: phone || null,
        role: isFirstUser ? "super_admin" : "organizer",
        organizationId,
      })
      .returning({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        organizationId: users.organizationId,
      });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    });

    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
