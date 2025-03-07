'use server'

import { sql } from 'kysely'

import { db, GeneratedDB } from '@/db'
import { sqlChuniRating } from '@/helpers/chuni/rating'
import { CHUNI_MUSIC_PROPERTIES } from '@/helpers/chuni/music'
import { UserPayload } from '@/types/user'
import { ItemKind } from '@/helpers/chuni/items'
import { AvatarCategory } from '@/helpers/chuni/avatar'
import { UserboxItems } from '@/actions/chuni/userbox'
import { getUser, requireUser } from '@/actions/auth'
import { Entries } from 'type-fest'
import { CHUNI_NAMEPLATE_PROFILE_KEYS } from '@/components/chuni/nameplate'
import { getGlobalConfig } from '@/config'
import { revalidatePath } from 'next/cache'

type RecentRating = {
  scoreMax: string
  musicId: string
  level: string
  romVersionCode: string
}

const avatarNames = [
  'avatarBack',
  'avatarFace',
  'avatarItem',
  'avatarWear',
  'avatarFront',
  'avatarSkin',
  'avatarHead',
] as const

export async function getUserData(user: { id: number }) {
  const res = await db
    .selectFrom('chuni_profile_data as p')
    .leftJoin(
      'hikari_chuni_static_name_plate as nameplate',
      'p.nameplateId',
      'nameplate.id',
    )
    .leftJoin(
      'hikari_chuni_static_trophies as trophy',
      'p.trophyId',
      'trophy.id',
    )
    .leftJoin(
      'hikari_chuni_static_map_icon as mapicon',
      'p.mapIconId',
      'mapicon.id',
    )
    .leftJoin(
      'hikari_chuni_static_system_voice as voice',
      'p.voiceId',
      'voice.id',
    )
    .leftJoin(
      'chuni_static_avatar as avatarBack',
      'p.avatarBack',
      'avatarBack.avatarAccessoryId',
    )
    .leftJoin(
      'chuni_static_avatar as avatarFace',
      'p.avatarFace',
      'avatarFace.avatarAccessoryId',
    )
    .leftJoin(
      'chuni_static_avatar as avatarItem',
      'p.avatarItem',
      'avatarItem.avatarAccessoryId',
    )
    .leftJoin(
      'chuni_static_avatar as avatarWear',
      'p.avatarWear',
      'avatarWear.avatarAccessoryId',
    )
    .leftJoin(
      'chuni_static_avatar as avatarFront',
      'p.avatarFront',
      'avatarFront.avatarAccessoryId',
    )
    .leftJoin(
      'chuni_static_avatar as avatarSkin',
      'p.avatarSkin',
      'avatarSkin.avatarAccessoryId',
    )
    .leftJoin(
      'chuni_static_avatar as avatarHead',
      'p.avatarHead',
      'avatarHead.avatarAccessoryId',
    )
    .leftJoin('chuni_profile_team as team', 'p.teamId', 'team.id')
    .select([
      'p.exp',
      'p.level',
      'p.point',
      'p.trophyId',
      'p.userName',
      'p.playCount',
      'p.totalPoint',
      'p.characterId',
      'p.friendCount',
      'p.lastPlaceId',
      'p.nameplateId',
      'p.totalMapNum',
      'p.lastClientId',
      'p.lastPlayDate',
      'p.playerRating',
      'p.totalHiScore',
      'p.firstPlayDate',
      'p.highestRating',
      'p.multiWinCount',
      'p.lastRomVersion',
      'p.multiPlayCount',
      'p.lastDataVersion',
      'p.reincarnationNum',
      'p.totalBasicHighScore',
      'p.totalExpertHighScore',
      'p.totalMasterHighScore',
      'p.totalRepertoireCount',
      'p.totalAdvancedHighScore',
      'p.mapIconId',
      'p.medal',
      'p.voiceId',
      'p.teamId',
      'p.eliteRankPoint',
      'p.stockedGridCount',
      'p.overPowerRate',
      'p.battleRewardStatus',
      'p.charaIllustId',
      'p.classEmblemMedal',
      'p.overPowerPoint',
      'p.totalUltimaHighScore',
      'p.skillId',
      'p.avatarBack',
      'p.avatarFace',
      'p.avatarItem',
      'p.avatarWear',
      'p.avatarFront',
      'p.avatarSkin',
      'p.avatarHead',

      'nameplate.name as nameplateName',
      'nameplate.imagePath as nameplateImage',
      'trophy.name as trophyName',
      'trophy.rareType as trophyRareType',
      'mapicon.name as mapIconName',
      'mapicon.imagePath as mapIconImage',
      'voice.name as voiceName',
      'voice.imagePath as voiceImage',
      'voice.cuePath as voiceCue',
      'team.teamName',
      'team.teamPoint',

      ...avatarNames.flatMap(
        (name) =>
          [
            `${name}.name as ${name}Name`,
            `${name}.iconPath as ${name}Icon`,
            `${name}.texturePath as ${name}Texture`,
          ] as const,
      ),
    ])
    .where(({ and, eb, selectFrom, or }) =>
      and([
        eb('p.user', '=', user.id),
        eb(
          'p.version',
          '=',
          selectFrom('chuni_static_music').select(({ fn }) =>
            fn.max('version').as('latest'),
          ),
        ),
        ...avatarNames.map((name) =>
          or([
            eb(
              `${name}.version`,
              '=',
              selectFrom('chuni_static_avatar').select(({ fn }) =>
                fn.max('version').as('latest'),
              ),
            ),
            eb(`${name}.version`, 'is', null),
          ]),
        ),
      ]),
    )
    .executeTakeFirst()

  const requestingUser = await getUser()
  if (requestingUser?.id !== user.id && res)
    (Object.entries(res) as Entries<typeof res>).forEach(([key, val]) => {
      if (
        !CHUNI_NAMEPLATE_PROFILE_KEYS.includes(key as any) &&
        !avatarNames.find((n) => key.startsWith(n))
      )
        res[key] = null
    })

  return res
}

