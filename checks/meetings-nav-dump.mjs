import { chromium } from "playwright-core"

const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await context.newPage()
await page.goto(SITE + "/meetings", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1500)

const snap = async (scrollY) => {
    if (scrollY) {
        await page.evaluate((y) => window.scrollTo(0, y), scrollY)
        await page.waitForTimeout(800)
    }
    return page.evaluate(() => ({
        navName: document.querySelector("nav")?.getAttribute("data-framer-name"),
        brand: document.querySelector('[data-framer-name="Brand"]')?.innerText?.replace(/\s+/g, " ").trim() || null,
        brandClipKids: document.querySelector('[data-framer-name="Brand Clip"]')?.children.length ?? 0,
        scrollY: Math.round(window.scrollY),
    }))
}

console.log(JSON.stringify({ top: await snap(0), scrolled: await snap(900) }, null, 2))
await browser.close()
