import { chromium } from "playwright-core"

const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })

async function measure(theme, scrollY = 0) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.addInitScript((t) => {
        localStorage.setItem("currentToggleState", t)
        sessionStorage.setItem("currentToggleState", t)
        document.documentElement.setAttribute("data-framer-theme", t)
        document.documentElement.style.colorScheme = t
    }, theme)
    const page = await context.newPage()
    await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
    await page.waitForTimeout(1500)
    if (scrollY) {
        await page.evaluate((y) => window.scrollTo(0, y), scrollY)
        await page.waitForTimeout(800)
    }
    const dump = await page.evaluate(() => {
        const pack = (el) => {
            if (!el) return null
            const s = getComputedStyle(el)
            const r = el.getBoundingClientRect()
            return {
                tag: el.tagName,
                name: el.getAttribute("data-framer-name"),
                id: el.id,
                cls: (el.className || "").toString().slice(0, 80),
                text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 60),
                bg: s.backgroundColor,
                color: s.color,
                fill: s.fill,
                border: s.border,
                opacity: s.opacity,
                visibility: s.visibility,
                display: s.display,
                overflow: s.overflow,
                w: Math.round(r.width),
                h: Math.round(r.height),
                x: Math.round(r.x),
                y: Math.round(r.y),
                svg: el.querySelectorAll("svg").length,
                children: [...el.children].map((c) => c.getAttribute("data-framer-name") || c.tagName).slice(0, 8),
            }
        }
        const nav = document.querySelector("nav")
        const home = nav?.querySelector('[data-framer-name="Home"]')
        const work = nav?.querySelector('[data-framer-name="Selected Work"]')
        const brandClip = nav?.querySelector('[data-framer-name="Brand Clip"]')
        const brand = nav?.querySelector('[data-framer-name="Brand"]')
        const toggle = document.querySelector("#p4-theme-toggle, [data-theme-toggle], nav button")
        const footer = document.querySelector("footer")
        const footerSvgs = footer ? [...footer.querySelectorAll("svg")].map((s) => ({
            w: Math.round(s.getBoundingClientRect().width),
            h: Math.round(s.getBoundingClientRect().height),
            fill: getComputedStyle(s).fill || getComputedStyle(s).color,
            opacity: getComputedStyle(s).opacity,
            display: getComputedStyle(s).display,
        })) : []
        const footerLinks = footer ? [...footer.querySelectorAll("a")].map((a) => ({
            text: (a.innerText || "").trim().slice(0, 40),
            href: a.getAttribute("href"),
            color: getComputedStyle(a).color,
            opacity: getComputedStyle(a).opacity,
            w: Math.round(a.getBoundingClientRect().width),
            display: getComputedStyle(a).display,
        })) : []
        return {
            theme: document.documentElement.getAttribute("data-framer-theme"),
            scrollY: Math.round(window.scrollY),
            navName: nav?.getAttribute("data-framer-name"),
            home: pack(home),
            homeKids: home ? [...home.children].map(pack) : [],
            work: pack(work),
            workKids: work ? [...work.querySelectorAll("*")].slice(0, 12).map(pack) : [],
            brandClip: pack(brandClip),
            brand: pack(brand),
            toggle: pack(toggle),
            toggleKids: toggle ? [...toggle.children].map(pack) : [],
            footer: pack(footer),
            footerSvgs,
            footerLinks,
            footerTexts: footer ? [...footer.querySelectorAll("p, span, a, h1, h2, h3, div")].slice(0, 20).map((el) => ({
                name: el.getAttribute("data-framer-name"),
                text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
                color: getComputedStyle(el).color,
                opacity: getComputedStyle(el).opacity,
            })).filter((x) => x.text) : [],
        }
    })
    await context.close()
    return dump
}

const lightTop = await measure("light", 0)
const lightScroll = await measure("light", 900)
const darkTop = await measure("dark", 0)
console.log(JSON.stringify({ lightTop, lightScroll, darkTop }, null, 2))
await browser.close()