export type ChuniUserData = Awaited<ReturnType<typeof getUserData>>

export async function getUserRating(user: UserPayload) {
  const recent = await db
    .selectFrom('chuni_profile_recent_rating as recent')
    .where('user', '=', user.id)
    .innerJoin(
      sql<RecentRating>`JSON_TABLE(recent.recentRating, '$[*]' COLUMNS (
                    scoreMax VARCHAR(7) PATH '$.score',
                    musicId VARCHAR(4) PATH '$.musicId',
                    level VARCHAR(1) PATH '$.difficultId',
                    romVersionCode VARCHAR(32) PATH '$.romVersionCode'
                ))`.as('score'),
      (join) => join.onTrue(),
    )
    .innerJoin('chuni_static_music as music', (join) =>
      join
        .onRef('score.musicId', '=', 'music.songId')
        .onRef('score.level', '=', 'music.chartId'),
    )
    .innerJoin('hikari_chuni_static_music_ext as musicExt', (join) =>
      join
        .onRef('music.songId', '=', 'musicExt.songId')
        .onRef('music.chartId', '=', 'musicExt.chartId'),
    )
    .select(({ lit }) => [
      ...CHUNI_MUSIC_PROPERTIES,
      sqlChuniRating(),
      sql<number>`(score.scoreMax + 0)`.as('scoreMax'),
      lit<number>(1).as('pastIndex'),
    ])
    .where(({ selectFrom, eb }) =>
      eb(
        'music.version',
        '=',
        selectFrom('chuni_static_music').select(({ fn }) =>
          fn.max('version').as('latest'),
        ),
      ),
    )
    .execute()

  const top = await db
    .selectFrom('chuni_score_best as score')
    .innerJoin('chuni_static_music as music', (join) =>
      join
        .onRef('music.songId', '=', 'score.musicId')
        .onRef('music.chartId', '=', 'score.level'),
    )
    .innerJoin('hikari_chuni_static_music_ext as musicExt', (join) =>
      join
        .onRef('music.songId', '=', 'musicExt.songId')
        .onRef('music.chartId', '=', 'musicExt.chartId'),
    )
    .where(({ eb, and, selectFrom }) =>
      and([
        eb('user', '=', user.id),
        eb('score.level', '!=', 5),
        eb(
          'music.version',
          '=',
          selectFrom('chuni_static_music').select(({ fn }) =>
            fn.max('version').as('latest'),
          ),
        ),
      ]),
    )
    .select([...CHUNI_MUSIC_PROPERTIES, 'score.scoreMax', sqlChuniRating()])
    .orderBy('rating desc')
    .limit(30)
    .execute()

  recent.forEach((r, i) => (r.pastIndex = i))
  recent.sort((a, b) => +b.rating - +a.rating)

  return { recent, top }
}

export type ChuniUserRating = Awaited<ReturnType<typeof getUserRating>>

const validators = new Map<
  keyof GeneratedDB['chuni_profile_data'],
  (
    user: UserPayload,
    profile: NonNullable<ChuniUserData>,
    value: any,
  ) => Promise<any>
>()

