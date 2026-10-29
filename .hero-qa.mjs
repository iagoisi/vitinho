import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const profile = mkdtempSync(join(tmpdir(), 'vitinho-qa-'))
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', [
  '--headless=new', '--disable-gpu', '--disable-extensions', '--no-first-run', '--remote-debugging-port=0',
  '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank',
])

try {
  for (let i = 0; i < 100 && !existsSync(join(profile, 'DevToolsActivePort')); i++) await new Promise(resolve => setTimeout(resolve, 100))
  const [port] = readFileSync(join(profile, 'DevToolsActivePort'), 'utf8').split('\n')
  const { webSocketDebuggerUrl } = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json()
  const ws = new WebSocket(webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject })
  let id = 0
  const pending = new Map()
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data)
    if (!message.id) return
    pending.get(message.id)?.(message)
    pending.delete(message.id)
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const next = ++id
    pending.set(next, message => message.error ? reject(message.error) : resolve(message.result))
    ws.send(JSON.stringify({ id: next, method, params }))
  })
  await send('Page.enable')
  await send('Runtime.enable')

  for (const [name, width, height, lang] of [['mobile', 390, 844, 'pt'], ['small-mobile', 320, 740, 'pt'], ['mobile-en', 390, 844, 'en']]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: true })
    await send('Page.navigate', { url: `http://127.0.0.1:5192/${lang}/` })
    await new Promise(resolve => setTimeout(resolve, 800))
    const { data } = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
    writeFileSync(join(process.cwd(), `hero-${name}-check.png`), Buffer.from(data, 'base64'))
    const { result } = await send('Runtime.evaluate', { expression: `JSON.stringify({width: innerWidth, scrollWidth: document.documentElement.scrollWidth, logoLoaded: document.querySelector('.brand img').naturalWidth > 0, photo: document.querySelector('.hero-photo').getBoundingClientRect().toJSON(), title: document.querySelector('.hero h1').getBoundingClientRect().toJSON(), action: document.querySelector('.hero-actions').getBoundingClientRect().toJSON()})`, returnByValue: true })
    console.log(name, result.value)
  }
  ws.close()
} finally {
  chrome.kill()
}
