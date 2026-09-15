import { chromium } from "playwright-core"

const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await context.addInitScript(() => {
    localStorage.setItem("currentToggleState", "light")
    sessionStorage.setItem("currentToggleState", "light")
})
const page = await context.newPage()
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1500)

const info = await page.evaluate(() => {
    const detail = (el) => {
        if (!el) return null
        const s = getComputedStyle(el)
        const r = el.getBoundingClientRect()
        return {
            name: el.getAttribute("data-framer-name"),
            tag: el.tagName,
            id: el.id,
            className: (typeof el.className === "string" ? el.className : "").slice(0, 80),
            border: s.border,
            borderTop: s.borderTop,
            outline: s.outline,
            boxShadow: s.boxShadow,
            color: s.color,
            fill: s.fill,
            bg: s.backgroundColor,
            radius: s.borderRadius,
            w: Math.round(r.width),
            h: Math.round(r.height),
            text: (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40),
        }
    }
    const nav = document.querySelector("nav")
    const home = nav.querySelector('[data-framer-name="Home"]')
    const workBtn = nav.querySelector('[data-framer-name="Trigger"]')
    const toggle = [...nav.querySelectorAll("button")].find((b) => b.querySelectorAll("svg").length >= 2)
    const hero = document.querySelector("#project-hero, [data-framer-name='Hero']")
    const showcase = document.querySelector('[data-framer-name="Showcase"]')
    const hr = hero?.getBoundingClientRect()
    const sr = showcase?.getBoundingClientRect()
    return {
        versionMeta: document.documentElement.dataset,
        home: detail(home),
        homeP: detail(home?.querySelector("p")),
        homeSvg: detail(home?.querySelector("svg")),
        workBtn: detail(workBtn),
        workP: detail(workBtn?.querySelector("p")),
        toggle: detail(toggle),
        toggleId: toggle?.id,
        heroH: hr ? Math.round(hr.height) : null,
        heroBottom: hr ? Math.round(hr.bottom) : null,
        showcaseTop: sr ? Math.round(sr.top + window.scrollY) : null,
        showcaseName: showcase?.getAttribute("data-framer-name"),
        navName: nav.getAttribute("data-framer-name"),
        html: document.documentElement.outerHTML.includes("c834a074b"),
    }
})
console.log("TOP", JSON.stringify(info, null, 2))

const showcaseTop = info.showcaseTop || 2500
await page.evaluate((y) => window.scrollTo(0, y), showcaseTop + 40)
await page.waitForTimeout(1000)
const scrolled = await page.evaluate(() => ({
    y: Math.round(window.scrollY),
    navName: document.querySelector("nav")?.getAttribute("data-framer-name"),
    brand: document.querySelector('[data-framer-name="Brand"]')?.innerText,
    heroBottom: Math.round(document.querySelector('[data-framer-name="Hero"]')?.getBoundingClientRect().bottom || -1),
}))
console.log("SCROLLED", scrolled)

const toggle = page.locator("nav button").filter({ has: page.locator("svg") }).last()
const before = await page.evaluate(() => document.documentElement.getAttribute("data-framer-theme"))
await toggle.click()
await page.waitForTimeout(150)
const mid = await page.evaluate(() => {
    const t = [...document.querySelectorAll("nav button")].find((b) => b.querySelectorAll("svg").length >= 2)
    const r = t?.getBoundingClientRect()
    return { theme: document.documentElement.getAttribute("data-framer-theme"), w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, opacity: t ? getComputedStyle(t).opacity : null }
})
await page.waitForTimeout(500)
const after = await page.evaluate(() => {
    const t = [...document.querySelectorAll("nav button")].find((b) => b.querySelectorAll("svg").length >= 2)
    const r = t?.getBoundingClientRect()
    return { theme: document.documentElement.getAttribute("data-framer-theme"), w: r ? Math.round(r.width) : 0, h: r ? Math.round(r.height) : 0, opacity: t ? getComputedStyle(t).opacity : null }
})
console.log("TOGGLE", { before, mid, after })
await browser.close()
