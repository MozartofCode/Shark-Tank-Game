import { api } from '../api/client'
import type { PublicPitch } from '../types'

/** Plays a pitch clip from any supported source (YouTube embed, self-hosted file, URL). */
export function VideoPlayer({ pitch }: { pitch: PublicPitch }) {
  const v = pitch.video
  const frame = 'aspect-video w-full overflow-hidden rounded-2xl border border-line bg-black shadow-2xl'

  if (v.type === 'youtube') {
    const params = new URLSearchParams({ autoplay: '1', rel: '0', modestbranding: '1', start: String(v.start) })
    if (v.end) params.set('end', String(v.end))
    return (
      <div className={frame}>
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${v.id}?${params}`}
          title={`${pitch.company.name} pitch`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }
  const src = v.type === 'file' ? api.mediaUrl(pitch.id, v.path) : v.url
  return (
    <div className={frame}>
      <video className="h-full w-full" src={src} controls autoPlay playsInline />
    </div>
  )
}
