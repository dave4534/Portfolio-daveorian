import { chromium } from "playwright-core"

const SITE = process.env.SITE_URL ?? "https://sustained-standards-647886.framer.app"
if (SITE.includes("silver-founders-702249")) {
    console.error("Refusing Portfolio 3 URL")
    process.exit(2)
}

const THEME = process.argv[2] ?? "dark"

const browser = await chromium.launch({ channel: "chrome", headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })

await context.addInitScript((theme) => {
    try {
        localStorage.setItem("currentToggleState", theme)
        sessionStorage.setItem("currentToggleState", theme)
        document.documentElement.setAttribute("data-framer-theme", theme)
        document.documentElement.style.colorScheme = theme
    } catch {}
}, THEME)

const page = await context.newPage()
await page.goto(SITE + "/theme-probe", { waitUntil: "commit", timeout: 60000 })

const sample = async () =>
    page.evaluate(() => {
        const root = document.documentElement
        const body = document.body
        const fill =
            document.querySelector("[data-framer-background-image-wrapper]") ||
            document.querySelector("[data-framer-name]") ||
            document.querySelector("div#main") ||
            document.querySelector("div")
        let themeAwareRule = false
        const themeSelectors = []
        for (const sheet of document.styleSheets) {
            try {
                for (const rule of sheet.cssRules) {
                    const text = rule.cssText || ""
                    if (text.includes("data-framer-theme")) {
                        themeAwareRule = true
                        if (themeSelectors.length < 6) {
                            themeSelectors.push((rule.selectorText || text).slice(0, 180))
                        }
                    }
                }
            } catch {}
        }
        const htmlStyle = getComputedStyle(root)
        const bodyStyle = body ? getComputedStyle(body) : null
        const fillStyle = fill ? getComputedStyle(fill) : null
        const tokenVars = {}
        for (const name of htmlStyle) {
            if (name.startsWith("--token-")) {
                tokenVars[name] = htmlStyle.getPropertyValue(name).trim()
            }
        }
        const bgToken = htmlStyle.getPropertyValue("--token-c4d2d1a7-4467-44cd-85d5-caac4ee4c651").trim()
        return {
            readyState: document.readyState,
            themeAttr: root.getAttribute("data-framer-theme"),
            htmlBg: htmlStyle.backgroundColor,
            bodyBg: bodyStyle?.backgroundColor ?? null,
            fillName: fill?.getAttribute("data-framer-name") ?? fill?.id ?? fill?.tagName ?? null,
            fillBg: fillStyle?.backgroundColor ?? null,
            bgToken,
            tokenCount: Object.keys(tokenVars).length,
            sampleTokens: Object.fromEntries(Object.entries(tokenVars).slice(0, 8)),
            colorScheme: htmlStyle.colorScheme,
            themeAwareRule,
            themeSelectors,
        }
    })

const out = []
const start = Date.now()
for (const at of [0, 16, 50, 100, 250, 500]) {
    const wait = at - (Date.now() - start)
    if (wait > 0) await page.waitForTimeout(wait)
    out.push({ ms: at, ...(await sample()) })
}

await browser.close()
console.log(JSON.stringify({ theme: THEME, site: SITE, samples: out }, null, 2))
