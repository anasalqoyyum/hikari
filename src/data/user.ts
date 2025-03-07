import { UserPayload, UserVisibility } from '@/types/user'
import { hasPermission } from '@/helpers/permissions'
import { UserPermissions } from '@/types/permissions'
import { Kysely, Transaction, sql } from 'kysely'
import { GeneratedDB, db } from '@/db'
import { jsonObjectArray } from '@/types/json-object-array'
import { parseJsonResult } from '@/helpers/parse-json-result'
import { getUser } from '@/actions/auth'
import { CHUNI_NAMEPLATE_PROFILE_KEYS } from '@/components/chuni/nameplate'

type WithUsersVisibleToOptions = {
  // ignore targets's visibility settings and always show if they share a team with the user
  allTeam?: boolean
  // ignore targets's visibility settings and always show if they share an arcade with the user
  allArcade?: boolean
  // ignore targets's visibility settings and always show if they are a friend with the user
  allFriends?: boolean
}

export const withUsersVisibleTo = (
  viewingUser: UserPayload | null | undefined,
  opts?: WithUsersVisibleToOptions,
) => {
  // usermod can always view other users
  if (hasPermission(viewingUser?.permissions, UserPermissions.USERMOD))
    return db.with('visible', (db) =>
      db.selectFrom('aime_user as u').select('u.id'),
    )

  return db.with('visible', (db) =>
    db
      .selectFrom('aime_user as u')
      .innerJoin('hikari_user_ext as ext', 'u.id', 'ext.userId')
      .where(({ eb, and, or, exists, selectFrom }) =>
        or([
          // public visibility
          eb('ext.visibility', '>=', UserVisibility.EVERYONE),

          // requesting user
          eb('u.id', '=', viewingUser?.id!),

          ...(viewingUser
            ? [
                // visible to logged in users
                sql<boolean>`(ext.visibility & ${sql.lit(
                  UserVisibility.LOGGED_IN,
                )})`,

                // visible to other arcade members
                and([
                  ...(opts?.allArcade
                    ? []
                    : [
                        sql<boolean>`(ext.visibility & ${sql.lit(
                          UserVisibility.ARCADE,
                        )})`,
                      ]),
                  exists(
                    selectFrom('arcade_owner as a1')
                      .innerJoin('arcade_owner as a2', 'a1.arcade', 'a2.arcade')
                      .where('a1.user', '=', viewingUser.id!)
                      .whereRef('a2.user', '=', 'u.id')
                      .select('a1.user'),
                  ),
                ]),

                // visible to friends
                and([
                  ...(opts?.allFriends
                    ? []
                    : [
                        sql<boolean>`(ext.visibility & ${sql.lit(
                          UserVisibility.FRIENDS,
                        )})`,
                      ]),
                  exists(
                    selectFrom('hikari_user_friends as f')
                      .where('f.user1', '=', viewingUser.id!)
                      .whereRef('f.user2', '=', 'u.id')
                      .select('f.user1'),
                  ),
                ]),

                // visible to teammates
                and([
                  ...(opts?.allTeam
                    ? []
                    : [
                        sql<boolean>`(ext.visibility & ${sql.lit(
                          UserVisibility.TEAMMATES,
                        )})`,
                      ]),
                  exists(
                    selectFrom('hikari_user_ext as ue1')
                      .innerJoin(
                        'hikari_user_ext as ue2',
                        'ue1.team',
                        'ue2.team',
                      )
                      .where('ue1.userId', '=', viewingUser.id!)
                      .whereRef('ue2.userId', '=', 'u.id')
                      .select('ue1.userId'),
                  ),
                ]),
              ]
            : []),
        ]),
      )
      .select('u.id'),
  )
}

export const userIsVisible = (userKey: string) => {
  return sql<boolean>`(EXISTS (SELECT id FROM visible WHERE id = ${sql.raw(
    userKey,
  )}))`
}

export const getUsers = async () => {
  const res = await db
    .selectFrom('aime_user as u')
    .leftJoin('hikari_user_ext as ext', 'u.id', 'ext.userId')
    .leftJoin('aime_card as c', 'c.user', 'u.id')
    .groupBy('u.id')
    .select(
      (eb) =>
        [
          'u.id',
          'u.username',
          'u.email',
          'u.permissions',
          'u.created_date',
          'u.last_login_date',
          'ext.uuid',
          'ext.visibility',
          'ext.team',
          jsonObjectArray(eb, [
            'c.id',
            'c.access_code',
            'c.created_date',
            'c.last_login_date',
            'c.is_locked',
            'c.is_banned',
            'c.user',
          ]).as('cards'),
        ] as const,
    )
    .execute()

  const data = parseJsonResult(res, ['cards'])
  return data.map((d) => ({
    ...d,
    cards: d.cards.filter((c) => c.id !== null),
  }))
}

export type AdminUser = Awaited<ReturnType<typeof getUsers>>[number]

export const createHikariUsersFromExistingUsers = async (
  builder: Transaction<GeneratedDB> | Kysely<GeneratedDB>,
) => {
  await builder
    .insertInto('hikari_user_ext')
    .columns(['uuid', 'visibility', 'userId'])
    .expression((eb) =>
      eb
        .selectFrom('aime_user')
        .where(({ not, exists, selectFrom }) =>
          not(
            exists(
              selectFrom('hikari_user_ext')
                .whereRef('hikari_user_ext.userId', '=', 'aime_user.id')
                .select('aime_user.id'),
            ),
          ),
        )
        .select(({ fn, lit }) => [
          fn<string>('uuid_v4').as('uuid'),
          lit(0).as('visibility'),
          'aime_user.id as userId',
        ]),
    )
    .execute()
}
