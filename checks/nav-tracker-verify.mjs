import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => {
    localStorage.setItem("currentToggleState", "light")
    sessionStorage.setItem("currentToggleState", "light")
})
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1800)

const read = () => page.evaluate(() => {
    const nav = document.querySelector("nav")
    const brand = nav?.querySelector('[data-framer-name="Brand"]')
    const tracker = document.getElementById("nav-scroll-hero")
    const rest = document.getElementById("nav-scroll-rest")
    const tr = tracker?.getBoundingClientRect()
    const rr = rest?.getBoundingClientRect()
    return {
        y: Math.round(window.scrollY),
        navName: nav?.getAttribute("data-framer-name"),
        brand: brand ? { text: (brand.innerText || "").trim(), op: getComputedStyle(brand).opacity, y: Math.round(brand.getBoundingClientRect().y) } : null,
        heroTracker: tr && { top: Math.round(tr.top), h: Math.round(tr.height), id: tracker.id },
        restTracker: rr && { top: Math.round(rr.top), h: Math.round(rr.height), id: rest.id },
    }
})

console.log("LANDING", JSON.stringify(await read()))
for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 250)
    await page.waitForTimeout(350)
    console.log("WHEEL", i, JSON.stringify(await read()))
}
await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(800)
console.log("BACK", JSON.stringify(await read()))
await browser.close()
