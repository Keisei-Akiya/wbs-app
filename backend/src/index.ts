import 'dotenv/config';
import { zValidator } from '@hono/zod-validator';
import { serve } from 'bun';
import { Hono } from 'hono';
import {
  InsertUsers,
  insertUsersSchema,
  UpdateUsers,
  updateUsersSchema,
} from './validators/users';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { usersTable } from './db/schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

const client = new Client({
  connectionString: process.env.DATABASE_URL!,
});

// データベース接続を初期化
await client.connect();
const db = drizzle(client);

const port = 3000;
console.log(`Server is running on http://localhost:${port}`);

// ユーザー一覧を取得するエンドポイント
app.get('/users', async (c) => {
  try {
    const users = await db.select().from(usersTable);
    return c.json(users, 200);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to fetch users' }, 500);
  }
});

serve({
  fetch: app.fetch,
  port,
});

// 新しいユーザーを作成するエンドポイント
app.post(
  '/users',
  zValidator('json', insertUsersSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        400
      );
    }
  }),
  async (c) => {
    const newUser: InsertUsers = c.req.valid('json');
    try {
      const result = await db.insert(usersTable).values(newUser).returning();
      return c.json(
        { message: 'User created successfully', user: result[0] },
        201
      );
    } catch (error) {
      console.error('Database error:', error);
      return c.json({ error: 'Failed to create user' }, 500);
    }
  }
);

// 特定のユーザーを更新するエンドポイント
app.patch(
  '/users/:id',
  zValidator('json', updateUsersSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: result.error.errors.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        400
      );
    }
  }),
  async (c) => {
    const id = c.req.param('id');
    const updateData: UpdateUsers = c.req.valid('json');

    try {
      // ユーザーが存在するかチェック
      const existingUser = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .limit(1);

      if (existingUser.length === 0) {
        return c.json({ error: 'User not found' }, 404);
      }

      // ユーザーを更新
      const result = await db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, id))
        .returning();

      return c.json(
        { message: 'User updated successfully', user: result[0] },
        200
      );
    } catch (error) {
      console.error('Database error:', error);
      return c.json({ error: 'Failed to update user' }, 500);
    }
  }
);

// 特定のユーザーを取得するエンドポイント
app.get('/users/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (user.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json(user[0], 200);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to fetch user' }, 500);
  }
});

// 特定のユーザーを削除するエンドポイント
app.delete('/users/:id', async (c) => {
  const id = c.req.param('id');

  try {
    // ユーザーが存在するかチェック
    const existingUser = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1);

    if (existingUser.length === 0) {
      return c.json({ error: 'User not found' }, 404);
    }

    // ユーザーを削除
    await db.delete(usersTable).where(eq(usersTable.id, id));

    return c.json({ message: 'User deleted successfully' }, 200);
  } catch (error) {
    console.error('Database error:', error);
    return c.json({ error: 'Failed to delete user' }, 500);
  }
});

export default app;
