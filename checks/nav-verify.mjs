import { chromium } from "playwright-core"

const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })

function pack(el) {
    if (!el) return null
    const s = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return {
        name: el.getAttribute("data-framer-name"),
        tag: el.tagName,
        id: el.id,
        text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
        bg: s.backgroundColor,
        color: s.color,
        border: s.border,
        opacity: s.opacity,
        visibility: s.visibility,
        w: Math.round(r.width),
        h: Math.round(r.height),
        x: Math.round(r.x),
        y: Math.round(r.y),
        svg: el.querySelectorAll("svg").length,
    }
}

async function setup(theme) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    await context.addInitScript((t) => {
        localStorage.setItem("currentToggleState", t)
        sessionStorage.setItem("currentToggleState", t)
        document.documentElement.setAttribute("data-framer-theme", t)
        document.documentElement.style.colorScheme = t
    }, theme)
    const page = await context.newPage()
    await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
    await page.waitForTimeout(1800)
    return { context, page }
}

function measure(page) {
    return page.evaluate(() => {
        const pack = (el) => {
            if (!el) return null
            const s = getComputedStyle(el)
            const r = el.getBoundingClientRect()
            return {
                name: el.getAttribute("data-framer-name"),
                tag: el.tagName,
                id: el.id,
                text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 80),
                bg: s.backgroundColor,
                color: s.color,
                border: s.border,
                opacity: s.opacity,
                visibility: s.visibility,
                w: Math.round(r.width),
                h: Math.round(r.height),
                x: Math.round(r.x),
                y: Math.round(r.y),
                svg: el.querySelectorAll("svg").length,
            }
        }
        const nav = document.querySelector("nav")
        const home = nav?.querySelector('[data-framer-name="Home"]')
        const homeSvg = home?.querySelector("svg")
        const work = nav?.querySelector('[data-framer-name="Selected Work"]')
        const workP = work?.querySelector("p")
        const brand = nav?.querySelector('[data-framer-name="Brand"]')
        const toggle = document.querySelector("#p4-theme-toggle") || nav?.querySelector('[data-framer-name="Theme Icons"]')?.closest("button")
        const footer = document.querySelector("footer")
        const footerSvgs = footer ? [...footer.querySelectorAll("svg")].map((s) => ({
            fill: getComputedStyle(s).fill || getComputedStyle(s).color,
            color: getComputedStyle(s).color,
            w: Math.round(s.getBoundingClientRect().width),
            opacity: getComputedStyle(s).opacity,
        })) : []
        const nameLink = footer?.querySelector("a")
        return {
            theme: document.documentElement.getAttribute("data-framer-theme"),
            scrollY: Math.round(window.scrollY),
            navName: nav?.getAttribute("data-framer-name"),
            home: pack(home),
            homeSvgFill: homeSvg ? getComputedStyle(homeSvg).fill : null,
            homeSvgColor: homeSvg ? getComputedStyle(homeSvg).color : null,
            work: pack(work),
            workPColor: workP ? getComputedStyle(workP).color : null,
            brand: pack(brand),
            toggle: pack(toggle),
            footerBg: footer ? getComputedStyle(footer).backgroundColor : null,
            footerNameColor: nameLink ? getComputedStyle(nameLink).color : null,
            footerNameText: nameLink ? (nameLink.innerText || "").trim() : null,
            footerSvgs,
        }
    })
}

const { context: c1, page: p1 } = await setup("light")
const lightTop = await measure(p1)
await p1.evaluate(() => document.querySelector('[data-framer-name="Showcase"]')?.scrollIntoView())
await p1.waitForTimeout(900)
const lightScroll = await measure(p1)

const toggleBefore = await p1.evaluate(() => {
    const t = document.querySelector("#p4-theme-toggle")
    const r = t?.getBoundingClientRect()
    return { exists: !!t, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, theme: document.documentElement.getAttribute("data-framer-theme") }
})
await p1.click("#p4-theme-toggle", { timeout: 5000 }).catch(() => null)
await p1.waitForTimeout(200)
const mid = await p1.evaluate(() => {
    const t = document.querySelector("#p4-theme-toggle")
    const r = t?.getBoundingClientRect()
    return { exists: !!t, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, theme: document.documentElement.getAttribute("data-framer-theme") }
})
await p1.waitForTimeout(600)
const afterClick = await p1.evaluate(() => {
    const t = document.querySelector("#p4-theme-toggle")
    const r = t?.getBoundingClientRect()
    return { exists: !!t, w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, theme: document.documentElement.getAttribute("data-framer-theme") }
})
await c1.close()

const { context: c2, page: p2 } = await setup("dark")
const darkTop = await measure(p2)
await p2.evaluate(() => window.scrollTo(0, 20000))
await p2.waitForTimeout(400)
const darkFooter = await measure(p2)
await c2.close()

console.log(JSON.stringify({ lightTop, lightScroll, toggle: { toggleBefore, mid, afterClick }, darkTop, darkFooter }, null, 2))
await browser.close()
