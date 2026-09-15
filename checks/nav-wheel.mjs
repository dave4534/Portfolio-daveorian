import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => {
    localStorage.setItem("currentToggleState", "light")
    sessionStorage.setItem("currentToggleState", "light")
})
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1500)

const read = () => page.evaluate(() => {
    const nav = document.querySelector("nav")
    const brand = nav?.querySelector('[data-framer-name="Brand"]')
    return {
        y: Math.round(window.scrollY),
        navName: nav?.getAttribute("data-framer-name"),
        brandOp: brand ? getComputedStyle(brand).opacity : null,
        brandText: brand?.innerText?.trim() || null,
    }
})

console.log("start", await read())
for (let i = 0; i < 12; i++) {
    await page.mouse.wheel(0, 400)
    await page.waitForTimeout(200)
    console.log("wheel", i, await read())
}
await browser.close()
