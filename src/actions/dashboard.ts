'use server'

import { db } from '@/db'
import { requireUser } from './auth'
import { revalidatePath } from 'next/cache'

export const setDashboard = async (dashboard: string) => {
  const user = await requireUser()

  await db
    .updateTable('hikari_user_ext')
    .where('userId', '=', user.id)
    .set({ dashboard })
    .executeTakeFirst()

  revalidatePath('/', 'page')
}
