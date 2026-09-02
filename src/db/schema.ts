import {
  pgTable,
  text,
  varchar,
  timestamp,
  boolean,
  integer,
  pgEnum,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "organizer",
  "protocol",
]);
export const eventTypeEnum = pgEnum("event_type", [
  "wedding",
  "birthday",
  "conference",
  "ceremony",
  "graduation",
  "meeting",
  "other",
]);
export const guestCategoryEnum = pgEnum("guest_category", [
  "family",
  "friends",
  "colleagues",
  "vip",
  "official",
  "other",
]);
export const rsvpStatusEnum = pgEnum("rsvp_status", [
  "pending",
  "confirmed",
  "declined",
  "maybe",
]);
export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "published",
  "active",
  "completed",
  "cancelled",
]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "sent",
  "opened",
  "not_sent",
]);

// Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  logo: text("logo"),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull().default("organizer"),
  avatar: text("avatar"),
  phone: varchar("phone", { length: 50 }),
  isActive: boolean("is_active").notNull().default(true),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Events
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  createdById: uuid("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: varchar("name", { length: 255 }).notNull(),
  type: eventTypeEnum("type").notNull().default("other"),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  location: varchar("location", { length: 255 }),
  address: text("address"),
  coverImage: text("cover_image"),
  maxGuests: integer("max_guests").default(0),
  status: eventStatusEnum("status").notNull().default("draft"),
  invitationTemplate: integer("invitation_template").default(1),
  customMessage: text("custom_message"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tables (seating)
export const eventTables = pgTable("event_tables", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  tableNumber: integer("table_number").notNull(),
  name: varchar("name", { length: 100 }),
  capacity: integer("capacity").default(8),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Guests
export const guests = pgTable("guests", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  tableId: uuid("table_id").references(() => eventTables.id, {
    onDelete: "set null",
  }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  photo: text("photo"),
  category: guestCategoryEnum("category").notNull().default("other"),
  allowedPersons: integer("allowed_persons").default(1),
  rsvpStatus: rsvpStatusEnum("rsvp_status").notNull().default("pending"),
  isPresent: boolean("is_present").notNull().default(false),
  checkedInAt: timestamp("checked_in_at"),
  invitationCode: varchar("invitation_code", { length: 50 })
    .notNull()
    .unique(),
  invitationStatus: invitationStatusEnum("invitation_status")
    .notNull()
    .default("not_sent"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// QR Codes
export const qrCodes = pgTable("qr_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id")
    .references(() => guests.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  qrData: text("qr_data"),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Checkins
export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().defaultRandom(),
  guestId: uuid("guest_id")
    .references(() => guests.id, { onDelete: "cascade" })
    .notNull(),
  eventId: uuid("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  checkedInById: uuid("checked_in_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
  notes: text("notes"),
});

// Notification Templates
export const notificationTemplates = pgTable("notification_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id").references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  channel: varchar("channel", { length: 50 }).default("email"),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Notifications
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).default("info"),
  isRead: boolean("is_read").notNull().default(false),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  events: many(events),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  createdEvents: many(events),
  checkins: many(checkins),
  notifications: many(notifications),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [events.organizationId],
    references: [organizations.id],
  }),
  createdBy: one(users, {
    fields: [events.createdById],
    references: [users.id],
  }),
  guests: many(guests),
  tables: many(eventTables),
  checkins: many(checkins),
  notificationTemplates: many(notificationTemplates),
}));

export const eventTablesRelations = relations(eventTables, ({ one, many }) => ({
  event: one(events, {
    fields: [eventTables.eventId],
    references: [events.id],
  }),
  guests: many(guests),
}));

export const guestsRelations = relations(guests, ({ one }) => ({
  event: one(events, {
    fields: [guests.eventId],
    references: [events.id],
  }),
  table: one(eventTables, {
    fields: [guests.tableId],
    references: [eventTables.id],
  }),
  qrCode: one(qrCodes, {
    fields: [guests.id],
    references: [qrCodes.guestId],
  }),
}));

export const qrCodesRelations = relations(qrCodes, ({ one }) => ({
  guest: one(guests, {
    fields: [qrCodes.guestId],
    references: [guests.id],
  }),
}));

export const checkinsRelations = relations(checkins, ({ one }) => ({
  guest: one(guests, {
    fields: [checkins.guestId],
    references: [guests.id],
  }),
  event: one(events, {
    fields: [checkins.eventId],
    references: [events.id],
  }),
  checkedInBy: one(users, {
    fields: [checkins.checkedInById],
    references: [users.id],
  }),
}));

export const notificationTemplatesRelations = relations(
  notificationTemplates,
  ({ one }) => ({
    event: one(events, {
      fields: [notificationTemplates.eventId],
      references: [events.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));