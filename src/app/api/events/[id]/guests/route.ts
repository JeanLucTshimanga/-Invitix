import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { guests, qrCodes, eventTables } from "@/db/schema";
import { eq, sql, and, ilike, or } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { generateInvitationCode } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: eventId } = await params;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const rsvpStatus = searchParams.get("rsvpStatus") || "";
  const isPresent = searchParams.get("isPresent") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const offset = (page - 1) * limit;

  const conditions = [eq(guests.eventId, eventId)];

  if (category) conditions.push(eq(guests.category, category as "family" | "friends" | "colleagues" | "vip" | "official" | "other"));
  if (rsvpStatus) conditions.push(eq(guests.rsvpStatus, rsvpStatus as "pending" | "confirmed" | "declined" | "maybe"));
  if (isPresent === "true") conditions.push(eq(guests.isPresent, true));
  if (isPresent === "false") conditions.push(eq(guests.isPresent, false));

  let guestList = await db
    .select({
      id: guests.id,
      firstName: guests.firstName,
      lastName: guests.lastName,
      email: guests.email,
      phone: guests.phone,
      photo: guests.photo,
      category: guests.category,
      allowedPersons: guests.allowedPersons,
      rsvpStatus: guests.rsvpStatus,
      isPresent: guests.isPresent,
      checkedInAt: guests.checkedInAt,
      invitationCode: guests.invitationCode,
      invitationStatus: guests.invitationStatus,
      notes: guests.notes,
      tableId: guests.tableId,
      eventId: guests.eventId,
      createdAt: guests.createdAt,
    })
    .from(guests)
    .where(and(...conditions))
    .orderBy(guests.lastName);

  if (search) {
    guestList = guestList.filter(
      (g) =>
        g.firstName.toLowerCase().includes(search.toLowerCase()) ||
        g.lastName.toLowerCase().includes(search.toLowerCase()) ||
        (g.email?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
        (g.phone?.includes(search) ?? false) ||
        g.invitationCode.toLowerCase().includes(search.toLowerCase())
    );
  }

  const total = guestList.length;
  const paginated = guestList.slice(offset, offset + limit);

  // Get table info for guests
  const tableIds = [...new Set(paginated.map((g) => g.tableId).filter(Boolean))];
  let tableMap: Record<string, { tableNumber: number; name: string | null }> = {};
  if (tableIds.length > 0) {
    const tables = await db
      .select({ id: eventTables.id, tableNumber: eventTables.tableNumber, name: eventTables.name })
      .from(eventTables)
      .where(sql`${eventTables.id} = ANY(ARRAY[${sql.raw(tableIds.map((id) => `'${id}'`).join(","))}]::uuid[])`);
    tables.forEach((t) => { tableMap[t.id] = { tableNumber: t.tableNumber, name: t.name }; });
  }

  const result = paginated.map((g) => ({
    ...g,
    table: g.tableId ? tableMap[g.tableId] : null,
  }));

  return NextResponse.json({ guests: result, total, page, limit });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  if (user.role === "protocol") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const { id: eventId } = await params;
  const body = await request.json();

  const { firstName, lastName, email, phone, photo, category, allowedPersons, tableId, notes } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Nom et prénom requis" }, { status: 400 });
  }

  let invitationCode = generateInvitationCode();
  // Ensure unique
  let attempts = 0;
  while (attempts < 10) {
    const [existing] = await db
      .select({ id: guests.id })
      .from(guests)
      .where(eq(guests.invitationCode, invitationCode))
      .limit(1);
    if (!existing) break;
    invitationCode = generateInvitationCode();
    attempts++;
  }

  const [guest] = await db
    .insert(guests)
    .values({
      eventId,
      firstName,
      lastName,
      email: email || null,
      phone: phone || null,
      photo: photo || null,
      category: category || "other",
      allowedPersons: allowedPersons ? Number(allowedPersons) : 1,
      tableId: tableId || null,
      notes: notes || null,
      invitationCode,
    })
    .returning();

  // Create QR Code record
  const token = uuidv4();
  await db.insert(qrCodes).values({
    guestId: guest.id,
    token,
    qrData: JSON.stringify({ token, guestId: guest.id, eventId }),
  });

  return NextResponse.json({ guest }, { status: 201 });
}
