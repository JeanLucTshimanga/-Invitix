import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { events, guests } from "@/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const type = searchParams.get("type") || "";

  let conditions = [];
  if (user.role !== "super_admin" && user.organizationId) {
    conditions.push(eq(events.organizationId, user.organizationId));
  } else if (user.role === "organizer") {
    conditions.push(eq(events.createdById, user.id));
  }

  const allEvents = await db
    .select({
      id: events.id,
      name: events.name,
      type: events.type,
      description: events.description,
      date: events.date,
      endDate: events.endDate,
      location: events.location,
      address: events.address,
      coverImage: events.coverImage,
      maxGuests: events.maxGuests,
      status: events.status,
      invitationTemplate: events.invitationTemplate,
      customMessage: events.customMessage,
      createdAt: events.createdAt,
      organizationId: events.organizationId,
      createdById: events.createdById,
    })
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(events.createdAt));

  let filtered = allEvents;

  if (search) {
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        (e.location?.toLowerCase().includes(search.toLowerCase()) ?? false)
    );
  }
  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }
  if (type) {
    filtered = filtered.filter((e) => e.type === type);
  }

  // Get guest counts
  const eventIds = filtered.map((e) => e.id);
  const guestCounts: Record<string, { total: number; present: number; confirmed: number }> = {};

  if (eventIds.length > 0) {
    const counts = await db
      .select({
        eventId: guests.eventId,
        total: sql<number>`count(*)`,
        present: sql<number>`sum(case when ${guests.isPresent} then 1 else 0 end)`,
        confirmed: sql<number>`sum(case when ${guests.rsvpStatus} = 'confirmed' then 1 else 0 end)`,
      })
      .from(guests)
      .where(sql`${guests.eventId} = ANY(ARRAY[${sql.raw(eventIds.map((id) => `'${id}'`).join(","))}]::uuid[])`)
      .groupBy(guests.eventId);

    counts.forEach((c) => {
      guestCounts[c.eventId] = {
        total: Number(c.total),
        present: Number(c.present),
        confirmed: Number(c.confirmed),
      };
    });
  }

  const result = filtered.map((e) => ({
    ...e,
    guestCount: guestCounts[e.id] || { total: 0, present: 0, confirmed: 0 },
  }));

  return NextResponse.json({ events: result });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const body = await request.json();
  const {
    name, type, description, date, endDate, location,
    address, coverImage, maxGuests, status, customMessage, invitationTemplate
  } = body;

  if (!name || !date) {
    return NextResponse.json({ error: "Nom et date requis" }, { status: 400 });
  }

  const [event] = await db
    .insert(events)
    .values({
      name,
      type: type || "other",
      description,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      location,
      address,
      coverImage,
      maxGuests: maxGuests ? Number(maxGuests) : 0,
      status: status || "draft",
      customMessage,
      invitationTemplate: invitationTemplate || 1,
      organizationId: user.organizationId,
      createdById: user.id,
    })
    .returning();

  return NextResponse.json({ event }, { status: 201 });
}
