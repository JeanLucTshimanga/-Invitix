import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guests, eventTables, checkins } from "@/db/schema-sqlite";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await params;

  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });

  const [stats] = await db
    .select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${guests.isPresent} then 1 else 0 end)`,
      confirmed: sql<number>`sum(case when ${guests.rsvpStatus} = 'confirmed' then 1 else 0 end)`,
      declined: sql<number>`sum(case when ${guests.rsvpStatus} = 'declined' then 1 else 0 end)`,
      pending: sql<number>`sum(case when ${guests.rsvpStatus} = 'pending' then 1 else 0 end)`,
      sent: sql<number>`sum(case when ${guests.invitationStatus} = 'sent' then 1 else 0 end)`,
      vipPresent: sql<number>`sum(case when ${guests.category} = 'vip' and ${guests.isPresent} then 1 else 0 end)`,
    })
    .from(guests)
    .where(eq(guests.eventId, id));

  const tables = await db
    .select()
    .from(eventTables)
    .where(eq(eventTables.eventId, id))
    .orderBy(eventTables.tableNumber);

  return NextResponse.json({
    event,
    stats: {
      total: Number(stats?.total || 0),
      present: Number(stats?.present || 0),
      confirmed: Number(stats?.confirmed || 0),
      declined: Number(stats?.declined || 0),
      pending: Number(stats?.pending || 0),
      sent: Number(stats?.sent || 0),
      vipPresent: Number(stats?.vipPresent || 0),
    },
    tables,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  };

  const fields = [
    "name", "type", "description", "location", "address",
    "coverImage", "maxGuests", "status", "customMessage", "invitationTemplate",
    "isPublic"
  ];

  fields.forEach((field) => {
    if (body[field] !== undefined) updateData[field] = body[field];
  });

  if (body.date) updateData.date = new Date(body.date);
  if (body.endDate) updateData.endDate = new Date(body.endDate);
  if (body.maxGuests !== undefined) updateData.maxGuests = Number(body.maxGuests);

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(eq(events.id, id))
    .returning();

  if (!updated) return NextResponse.json({ error: "Événement non trouvé" }, { status: 404 });

  return NextResponse.json({ event: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id } = await params;

  await db.delete(checkins).where(eq(checkins.eventId, id));
  await db.delete(guests).where(eq(guests.eventId, id));
  await db.delete(eventTables).where(eq(eventTables.eventId, id));
  await db.delete(events).where(eq(events.id, id));

  return NextResponse.json({ success: true });
}
