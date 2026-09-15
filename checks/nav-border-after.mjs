import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1200)

const probe = () => page.evaluate(() => {
    const after = (el) => {
        if (!el) return null
        const s = getComputedStyle(el, "::after")
        return {
            content: JSON.stringify(s.content),
            border: s.border,
            width: s.width,
            height: s.height,
            display: s.display,
            dataBorder: el.getAttribute("data-border"),
            cssVars: {
                tw: s.getPropertyValue("--border-top-width") || getComputedStyle(el).getPropertyValue("--border-top-width"),
                color: getComputedStyle(el).getPropertyValue("--border-color"),
            },
        }
    }
    const nav = document.querySelector("nav")
    const home = nav.querySelector('[data-framer-name="Home"]')
    const work = nav.querySelector('[data-framer-name="Trigger"]')
    const toggle = [...nav.querySelectorAll("button")].find((b) => b.querySelectorAll("svg").length >= 2)
    const sun = toggle?.querySelector('[data-framer-name="Sun Layer"]')
    const moon = toggle?.querySelector('[data-framer-name="Moon Layer"]')
    return {
        theme: document.documentElement.getAttribute("data-framer-theme"),
        home: after(home),
        work: after(work),
        toggle: after(toggle),
        sun: sun && { opacity: getComputedStyle(sun).opacity },
        moon: moon && { opacity: getComputedStyle(moon).opacity },
    }
})

console.log("LIGHT", JSON.stringify(await probe(), null, 2))
await page.locator("nav button").filter({ has: page.locator("svg") }).last().click()
await page.waitForTimeout(400)
console.log("DARK", JSON.stringify(await probe(), null, 2))
await browser.close()