const itemValidators = [
  [
    'mapIconId',
    'hikari_chuni_static_map_icon as map_icon',
    'map_icon.id',
    ItemKind.MAP_ICON,
  ],
  [
    'nameplateId',
    'hikari_chuni_static_name_plate as name_plate',
    'name_plate.id',
    ItemKind.NAME_PLATE,
  ],
  [
    'voiceId',
    'hikari_chuni_static_system_voice as system_voice',
    'system_voice.id',
    ItemKind.SYSTEM_VOICE,
  ],
  [
    'trophyId',
    'hikari_chuni_static_trophies as trophy',
    'trophy.id',
    ItemKind.TROPHY,
  ],
] as const

const canEquipUnearned = (user: UserPayload) =>
  getGlobalConfig('chuni_allow_equip_unearned') & user.permissions!

itemValidators.forEach(([key, table, joinKey, itemKind]) => {
  validators.set(key, async (user, profile, value) => {
    value = parseInt(value)
    if (Number.isNaN(value)) throw new Error(`Invalid value for key "${key}".`)

    const res = await db
      .selectFrom(table)
      .leftJoin('chuni_item_item as item', (join) =>
        join
          .onRef('item.itemId', '=', joinKey as any)
          .on('item.user', '=', user.id)
          .on('item.itemKind', '=', itemKind),
      )
      .where(joinKey as any, '=', value)
      .select('item.itemId')
      .executeTakeFirst()

    if (!res) throw new Error(`Item with id ${value} does not exist.`)

    if (
      res.itemId === null &&
      value !== profile[key] &&
      !canEquipUnearned(user)
    )
      throw new Error(`You do not own that item.`)

    return value
  })
})

Object.entries(AvatarCategory).forEach(([category, number]) => {
  const key = `avatar${category[0]}${category.slice(1).toLowerCase()}`
  validators.set(key as any, async (user, profile, value) => {
    value = parseInt(value)
    if (Number.isNaN(value)) throw new Error(`Invalid value for key "${key}".`)

    const res = await db
      .selectFrom('chuni_static_avatar as avatar')
      .leftJoin('chuni_item_item as item', (join) =>
        join
          .onRef('item.itemId', '=', 'avatar.avatarAccessoryId')
          .on('item.user', '=', user.id)
          .on('item.itemKind', '=', ItemKind.AVATAR_ACCESSORY),
      )
      .where(({ eb, and, selectFrom }) =>
        and([
          eb(
            'avatar.version',
            '=',
            selectFrom('chuni_static_avatar').select(({ fn }) =>
              fn.max('version').as('latest'),
            ),
          ),
          eb('avatar.category', '=', number),
          eb('avatar.avatarAccessoryId', '=', value),
        ]),
      )
      .select('item.itemId')
      .executeTakeFirst()

    if (!res) throw new Error(`Item with id ${value} does not exist.`)

    if (
      res.itemId === null &&
      value !== profile[key as keyof ChuniUserData] &&
      !canEquipUnearned(user)
    )
      throw new Error(`You do not own that item.`)

    return value
  })
})

validators.set('userName', (u, p, val) => {
  if (!val) throw new Error('Username is required.')
  if ([...val].length > 25) throw new Error('Username is too long.')

  return val
})

export type ProfileUpdate = Partial<
  { [K in keyof UserboxItems]: number } & { userName: string }
>

export const updateProfile = async (data: ProfileUpdate) => {
  const user = await requireUser()
  const profile = await getUserData(user)

  if (!profile)
    return { error: true, message: 'You do not have a Chunithm profile.' }

  const update: ProfileUpdate = {}

  for (const [key, value] of Object.entries(data)) {
    if (!validators.has(key as any))
      return { error: true, message: `Unknown key "${key}"` }

    try {
      update[key as keyof ProfileUpdate] = ((await validators.get(key as any)!(
        user,
        profile,
        value,
      )) ?? value) as any
    } catch (e: any) {
      return { error: true, message: e?.message ?? 'Unknown error occurred.' }
    }
  }

  await db
    .updateTable('chuni_profile_data')
    .where(({ and, eb, selectFrom }) =>
      and([
        eb('user', '=', user.id),
        eb(
          'version',
          '=',
          selectFrom(
            db
              .selectFrom('chuni_profile_data')
              .select(({ fn }) => fn.max('version').as('latest'))
              .as('l'),
          ).select('latest'),
        ),
      ]),
    )
    .set(update)
    .execute()

  revalidatePath('/chuni/dashboard', 'page')
  revalidatePath('/chuni/userbox', 'page')
  revalidatePath('/', 'page')
  revalidatePath(`/user/${user.uuid}`, 'page')

  return { error: false }
}
