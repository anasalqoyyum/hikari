import { getImageUrl } from '@/helpers/assets'
import Image from 'next/image'

export type ChuniAvatarProps = {
  wear: string | null | undefined
  head: string | null | undefined
  face: string | null | undefined
  skin: string | null | undefined
  item: string | null | undefined
  back: string | null | undefined
  className?: string
}

export const ChuniAvatar = ({
  wear,
  head,
  face,
  skin,
  item,
  back,
  className,
}: ChuniAvatarProps) => {
  return (
    <div
      className={`aspect-[544/588] relative overflow-hidden ${className ?? ''}`}
    >
      <Image
        width={544}
        height={588}
        priority
        src={getImageUrl(`chuni/avatar/${back}`)}
        className="w-full h-full absolute inset-0"
        alt=""
      />
      {head?.includes('CHU_UI_Avatar_Tex_01200001') && (
        <div className="absolute aspect-[100/160] w-[16%] left-[40%] top-[3%] overflow-hidden">
          <Image
            width={512}
            height={512}
            priority
            className="w-[522.44897%] max-w-none aspect-square absolute left-0 -top-[100%]"
            src={getImageUrl(`chuni/avatar/CHU_UI_Common_Avatar_body_00`)}
            alt=""
          />
        </div>
      )}
      <div className="aspect-[256/104] overflow-hidden w-[44%] absolute left-[35.5%] top-[81%]">
        <Image
          width={256}
          height={512}
          priority
          src={getImageUrl(`chuni/avatar/${skin}`)}
          className="w-full absolute bottom-0"
          alt=""
        />
      </div>
      <div className="aspect-[256/406] overflow-hidden w-[44%] absolute left-[28.5%] top-[22%]">
        <Image
          width={256}
          height={512}
          priority
          src={getImageUrl(`chuni/avatar/${skin}`)}
          className="w-full"
          alt=""
        />
      </div>
      <div className="absolute aspect-[98/130] w-[16%] left-[42.25%] top-[25%] overflow-hidden">
        <Image
          width={512}
          height={512}
          priority
          className="w-[522.44897%] max-w-none aspect-square absolute -left-[190%] -top-[75%]"
          src={getImageUrl(`chuni/avatar/CHU_UI_Common_Avatar_body_00`)}
          alt=""
        />
      </div>
      <div className="absolute aspect-[235/136] w-[35%] left-[33.75%] top-[26%] overflow-hidden">
        <Image
          width={1024}
          height={1024}
          priority
          className="w-[435.74468%] max-w-none aspect-square absolute"
          src={getImageUrl(`chuni/avatar/CHU_UI_Common_Avatar_face_00`)}
          alt=""
        />
      </div>
      <div className="absolute aspect-[79/153] w-[13%] left-[22%] top-[48%] overflow-hidden origin-top-right rotate-[10deg]">
        <Image
          width={512}
          height={512}
          priority
          className="w-[648.10126%] max-w-none aspect-square absolute"
          src={getImageUrl(`chuni/avatar/CHU_UI_Common_Avatar_body_00`)}
          alt=""
        />
      </div>
      <div className="absolute aspect-[79/153] w-[13%] left-[52.5%] top-[48%] overflow-hidden origin-top-right -rotate-[10deg] -scale-x-100">
        <Image
          width={512}
          height={512}
          priority
          className="w-[648.10126%] max-w-none aspect-square absolute"
          src={getImageUrl(`chuni/avatar/CHU_UI_Common_Avatar_body_00`)}
          alt=""
        />
      </div>
      <Image
        width={233}
        height={208}
        priority
        className="absolute aspect-[232/208] w-[38%] left-[31%] top-[24%]"
        src={getImageUrl(`chuni/avatar/${face}`)}
        alt=""
      />
      <Image
        width={516}
        height={436}
        priority
        className="absolute aspect-[516/436] w-[87%] left-[6.75%] top-[27%]"
        src={getImageUrl(`chuni/avatar/${wear}`)}
        alt=""
      />
      <Image
        width={256}
        height={192}
        priority
        className="absolute aspect-[4/3] w-[72.25%] left-[14.65%] top-[1%]"
        src={getImageUrl(`chuni/avatar/${head}`)}
        alt=""
      />
      <div className="absolute aspect-[200/544] w-[30%] top-[14%] left-[8%] overflow-hidden origin-[42.5%_67%]">
        <Image
          width={400}
          height={544}
          priority
          className="absolute aspect-[400/544] w-[200%] left-0 top-0 max-w-none"
          src={getImageUrl(`chuni/avatar/${item}`)}
          alt=""
        />
      </div>
      <div className="absolute aspect-[200/544] w-[30%] top-[14%] left-[62%] overflow-hidden origin-[57.5%_67%]">
        <Image
          width={400}
          height={544}
          priority
          className="absolute aspect-[400/544] w-[200%] right-0 top-0 max-w-none"
          src={getImageUrl(`chuni/avatar/${item}`)}
          alt=""
        />
      </div>
    </div>
  )
}
