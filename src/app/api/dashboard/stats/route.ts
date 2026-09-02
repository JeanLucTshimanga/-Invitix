import { NextResponse } from "next/server";
import { db } from "@/db";
import { events, guests, users, checkins } from "@/db/schema";
import { eq, sql, and, gte } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const conditions = user.role !== "super_admin" && user.organizationId
    ? [eq(events.organizationId, user.organizationId)]
    : [];

  // Event stats
  const [eventStats] = await db
    .select({
      total: sql<number>`count(*)`,
      active: sql<number>`sum(case when ${events.status} = 'active' then 1 else 0 end)`,
      draft: sql<number>`sum(case when ${events.status} = 'draft' then 1 else 0 end)`,
      completed: sql<number>`sum(case when ${events.status} = 'completed' then 1 else 0 end)`,
    })
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  // Guest stats (across all events)
  const [guestStats] = await db
    .select({
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${guests.isPresent} then 1 else 0 end)`,
      confirmed: sql<number>`sum(case when ${guests.rsvpStatus} = 'confirmed' then 1 else 0 end)`,
      declined: sql<number>`sum(case when ${guests.rsvpStatus} = 'declined' then 1 else 0 end)`,
      sent: sql<number>`sum(case when ${guests.invitationStatus} = 'sent' then 1 else 0 end)`,
      opened: sql<number>`sum(case when ${guests.invitationStatus} = 'opened' then 1 else 0 end)`,
    })
    .from(guests);

  // Recent events
  const recentEvents = await db
    .select({
      id: events.id,
      name: events.name,
      type: events.type,
      date: events.date,
      status: events.status,
      location: events.location,
      coverImage: events.coverImage,
    })
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(sql`${events.date} DESC`)
    .limit(5);

  // Guest count per event for recent events
  const eventGuestCounts = await db
    .select({
      eventId: guests.eventId,
      total: sql<number>`count(*)`,
      present: sql<number>`sum(case when ${guests.isPresent} then 1 else 0 end)`,
    })
    .from(guests)
    .groupBy(guests.eventId);

  const guestCountMap: Record<string, { total: number; present: number }> = {};
  eventGuestCounts.forEach((c) => {
    guestCountMap[c.eventId] = { total: Number(c.total), present: Number(c.present) };
  });

  // Stats by event type
  const typeStats = await db
    .select({
      type: events.type,
      count: sql<number>`count(*)`,
    })
    .from(events)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(events.type);

  // Total users (super_admin only)
  let totalUsers = 0;
  if (user.role === "super_admin") {
    const [uCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    totalUsers = Number(uCount?.count || 0);
  }

  const totalGuests = Number(guestStats?.total || 0);
  const presentGuests = Number(guestStats?.present || 0);

  return NextResponse.json({
    events: {
      total: Number(eventStats?.total || 0),
      active: Number(eventStats?.active || 0),
      draft: Number(eventStats?.draft || 0),
      completed: Number(eventStats?.completed || 0),
    },
    guests: {
      total: totalGuests,
      present: presentGuests,
      confirmed: Number(guestStats?.confirmed || 0),
      declined: Number(guestStats?.declined || 0),
      sent: Number(guestStats?.sent || 0),
      opened: Number(guestStats?.opened || 0),
      attendanceRate: totalGuests > 0 ? Math.round((presentGuests / totalGuests) * 100) : 0,
    },
    totalUsers,
    recentEvents: recentEvents.map((e) => ({
      ...e,
      guestCount: guestCountMap[e.id] || { total: 0, present: 0 },
    })),
    typeStats,
  });
}
