import { DB } from '@/types/db'
import { floorToDp } from '@/helpers/floor-dp'
import { worldsEndStars } from '@/helpers/chuni/worlds-end-stars'

export type ChuniLevelBadgeProps = {
  music: Pick<DB['chuni_static_music'], 'level' | 'worldsEndTag'>
  className?: string
}

export const ChuniLevelBadge = ({ music, className }: ChuniLevelBadgeProps) => {
  return (
    <div className={`aspect-[14/11] ${className ?? ''}`}>
      <div className="@container-size w-full h-full leading-none ">
        <div className="px-[5cqw] py-[5cqh] w-full h-full bg-white flex flex-col items-center justify-center text-black">
          <div className="text-[24cqh] mb-[5cqh] text-center flex items-center justify-center">
            {music.worldsEndTag
              ? worldsEndStars(Math.ceil(music.level! / 2))
              : '\u200b'}
          </div>
          <div
            className="bg-black text-[45cqh] w-full flex-grow flex items-center justify-center text-white font-bold"
            lang="ja"
          >
            {music.worldsEndTag ??
              (music.level! <= 7 && Number.isInteger(music.level)
                ? music.level
                : floorToDp(music.level!, 1))}
          </div>
        </div>
      </div>
    </div>
  )
}
