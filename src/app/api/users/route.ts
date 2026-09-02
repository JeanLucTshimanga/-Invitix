import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUser, hashPassword } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const allUsers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
      phone: users.phone,
      avatar: users.avatar,
      isActive: users.isActive,
      organizationId: users.organizationId,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: allUsers });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role !== "super_admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { firstName, lastName, email, password, role, phone } = await request.json();

  if (!firstName || !lastName || !email || !password) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  const [newUser] = await db
    .insert(users)
    .values({
      firstName, lastName,
      email: email.toLowerCase(),
      passwordHash,
      role: role || "organizer",
      phone: phone || null,
      organizationId: user.organizationId,
    })
    .returning({
      id: users.id, firstName: users.firstName, lastName: users.lastName,
      email: users.email, role: users.role, isActive: users.isActive, createdAt: users.createdAt,
    });

  return NextResponse.json({ user: newUser }, { status: 201 });
}
