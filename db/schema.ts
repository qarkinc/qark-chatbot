import { InferSelectModel } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  text,
  primaryKey,
  foreignKey,
  boolean,
  jsonb,
  integer,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const user = pgTable('User', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  email: varchar('email', { length: 64 }).notNull(),
  password: varchar('password', { length: 64 }),
  registererdOn: timestamp("registererdOn", { mode: "date" }).notNull().defaultNow(),
  isGmailConnected: boolean("isGmailConnected").default(false),
  gmailToken: json("gmailToken"),
  gmailConnectedOn: timestamp("gmailConnectedOn", { mode: "date" }),
  gmailTokenExpiry: timestamp("gmailTokenExpiry", { mode: "date" }),
});

export type User = InferSelectModel<typeof user>;

export const accounts = pgTable("Accounts", {
  user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  app_user_id: varchar("app_user_id").notNull(),
  provider: integer("provider").notNull().default(1),
  app_user_phone_number: varchar("app_user_phone_number"),
  account_linking_status: integer("account_linking_status"),
  created_on: timestamp("created_on", { mode: "date" }).notNull().defaultNow(),
}, (table) => {
  return {
    account_id: primaryKey({ 
      name: "account_id_pk",
      columns: [table.user_id, table.app_user_id, table.provider],
    }),
    user_id_index: index("user_id_idx").on(table.user_id, table.app_user_id, table.provider),
    user_phone_index: index("user_phone_index").on(table.user_id, table.app_user_phone_number, table.provider),
  }
});

export type Accounts = InferSelectModel<typeof accounts>;

export const tokens = pgTable("Tokens", {
  user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  app_user_id: varchar("app_user_id").notNull(),
  provider: integer("provider").notNull().default(1),
  token: jsonb("token"),
  keyname: varchar("keyname"),
  created_on: timestamp("created_on", { mode: "date" }),
}, (table) => {
  return {
    token_pk: primaryKey({
      name: "token_table_pk",
      columns: [table.user_id, table.app_user_id, table.provider, table.keyname]
    }),
    account_id: foreignKey({
      name: "account_id_fk",
      columns: [table.user_id, table.app_user_id, table.provider],
      foreignColumns: [accounts.user_id, accounts.app_user_id, accounts.provider],
    }).onDelete("cascade"),
    keyname_index: uniqueIndex("keyname_index").on(table.user_id, table.app_user_id, table.provider, table.keyname),
    // account_id_index: uniqueIndex("account_id_index").on(table.user_id, table.app_user_id, table.provider),
  }
});

export type Tokens = InferSelectModel<typeof tokens>;

export const contacts = pgTable("Contacts", {
  user_id: uuid("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  app_user_id: varchar("app_user_id").notNull(),
  provider: integer("provider").notNull().default(1),
  contact_jid: varchar("contact_jid"),
  contact_name: varchar("contact_name"),
  contact_phone_no: varchar("contact_phone_no"),
  other_contact_info: json("other_contact_info"),
  created_on: timestamp("created_on", { mode: "date" })
}, (table) => ({
  "user_contact_index": index("user_contact_index").on(table.user_id, table.app_user_id, table.provider),
  "unique_index": uniqueIndex("contact_index").on(table.user_id, table.app_user_id, table.provider, table.contact_jid)
}));

export type Contacts = InferSelectModel<typeof contacts>;

export const chat = pgTable('Chat', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  createdAt: timestamp('createdAt').notNull(),
  title: text('title').notNull(),
  userId: uuid('userId')
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export type Chat = InferSelectModel<typeof chat>;

export const message = pgTable('Message', {
  id: uuid('id').primaryKey().notNull().defaultRandom(),
  chatId: uuid('chatId')
    .notNull()
    .references(() => chat.id, { onDelete: "cascade" }),
  role: varchar('role').notNull(),
  content: json('content').notNull(),
  createdAt: timestamp('createdAt').notNull(),
});

export type Message = InferSelectModel<typeof message>;

export const citation = pgTable("Citation", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: uuid().notNull(),
	appMessageId: varchar().notNull(),
	subject: varchar().notNull(),
  appThreadId: varchar(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		citationMessageIdMessageIdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Citation_messageId_Message_id_fk"
		}).onDelete("cascade"),
	}
});

export type Citation = InferSelectModel<typeof citation>;

export const vote = pgTable(
  'Vote',
  {
    chatId: uuid('chatId')
      .notNull()
      .references(() => chat.id, { onDelete: "cascade" }),
    messageId: uuid('messageId')
      .notNull()
      .references(() => message.id, { onDelete: "cascade" }),
    isUpvoted: boolean('isUpvoted').notNull(),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.chatId, table.messageId] }),
    };
  }
);

export type Vote = InferSelectModel<typeof vote>;

export const document = pgTable(
  'Document',
  {
    id: uuid('id').notNull().defaultRandom(),
    createdAt: timestamp('createdAt').notNull(),
    title: text('title').notNull(),
    content: text('content'),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => {
    return {
      pk: primaryKey({ columns: [table.id, table.createdAt] }),
    };
  }
);

export type Document = InferSelectModel<typeof document>;

export const suggestion = pgTable(
  'Suggestion',
  {
    id: uuid('id').notNull().defaultRandom(),
    documentId: uuid('documentId').notNull(),
    documentCreatedAt: timestamp('documentCreatedAt').notNull(),
    originalText: text('originalText').notNull(),
    suggestedText: text('suggestedText').notNull(),
    description: text('description'),
    isResolved: boolean('isResolved').notNull().default(false),
    userId: uuid('userId')
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp('createdAt').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.id] }),
    documentRef: foreignKey({
      columns: [table.documentId, table.documentCreatedAt],
      foreignColumns: [document.id, document.createdAt],
    }).onDelete("cascade"),
  })
);

export type Suggestion = InferSelectModel<typeof suggestion>;
