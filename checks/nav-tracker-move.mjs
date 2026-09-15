import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1500)

const read = () => page.evaluate(() => {
    const hero = document.querySelector('[data-framer-name="Nav Scroll Hero"]')
    const rest = document.querySelector('[data-framer-name="Nav Scroll Rest"]')
    const nav = document.querySelector("nav")
    const pack = (el) => {
        if (!el) return null
        const r = el.getBoundingClientRect()
        const s = getComputedStyle(el)
        return {
            top: Math.round(r.top),
            h: Math.round(r.height),
            pos: s.position,
            parent: el.parentElement?.getAttribute("data-framer-name") || el.parentElement?.tagName,
            attrs: [...el.attributes].map((a) => a.name + "=" + a.value.slice(0, 60)),
        }
    }
    return {
        y: Math.round(window.scrollY),
        navName: nav?.getAttribute("data-framer-name"),
        hero: pack(hero),
        rest: pack(rest),
        navPos: nav ? getComputedStyle(nav).position : null,
    }
})

console.log("TOP", JSON.stringify(await read(), null, 2))
await page.mouse.wheel(0, 900)
await page.waitForTimeout(500)
console.log("SCROLLED", JSON.stringify(await read(), null, 2))
await browser.close()
