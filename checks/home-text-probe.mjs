import { chromium } from "playwright-core"

const SITE = process.env.SITE_URL ?? "https://sustained-standards-647886.framer.app"

const EXPECTED = {
    body: { light: "rgb(0, 0, 0)", dark: "rgb(162, 162, 162)" },
    h1: { light: "rgb(0, 0, 0)", dark: "rgb(255, 255, 255)" },
    anchor: { light: "rgb(82, 82, 82)", dark: "rgb(162, 162, 162)" },
}

const theme = process.argv[2] ?? "light"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

await context.addInitScript((t) => {
    try {
        localStorage.setItem("currentToggleState", t)
        sessionStorage.setItem("currentToggleState", t)
        document.documentElement.setAttribute("data-framer-theme", t)
        document.documentElement.style.colorScheme = t
    } catch {}
}, theme)

const page = await context.newPage()
await page.goto(`${SITE}/home-redesign`, { waitUntil: "domcontentloaded", timeout: 120000 })
await page.waitForTimeout(3000)

const result = await page.evaluate((expected) => {
    const themeAttr = document.documentElement.getAttribute("data-framer-theme") ?? "light"
    const htmlStyle = getComputedStyle(document.documentElement)
    const bodyToken = htmlStyle.getPropertyValue("--token-f50b9e49-0567-4b82-900d-bbce3c28a918").trim()
    const h1Token = htmlStyle.getPropertyValue("--token-020bc62e-8f64-4082-8cfb-a2be094c594c").trim()

    const nodes = [...document.querySelectorAll("[data-framer-component-type='RichTextContainer']")]
    const samples = nodes.slice(0, 60).map((el) => {
        const name = el.getAttribute("data-framer-name") || el.closest("[data-framer-name]")?.getAttribute("data-framer-name") || "?"
        const color = getComputedStyle(el).color
        const parent = el.closest("[data-framer-name]")?.getAttribute("data-framer-name") ?? null
        const inSectionNav = !!el.closest('[data-framer-name="Section Nav"]')
        return { name, parent, inSectionNav, color }
    })

    const mismatches = samples.filter((s) => {
        if (s.inSectionNav) {
            return s.color !== expected.anchor[themeAttr] && s.color !== expected.h1[themeAttr]
        }
        const isTitle = /title|heading|h1/i.test(s.name) || /Title Wrap/i.test(s.parent ?? "")
        const want = isTitle ? expected.h1[themeAttr] : expected.body[themeAttr]
        return s.color !== want && s.color !== "rgba(0, 0, 0, 0)"
    })

    return { themeAttr, bodyToken, h1Token, sampleCount: samples.length, mismatches, samples }
}, EXPECTED)

console.log(JSON.stringify({ theme, ...result }, null, 2))
await browser.close()
