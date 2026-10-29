import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import 'mapbox-gl/dist/mapbox-gl.css'

type Region = 'pantanal' | 'bodoquena'
type Position = [number, number]

const STYLE = 'mapbox://styles/iagoisi09/cmj4imuam00az01s2h11g3vyd'
const regions: Record<Region, { bounds: [Position, Position] }> = {
  pantanal: {
    bounds: [[-58.1687203, -20.9488495], [-55.0638512, -17.1663486]],
  },
  bodoquena: {
    bounds: [[-58.0083836, -22.1817031], [-55.4861152, -20.1792417]],
  },
}

export function DestinationMap({ region, title }: { region: Region; title: string }) {
  const { t } = useTranslation()
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLDivElement>(null)
  const [nearby, setNearby] = useState(false)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const element = frame.current
    if (!element) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNearby(true); observer.disconnect() }
    }, { rootMargin: '450px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!nearby || !canvas.current) return
    let disposed = false
    let map: import('mapbox-gl').Map | undefined
    let resizeObserver: ResizeObserver | undefined
    const start = async () => {
      try {
        const response = await fetch('/api/mapbox', { cache: 'no-store' })
        if (!response.ok) throw new Error('Mapbox token unavailable')
        const { token } = await response.json() as { token?: string }
        if (!token?.startsWith('pk.')) throw new Error('Invalid Mapbox token')
        const mapboxgl = (await import('mapbox-gl')).default
        if (disposed || !canvas.current) return
        if (!mapboxgl.supported()) { setFailed(true); return }
        const config = regions[region]
        map = new mapboxgl.Map({
          container: canvas.current,
          accessToken: token,
          style: STYLE,
          localFontFamily: 'Nunito Sans, sans-serif',
          bounds: config.bounds,
          fitBoundsOptions: { padding: 40 },
          attributionControl: true,
          cooperativeGestures: true,
          scrollZoom: false,
          dragRotate: false,
          pitchWithRotate: false,
          minZoom: 5,
          maxZoom: 14,
        })
        const instance = map
        instance.touchZoomRotate.disableRotation()
        instance.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right')
        instance.once('style.load', () => {
          if (disposed) return
          instance.setTerrain(null)
          instance.addSource('region', { type: 'geojson', data: `/geo/${region}.geojson` })
          const firstLabel = instance.getStyle().layers?.find(layer => layer.type === 'symbol')?.id
          instance.addLayer({ id: 'region-fill', type: 'fill', source: 'region', paint: { 'fill-color': '#b29460', 'fill-opacity': .09 } }, firstLabel)
          instance.addLayer({ id: 'region-border-halo', type: 'line', source: 'region', paint: { 'line-color': '#f4f0e7', 'line-width': 5, 'line-opacity': .82 } }, firstLabel)
          instance.addLayer({ id: 'region-border', type: 'line', source: 'region', paint: { 'line-color': '#285641', 'line-width': 2.8, 'line-dasharray': [2.2, 1.6] } }, firstLabel)
        })
        instance.once('idle', () => { if (!disposed) setReady(true) })
        resizeObserver = new ResizeObserver(() => instance.resize())
        resizeObserver.observe(canvas.current)
      } catch {
        if (!disposed) setFailed(true)
      }
    }
    void start()
    return () => { disposed = true; resizeObserver?.disconnect(); map?.remove() }
  }, [nearby, region])

  return <div className={`destination-map${ready ? ' is-ready' : ''}`} ref={frame} role="group" aria-label={t('destinations.mapAria', { region: title })}>
    <img className="destination-map-poster" src={`/media/${region}-map.jpg`} alt="" loading="lazy" />
    <div className="destination-map-canvas" ref={canvas} />
    <div className="destination-map-key" role="note" aria-label={`${title} — ${t('destinations.mapBoundary')}`}><span className="destination-map-swatch" aria-hidden="true" />{title}</div>
    {!ready && <span className="destination-map-status" role="status">{t(failed ? 'destinations.mapUnavailable' : 'destinations.mapLoading')}</span>}
  </div>
}
