import { createServer, loadEnv } from 'vite'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const template = await readFile(resolve(root, 'dist/index.html'), 'utf8')
const siteUrl = loadEnv('production', root, 'SITE_').SITE_URL?.replace(/\/$/, '')
const meta = {
  en: { title: 'Private Birdwatching & Wildlife Tours in the Pantanal | Vitinho', description: 'Private birdwatching, wildlife photography and nature journeys in the Pantanal Sul and Serra da Bodoquena with local naturalist guide Vitinho.' },
  pt: { title: 'Observação de Aves e Vida Selvagem no Pantanal | Vitinho', description: 'Expedições privativas de observação de aves, fotografia e vida selvagem no Pantanal Sul e na Serra da Bodoquena com o guia Vitinho.' },
}
const server = await createServer({ root, server: { middlewareMode: true }, appType: 'custom' })
try {
  const { render } = await server.ssrLoadModule('/src/entry-server.tsx')
  for (const lang of ['en', 'pt']) {
    const canonical = siteUrl ? `${siteUrl}/${lang}/` : ''
    const head = [
      `<meta name="description" content="${meta[lang].description}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:title" content="${meta[lang].title}" />`,
      `<meta property="og:description" content="${meta[lang].description}" />`,
      `<meta property="og:locale" content="${lang === 'pt' ? 'pt_BR' : 'en_US'}" />`,
      ...(canonical ? [
        `<link rel="canonical" href="${canonical}" />`,
        `<meta property="og:url" content="${canonical}" />`,
        `<link rel="alternate" hreflang="en" href="${siteUrl}/en/" />`,
        `<link rel="alternate" hreflang="pt-BR" href="${siteUrl}/pt/" />`,
        `<link rel="alternate" hreflang="x-default" href="${siteUrl}/en/" />`,
      ] : []),
      `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', '@type': 'TravelAgency', name: 'Vitinho Birdwatching Tours', description: meta[lang].description, areaServed: ['Pantanal Sul', 'Serra da Bodoquena'], telephone: '+55 67 99826-0643', email: 'vitinhopantanal@gmail.com', ...(canonical ? { url: canonical } : {}) })}</script>`,
    ].join('\n')
    const html = template.replace('<html lang="en">', `<html lang="${lang === 'pt' ? 'pt-BR' : 'en'}">`).replace(/<title>.*?<\/title>/, `<title>${meta[lang].title}</title>`).replace('<!--seo-head-->', head).replace('<!--app-html-->', render(lang))
    if (html.includes('<!--app-html-->') || html.includes('<!--seo-head-->')) throw new Error('Pre-render placeholders not replaced')
    await mkdir(resolve(root, 'dist', lang), { recursive: true })
    await writeFile(resolve(root, 'dist', lang, 'index.html'), html)
  }
  await writeFile(resolve(root, 'dist', 'index.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/en/"><title>Vitinho Birdwatching Tours</title></head><body><a href="/en/">English</a> · <a href="/pt/">Português</a></body></html>')
  if (siteUrl) await writeFile(resolve(root, 'dist', 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteUrl}/en/</loc></url><url><loc>${siteUrl}/pt/</loc></url></urlset>`)
  await writeFile(resolve(root, 'dist', 'robots.txt'), `User-agent: *\nAllow: /\n${siteUrl ? `Sitemap: ${siteUrl}/sitemap.xml\n` : ''}`)
} finally {
  await server.close()
}
