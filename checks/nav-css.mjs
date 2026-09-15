import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1200)
const out = await page.evaluate(() => {
    const pick = (sel) => {
        const el = typeof sel === "string" ? document.querySelector(sel) : sel
        if (!el) return null
        const cls = [...el.classList].filter((c) => c.startsWith("framer-"))
        const rules = []
        for (const sheet of [...document.styleSheets]) {
            let css
            try { css = [...sheet.cssRules] } catch { continue }
            for (const r of css) {
                if (!r.selectorText) continue
                if (cls.some((c) => r.selectorText.includes(c)) && /border|box-shadow|color/.test(r.cssText)) {
                    rules.push(r.cssText.slice(0, 300))
                }
            }
        }
        return { cls, rules: rules.slice(0, 12) }
    }
    const nav = document.querySelector("nav")
    const home = nav.querySelector('[data-framer-name="Home"]')
    const work = nav.querySelector('[data-framer-name="Trigger"]')
    const toggle = [...nav.querySelectorAll("button")].find((b) => b.querySelectorAll("svg").length >= 2)
    const sun = toggle?.querySelector('[data-framer-name="Sun Layer"]')
    const moon = toggle?.querySelector('[data-framer-name="Moon Layer"]')
    return {
        home: pick(home),
        work: pick(work),
        toggle: pick(toggle),
        sun: sun && { opacity: getComputedStyle(sun).opacity, display: getComputedStyle(sun).display, vis: getComputedStyle(sun).visibility },
        moon: moon && { opacity: getComputedStyle(moon).opacity, display: getComputedStyle(moon).display, vis: getComputedStyle(moon).visibility },
        headHasP4: !!document.getElementById("p4-theme-toggle") || /p4-theme-toggle/.test(document.head.innerHTML),
    }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
