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

const snap = async (label) => {
    const d = await page.evaluate(() => {
        const nav = document.querySelector("nav")
        const toggle = [...(nav?.querySelectorAll("button") || [])].find((b) => b.querySelectorAll("svg").length >= 2)
        const sun = toggle?.querySelector('[data-framer-name="Sun Layer"]')
        const moon = toggle?.querySelector('[data-framer-name="Moon Layer"]')
        const home = nav?.querySelector('[data-framer-name="Home"]')
        const workP = nav?.querySelector('[data-framer-name="Trigger"] p')
        const brand = nav?.querySelector('[data-framer-name="Brand"]')
        const homeAfter = home ? getComputedStyle(home, "::after").border : null
        return {
            theme: document.documentElement.getAttribute("data-framer-theme"),
            navName: nav?.getAttribute("data-framer-name"),
            brand: brand ? { text: brand.innerText.trim(), y: Math.round(brand.getBoundingClientRect().y), opacity: getComputedStyle(brand).opacity } : null,
            homeAfter,
            workColor: workP ? getComputedStyle(workP).color : null,
            sun: sun && Math.round(parseFloat(getComputedStyle(sun).opacity) * 100) / 100,
            moon: moon && Math.round(parseFloat(getComputedStyle(moon).opacity) * 100) / 100,
            toggleSize: toggle && Math.round(toggle.getBoundingClientRect().width),
        }
    })
    console.log(label, JSON.stringify(d))
    return d
}

await snap("LANDING")
await page.locator("nav button").filter({ has: page.locator("svg") }).last().click()
await page.waitForTimeout(500)
await snap("AFTER_TOGGLE_DARK")
await page.locator("nav button").filter({ has: page.locator("svg") }).last().click()
await page.waitForTimeout(400)
await snap("AFTER_TOGGLE_LIGHT")

await page.evaluate(() => {
    document.querySelector('[data-framer-name="Showcase"]')?.scrollIntoView({ block: "start" })
})
await page.waitForTimeout(1500)
await snap("SHOWCASE")

await page.evaluate(() => window.scrollTo(0, 4000))
await page.waitForTimeout(1500)
await snap("DEEP")

await page.evaluate(() => window.scrollTo(0, 0))
await page.waitForTimeout(1200)
await snap("BACK_TOP")
await browser.close()
