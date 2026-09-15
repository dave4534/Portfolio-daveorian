import { chromium } from "playwright-core"

const SITE = process.env.SITE_URL ?? "https://sustained-standards-647886.framer.app"
const PATH = process.argv[2] ?? "/data-capture-2"
const STORED = process.argv[3] ?? "light"

const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript((theme) => {
    try {
        localStorage.setItem("currentToggleState", theme)
        sessionStorage.setItem("currentToggleState", theme)
        document.documentElement.setAttribute("data-framer-theme", theme)
        document.documentElement.style.colorScheme = theme
    } catch {}
}, STORED)

const page = await context.newPage()
await page.goto(SITE + PATH, { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForSelector("nav", { timeout: 15000 })
await page.waitForTimeout(1500)

const snap = (label) =>
    page.evaluate((label) => {
        const layer = (el) => {
            if (!el) return null
            const s = getComputedStyle(el)
            const r = el.getBoundingClientRect()
            const svg = el.querySelector("svg")
            return {
                name: el.getAttribute("data-framer-name"),
                tag: el.tagName,
                cls: [...el.classList].filter((c) => c.startsWith("framer-")).slice(0, 4),
                display: s.display,
                visibility: s.visibility,
                opacity: s.opacity,
                transform: s.transform,
                scale: s.scale,
                overflow: s.overflow,
                pointerEvents: s.pointerEvents,
                w: Math.round(r.width),
                h: Math.round(r.height),
                svg: svg
                    ? {
                          html: svg.outerHTML.slice(0, 220),
                          paths: [...svg.querySelectorAll("path,circle,line")].length,
                          viewBox: svg.getAttribute("viewBox"),
                      }
                    : null,
            }
        }
        const nav = document.querySelector("nav")
        const named = document.querySelector("#p4-theme-toggle")
        const byIcons = [...(nav?.querySelectorAll("button") || [])].find(
            (b) => b.querySelectorAll("svg").length >= 2
        )
        const themeNamed = nav?.querySelector('[data-framer-name="Theme"]')
        const toggle = named || byIcons || themeNamed
        const names = [...(toggle?.querySelectorAll("[data-framer-name]") || [])].map((el) =>
            el.getAttribute("data-framer-name")
        )
        const sun =
            toggle?.querySelector('[data-framer-name="Sun Layer"]') ||
            toggle?.querySelector('[data-framer-name="Sun"]')
        const moon =
            toggle?.querySelector('[data-framer-name="Moon Layer"]') ||
            toggle?.querySelector('[data-framer-name="Moon"]')
        const icons = toggle?.querySelector('[data-framer-name="Theme Icons"]')
        const svgs = [...(toggle?.querySelectorAll("svg") || [])].map((svg, i) => ({
            i,
            name: svg.closest("[data-framer-name]")?.getAttribute("data-framer-name"),
            opacity: getComputedStyle(svg).opacity,
            display: getComputedStyle(svg).display,
            visibility: getComputedStyle(svg.parentElement || svg).visibility,
            transform: getComputedStyle(svg.parentElement || svg).transform,
            html: svg.outerHTML.slice(0, 180),
        }))
        const styleEl = document.getElementById("p4-theme-tokens")
        const styleText = styleEl?.textContent || ""
        const iconCss = styleText
            .split("}")
            .filter((chunk) => /Sun|Moon|theme-toggle|Theme Icons/i.test(chunk))
            .map((c) => c.trim().slice(0, 280))
        const matchingRules = []
        for (const sheet of document.styleSheets) {
            let rules
            try {
                rules = [...sheet.cssRules]
            } catch {
                continue
            }
            for (const r of rules) {
                const text = r.cssText || ""
                if (/Sun Layer|Moon Layer|p4-theme-toggle|Theme Icons/i.test(text)) {
                    matchingRules.push(text.slice(0, 320))
                }
            }
        }
        return {
            label,
            theme: document.documentElement.getAttribute("data-framer-theme"),
            storage: localStorage.getItem("currentToggleState"),
            hasNamedId: !!named,
            toggleName: toggle?.getAttribute("data-framer-name"),
            toggleTag: toggle?.tagName,
            names,
            svgCount: toggle?.querySelectorAll("svg").length ?? 0,
            sun: layer(sun),
            moon: layer(moon),
            icons: layer(icons),
            svgs,
            iconCss,
            matchingRules,
            hasToggleFn: /p4Toggle|withThemeToggle|currentToggleState/.test(document.documentElement.outerHTML),
            headHasScript: /data-framer-theme/.test(document.head.innerHTML),
        }
    }, label)

const before = await snap("before")
console.log(JSON.stringify(before, null, 2))

await page.evaluate(() => {
    const nav = document.querySelector("nav")
    const named = document.querySelector("#p4-theme-toggle")
    const byIcons = [...(nav?.querySelectorAll("button") || [])].find(
        (b) => b.querySelectorAll("svg").length >= 2
    )
    const themeNamed = nav?.querySelector('[data-framer-name="Theme"]')
    const btn = named || byIcons || themeNamed
    if (!btn) throw new Error("theme toggle missing")
    btn.click()
})
await page.waitForTimeout(600)
const after = await snap("after-click")
console.log(JSON.stringify(after, null, 2))

await page.evaluate(() => {
    const nav = document.querySelector("nav")
    const named = document.querySelector("#p4-theme-toggle")
    const byIcons = [...(nav?.querySelectorAll("button") || [])].find(
        (b) => b.querySelectorAll("svg").length >= 2
    )
    const themeNamed = nav?.querySelector('[data-framer-name="Theme"]')
    const btn = named || byIcons || themeNamed
    btn.click()
})
await page.waitForTimeout(600)
const after2 = await snap("after-second-click")
console.log(JSON.stringify(after2, null, 2))

await browser.close()
