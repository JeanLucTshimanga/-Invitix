import { db } from "../db/index";
import { users, organizations, events, guests, qrCodes, eventTables } from "../db/schema-sqlite";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

async function generateCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function seed() {
  console.log("🌱 Seeding database...");

  // Create organization
  const [org] = await db
    .insert(organizations)
    .values({ name: "INVITIX Demo Organization", email: "contact@invitix.com" })
    .returning()
    .onConflictDoNothing();

  const orgId = org?.id;

  // Create users
  const adminHash = await bcrypt.hash("admin123", 12);
  const demoHash = await bcrypt.hash("demo123", 12);

  const [admin] = await db
    .insert(users)
    .values({
      firstName: "Super",
      lastName: "Admin",
      email: "admin@invitix.com",
      passwordHash: adminHash,
      role: "super_admin",
      organizationId: orgId,
    })
    .returning()
    .onConflictDoNothing();

  const [organizer] = await db
    .insert(users)
    .values({
      firstName: "Marie",
      lastName: "Organisatrice",
      email: "organizer@invitix.com",
      passwordHash: demoHash,
      role: "organizer",
      organizationId: orgId,
    })
    .returning()
    .onConflictDoNothing();

  const [protocol] = await db
    .insert(users)
    .values({
      firstName: "Pierre",
      lastName: "Protocole",
      email: "protocol@invitix.com",
      passwordHash: demoHash,
      role: "protocol",
      organizationId: orgId,
    })
    .returning()
    .onConflictDoNothing();

  const adminId = admin?.id || organizer?.id;
  if (!adminId) {
    console.log("✅ Demo accounts already exist, skipping events seed.");
    return;
  }

  // Create events
  const [wedding] = await db
    .insert(events)
    .values({
      name: "Mariage Sarah & David",
      type: "wedding",
      description: "Célébration du mariage de Sarah et David dans un cadre magnifique",
      date: new Date("2026-08-28T15:00:00"),
      endDate: new Date("2026-08-28T23:00:00"),
      location: "Chapiteau Baraka",
      address: "Avenue de la Paix, Kinshasa",
      maxGuests: 200,
      status: "active",
      customMessage: "Nous avons le plaisir de vous inviter à la célébration de notre union",
      invitationTemplate: 1,
      organizationId: orgId,
      createdById: adminId,
    })
    .returning();

  const [conference] = await db
    .insert(events)
    .values({
      name: "Conférence Technologie 2026",
      type: "conference",
      description: "Grande conférence internationale sur les nouvelles technologies",
      date: new Date("2026-09-15T09:00:00"),
      endDate: new Date("2026-09-15T18:00:00"),
      location: "Centre de Conférences International",
      address: "Boulevard du 30 Juin, Kinshasa",
      maxGuests: 500,
      status: "published",
      customMessage: "Rejoignez-nous pour deux jours d'innovation et de découvertes",
      invitationTemplate: 2,
      organizationId: orgId,
      createdById: adminId,
    })
    .returning();

  const [graduation] = await db
    .insert(events)
    .values({
      name: "Collation des Grades 2026",
      type: "graduation",
      description: "Cérémonie solennelle de remise des diplômes",
      date: new Date("2026-07-20T10:00:00"),
      location: "Grand Amphithéâtre Universitaire",
      maxGuests: 1000,
      status: "draft",
      customMessage: "En présence de vos familles, nous célébrons vos réussites",
      invitationTemplate: 3,
      organizationId: orgId,
      createdById: adminId,
    })
    .returning();

  // Create tables for wedding
  const tables = [];
  for (let i = 1; i <= 8; i++) {
    const [table] = await db
      .insert(eventTables)
      .values({
        eventId: wedding.id,
        tableNumber: i,
        name: i === 1 ? "Table d'honneur" : i === 2 ? "Famille proche" : null,
        capacity: i === 1 ? 10 : 8,
      })
      .returning();
    tables.push(table);
  }

  // Create guests for wedding
  const guestData = [
    { firstName: "Jean-Luc", lastName: "Tshimanga", email: "jl@demo.com", phone: "+243810001", category: "vip" as const, allowedPersons: 2, tableIdx: 0 },
    { firstName: "Marie", lastName: "Kabila", email: "mk@demo.com", phone: "+243810002", category: "family" as const, allowedPersons: 3, tableIdx: 1 },
    { firstName: "David", lastName: "Mutombo", email: "dm@demo.com", phone: "+243810003", category: "friends" as const, allowedPersons: 1, tableIdx: 2 },
    { firstName: "Sarah", lastName: "Lukusa", email: "sl@demo.com", phone: "+243810004", category: "official" as const, allowedPersons: 2, tableIdx: 0 },
    { firstName: "Paul", lastName: "Nkosi", email: "pn@demo.com", phone: "+243810005", category: "colleagues" as const, allowedPersons: 1, tableIdx: 3 },
    { firstName: "Amina", lastName: "Diallo", email: "ad@demo.com", phone: "+243810006", category: "friends" as const, allowedPersons: 2, tableIdx: 2 },
    { firstName: "Henri", lastName: "Mobutu", email: "hm@demo.com", phone: "+243810007", category: "vip" as const, allowedPersons: 2, tableIdx: 0 },
    { firstName: "Claire", lastName: "Bakamba", email: "cb@demo.com", phone: "+243810008", category: "family" as const, allowedPersons: 4, tableIdx: 1 },
    { firstName: "Thomas", lastName: "Keza", email: "tk@demo.com", phone: "+243810009", category: "colleagues" as const, allowedPersons: 1, tableIdx: 4 },
    { firstName: "Fatou", lastName: "Sow", email: "fs@demo.com", phone: "+243810010", category: "friends" as const, allowedPersons: 2, tableIdx: 5 },
  ];

  const rsvpStatuses: Array<"confirmed" | "pending" | "declined" | "maybe"> = [
    "confirmed", "confirmed", "pending", "confirmed", "declined",
    "confirmed", "confirmed", "maybe", "confirmed", "pending"
  ];
  const presentStatuses = [true, true, false, true, false, true, true, false, true, false];

  for (let i = 0; i < guestData.length; i++) {
    const g = guestData[i];
    const code = await generateCode();
    const [guest] = await db
      .insert(guests)
      .values({
        eventId: wedding.id,
        firstName: g.firstName,
        lastName: g.lastName,
        email: g.email,
        phone: g.phone,
        category: g.category,
        allowedPersons: g.allowedPersons,
        tableId: tables[g.tableIdx]?.id || null,
        invitationCode: code,
        rsvpStatus: rsvpStatuses[i],
        isPresent: presentStatuses[i],
        checkedInAt: presentStatuses[i] ? new Date() : null,
        invitationStatus: presentStatuses[i] ? "opened" : (i < 7 ? "sent" : "not_sent"),
      })
      .returning();

    const token = uuidv4();
    await db.insert(qrCodes).values({
      guestId: guest.id,
      token,
      qrData: JSON.stringify({ token, guestId: guest.id, eventId: wedding.id }),
      isUsed: presentStatuses[i],
      usedAt: presentStatuses[i] ? new Date() : null,
    });
  }

  // Add some guests to conference
  for (let i = 0; i < 5; i++) {
    const code = await generateCode();
    const [g] = await db.insert(guests).values({
      eventId: conference.id,
      firstName: `Conférencier${i + 1}`,
      lastName: "Test",
      email: `conf${i}@demo.com`,
      category: i === 0 ? "vip" : "colleagues",
      allowedPersons: 1,
      invitationCode: code,
      rsvpStatus: "confirmed",
      invitationStatus: "sent",
    }).returning();

    const token = uuidv4();
    await db.insert(qrCodes).values({
      guestId: g.id,
      token,
      qrData: JSON.stringify({ token, guestId: g.id, eventId: conference.id }),
    });
  }

  console.log("✅ Seed completed successfully!");
  console.log("📧 Demo accounts:");
  console.log("   admin@invitix.com / admin123 (Super Admin)");
  console.log("   organizer@invitix.com / demo123 (Organisateur)");
  console.log("   protocol@invitix.com / demo123 (Protocole)");
}

seed().catch(console.error).finally(() => process.exit(0));
