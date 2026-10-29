import { media } from '../media'

type Props = { image: keyof typeof media; alt: string; className?: string; eager?: boolean }

export function Photo({ image, alt, className = '', eager = false }: Props) {
  const asset = media[image]
  return (
    <div className={`photo ${className}`}>
      {asset.src ? (
        <img src={asset.src} srcSet={asset.srcSet} sizes={eager ? '100vw' : '(max-width: 720px) 100vw, 50vw'} alt={alt} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined} />
      ) : (
        <div className="photo-pending" role="img" aria-label={alt}><span>{alt}</span></div>
      )}
      {asset.src && asset.credit && <small className="photo-credit">© {asset.credit}</small>}
    </div>
  )
}
