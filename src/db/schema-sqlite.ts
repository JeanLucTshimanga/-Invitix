import {
  sqliteTable,
  text,
  integer,
  blob,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// Enums (SQLite doesn't have native enums, we use text columns)
export const userRoleEnum = ["super_admin", "organizer", "protocol"] as const;
export const eventTypeEnum = ["wedding", "birthday", "conference", "ceremony", "graduation", "meeting", "other"] as const;
export const guestCategoryEnum = ["family", "friends", "colleagues", "vip", "official", "other"] as const;
export const rsvpStatusEnum = ["pending", "confirmed", "declined", "maybe"] as const;
export const eventStatusEnum = ["draft", "published", "active", "completed", "cancelled"] as const;
export const invitationStatusEnum = ["sent", "opened", "not_sent"] as const;

// Organizations
export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  logo: text("logo"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  website: text("website"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Users
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: userRoleEnum }).notNull().default("organizer"),
  avatar: text("avatar"),
  phone: text("phone"),
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  resetToken: text("reset_token"),
  resetTokenExpiry: integer("reset_token_expiry", { mode: 'timestamp' }),
  lastLoginAt: integer("last_login_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Events
export const events = sqliteTable("events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  organizationId: text("organization_id").references(() => organizations.id, {
    onDelete: "cascade",
  }),
  createdById: text("created_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  type: text("type", { enum: eventTypeEnum }).notNull().default("other"),
  description: text("description"),
  date: integer("date", { mode: 'timestamp' }).notNull(),
  endDate: integer("end_date", { mode: 'timestamp' }),
  location: text("location"),
  address: text("address"),
  coverImage: text("cover_image"),
  maxGuests: integer("max_guests").default(0),
  status: text("status", { enum: eventStatusEnum }).notNull().default("draft"),
  invitationTemplate: integer("invitation_template").default(1),
  customMessage: text("custom_message"),
  isPublic: integer("is_public", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Tables (seating)
export const eventTables = sqliteTable("event_tables", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  tableNumber: integer("table_number").notNull(),
  name: text("name"),
  capacity: integer("capacity").default(8),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Guests
export const guests = sqliteTable("guests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  tableId: text("table_id").references(() => eventTables.id, {
    onDelete: "set null",
  }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  photo: text("photo"),
  category: text("category", { enum: guestCategoryEnum }).notNull().default("other"),
  allowedPersons: integer("allowed_persons").default(1),
  rsvpStatus: text("rsvp_status", { enum: rsvpStatusEnum }).notNull().default("pending"),
  isPresent: integer("is_present", { mode: 'boolean' }).notNull().default(false),
  checkedInAt: integer("checked_in_at", { mode: 'timestamp' }),
  invitationCode: text("invitation_code")
    .notNull()
    .unique(),
  invitationStatus: text("invitation_status", { enum: invitationStatusEnum })
    .notNull()
    .default("not_sent"),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// QR Codes
export const qrCodes = sqliteTable("qr_codes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  guestId: text("guest_id")
    .references(() => guests.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  token: text("token").notNull().unique(),
  qrData: text("qr_data"),
  isUsed: integer("is_used", { mode: 'boolean' }).notNull().default(false),
  usedAt: integer("used_at", { mode: 'timestamp' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Checkins
export const checkins = sqliteTable("checkins", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  guestId: text("guest_id")
    .references(() => guests.id, { onDelete: "cascade" })
    .notNull(),
  eventId: text("event_id")
    .references(() => events.id, { onDelete: "cascade" })
    .notNull(),
  checkedInById: text("checked_in_by_id").references(() => users.id, {
    onDelete: "set null",
  }),
  checkedInAt: integer("checked_in_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  notes: text("notes"),
});

// Notification Templates
export const notificationTemplates = sqliteTable("notification_templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: text("event_id").references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  channel: text("channel").default("email"),
  subject: text("subject"),
  body: text("body").notNull(),
  isDefault: integer("is_default", { mode: 'boolean' }).default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// Notifications
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info"),
  isRead: integer("is_read", { mode: 'boolean' }).notNull().default(false),
  metadata: blob("metadata", { mode: 'json' }),
  createdAt: integer("created_at", { mode: 'timestamp' }).$defaultFn(() => new Date()),
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