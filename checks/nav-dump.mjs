import { chromium } from "playwright-core"

const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => {
    localStorage.setItem("currentToggleState", "light")
    sessionStorage.setItem("currentToggleState", "light")
    document.documentElement.setAttribute("data-framer-theme", "light")
})
const page = await context.newPage()
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1200)

const dump = await page.evaluate(() => {
    const nav = document.querySelector("nav")
    const pack = (el) => {
        if (!el) return null
        const s = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return {
            tag: el.tagName,
            name: el.getAttribute("data-framer-name"),
            id: el.id,
            text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
            bg: s.backgroundColor,
            color: s.color,
            border: s.border,
            opacity: s.opacity,
            visibility: s.visibility,
            display: s.display,
            w: Math.round(r.width),
            h: Math.round(r.height),
            x: Math.round(r.x),
            y: Math.round(r.y),
        }
    }
    const walk = (el, depth = 0, acc = []) => {
        if (!el || depth > 4) return acc
        const p = pack(el)
        if (p && (p.name || p.tag === "BUTTON" || p.tag === "A" || p.tag === "NAV")) acc.push({ depth, ...p })
        for (const c of el.children) walk(c, depth + 1, acc)
        return acc
    }
    const footer = document.querySelector("footer")
    return {
        theme: document.documentElement.getAttribute("data-framer-theme"),
        navName: nav?.getAttribute("data-framer-name"),
        nav: pack(nav),
        layers: nav ? walk(nav) : [],
        footer: pack(footer),
        footerText: footer ? (footer.innerText || "").replace(/\s+/g, " ").trim().slice(0, 200) : null,
        footerColor: footer ? getComputedStyle(footer).color : null,
        footerIcons: footer ? footer.querySelectorAll("svg, a, img").length : 0,
        heroNames: [...document.querySelectorAll("[data-framer-name]")].map(el => el.getAttribute("data-framer-name")).filter(n => /logo|data capture|title|hero|work/i.test(n || "")).slice(0, 40),
    }
})
console.log(JSON.stringify(dump, null, 2))
await browser.close()
