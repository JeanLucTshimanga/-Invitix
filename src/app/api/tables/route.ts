import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { eventTables, guests } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { eventId, tableNumber, name, capacity, notes } = await request.json();

  if (!eventId || !tableNumber) {
    return NextResponse.json({ error: "eventId et tableNumber requis" }, { status: 400 });
  }

  const [table] = await db
    .insert(eventTables)
    .values({ eventId, tableNumber, name, capacity: capacity || 8, notes })
    .returning();

  return NextResponse.json({ table }, { status: 201 });
}
