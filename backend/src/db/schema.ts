import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

// ドリズルのスキーマ定義

// ユーザーテーブルの定義
export const usersTable = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  // 名前
  name: varchar({ length: 255 }).notNull(),
  // メールアドレス
  email: varchar({ length: 255 }).notNull().unique(),
  // 作成日時
  createdAt: timestamp('created_at').defaultNow().notNull(),
  // 更新日時
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
