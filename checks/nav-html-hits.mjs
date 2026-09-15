import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(2000)
const hits = await page.evaluate(() => {
    const html = document.documentElement.innerHTML
    const keys = ["nav-scroll-hero", "navScrollHero", "WmiBHGQoC", "uoGuBs61d", "MGs_j6C3W", "onScrollTarget", "PACYvZSa8"]
    const found = {}
    for (const k of keys) found[k] = html.includes(k)
    const scripts = [...document.scripts].map((s) => s.src).filter(Boolean).slice(0, 15)
    return { found, scripts, htmlLen: html.length }
})
console.log(JSON.stringify(hits, null, 2))
await browser.close()
