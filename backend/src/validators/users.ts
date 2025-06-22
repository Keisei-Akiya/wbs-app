import { z } from 'zod';

export const insertUsersSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(255, '名前は255文字以内で入力してください'),
  email: z
    .string()
    .email('メールアドレスの形式が正しくありません')
    .min(1, 'メールアドレスは必須です')
    .max(255, 'メールアドレスは255文字以内で入力してください'),
});

export const updateUsersSchema = z.object({
  name: z
    .string()
    .min(1, '名前は必須です')
    .max(255, '名前は255文字以内で入力してください')
    .optional(),
  email: z
    .string()
    .email('メールアドレスの形式が正しくありません')
    .min(1, 'メールアドレスは必須です')
    .max(255, 'メールアドレスは255文字以内で入力してください')
    .optional(),
  updatedAt: z
    .date()
    .default(() => new Date())
    .optional(),
});

export type InsertUsers = z.infer<typeof insertUsersSchema>;
export type UpdateUsers = z.infer<typeof updateUsersSchema>;
