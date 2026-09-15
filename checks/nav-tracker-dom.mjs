import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1800)
const out = await page.evaluate(() => {
    const named = [...document.querySelectorAll("[data-framer-name]")].map((el) => el.getAttribute("data-framer-name"))
    const scrollish = named.filter((n) => /scroll|tracker|hero/i.test(n || ""))
    const ids = [...document.querySelectorAll("[id]")].map((el) => el.id).filter((id) => /scroll|hero|nav/i.test(id))
    const abs = [...document.querySelectorAll("div")].filter((el) => {
        const s = getComputedStyle(el)
        return s.position === "absolute" && el.getBoundingClientRect().height > 700 && el.getBoundingClientRect().height < 900
    }).slice(0, 8).map((el) => {
        const r = el.getBoundingClientRect()
        return { name: el.getAttribute("data-framer-name"), id: el.id, h: Math.round(r.height), top: Math.round(r.top), op: getComputedStyle(el).opacity, pe: getComputedStyle(el).pointerEvents }
    })
    return { scrollish, ids: ids.slice(0, 30), abs, hasNavScroll: named.includes("Nav Scroll Hero") }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
