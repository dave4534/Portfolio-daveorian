import { chromium } from "playwright-core"

const SITE = process.env.SITE_URL
const PATH = process.argv[2] ?? "/data-capture"
const STORED = process.argv[3] ?? "dark"
const CLICK = process.argv.includes("--click")

if (!SITE) {
    console.error("Set SITE_URL to the Portfolio 4 .framer.app URL")
    process.exit(2)
}
if (SITE.includes("silver-founders-702249")) {
    console.error("Refusing Portfolio 3 URL")
    process.exit(2)
}

const SAMPLE_MS = [0, 16, 50, 100, 150, 250, 500]
const HIDE_FLAGS = ["data-pn-nav-ready"]
const BG_TOKEN = "--token-c4d2d1a7-4467-44cd-85d5-caac4ee4c651"
const BG_EXPECTED = {
    light: ["rgb(255, 255, 255)", "#fff", "#ffffff"],
    dark: ["rgb(24, 24, 24)", "#181818"],
}

const norm = (value) => {
    if (!value) return ""
    const v = value.trim().toLowerCase()
    if (v === "#fff" || v === "#ffffff") return "rgb(255, 255, 255)"
    if (v === "#181818") return "rgb(24, 24, 24)"
    return v.replace(/\s+/g, "")
}

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
page.on("pageerror", (err) => console.error("pageerror", String(err)))

await page.goto(SITE + PATH, { waitUntil: "commit", timeout: 60000 })
await page.waitForFunction(
    () => !!document.querySelector("nav[data-framer-name], nav"),
    { timeout: 15000 }
)

const sample = async () =>
    page.evaluate((bgToken) => {
        const root = document.documentElement
        const nav = document.querySelector("nav[data-framer-name]") || document.querySelector("nav")
        const body = document.body
        const stat =
            document.querySelector('[data-framer-name="Stat"]') ||
            document.querySelector('[data-framer-name="Light Mode"]') ||
            document.querySelector('[data-framer-name="Dark Mode"]')
        const footer = document.querySelector("footer")
        const pack = (el) => {
            if (!el) return { name: null, bg: null, color: null, opacity: null }
            const s = getComputedStyle(el)
            return {
                name: el.getAttribute("data-framer-name"),
                bg: s.backgroundColor,
                color: s.color,
                opacity: s.opacity,
            }
        }
        const flags = {}
        for (const el of [root, body]) {
            if (!el) continue
            for (const a of el.getAttributeNames()) {
                if (a.startsWith("data-pn-") || a.includes("nav-ready")) {
                    flags[a] = el.getAttribute(a)
                }
            }
        }
        const tokenSource = body || root
        const tokenValue = tokenSource
            ? getComputedStyle(tokenSource).getPropertyValue(bgToken).trim()
            : ""
        return {
            themeAttr: root.getAttribute("data-framer-theme"),
            flags,
            nav: pack(nav),
            body: pack(body),
            stat: pack(stat),
            footer: pack(footer),
            bgToken: tokenValue,
        }
    }, BG_TOKEN)

const samples = []
const start = Date.now()
for (const at of SAMPLE_MS) {
    const wait = at - (Date.now() - start)
    if (wait > 0) await page.waitForTimeout(wait)
    samples.push({ ms: at, ...(await sample()) })
}

if (CLICK) {
    await page.waitForTimeout(800)
    await page.evaluate(() => {
        const named =
            document.querySelector("#p4-theme-toggle") ||
            document.querySelector("[data-theme-toggle]")
        const byIcons = [...document.querySelectorAll("nav button")].find(
            (btn) => btn.querySelectorAll("svg").length >= 2
        )
        const btn = named || byIcons
        if (!btn) throw new Error("theme toggle missing")
        btn.click()
    })
    const clickStart = Date.now()
    for (const at of SAMPLE_MS) {
        const wait = at - (Date.now() - clickStart)
        if (wait > 0) await page.waitForTimeout(wait)
        samples.push({ ms: `click+${at}`, ...(await sample()) })
    }
}

await browser.close()

const rows = samples.map((s) => ({
    ms: s.ms,
    theme: s.themeAttr,
    navName: s.nav.name,
    navBg: s.nav.bg,
    bodyBg: s.body.bg,
    statBg: s.stat.bg,
    footerBg: s.footer.bg,
    token: s.bgToken,
    flags: JSON.stringify(s.flags),
}))
console.table(rows)

const expectedTheme = CLICK ? (STORED === "dark" ? "light" : "dark") : STORED
const loadSamples = samples.filter((s) => typeof s.ms === "number")
const clickSamples = samples.filter((s) => String(s.ms).startsWith("click"))
const windowToCheck = CLICK ? clickSamples : loadSamples
const settled = windowToCheck[windowToCheck.length - 1]
const failures = []

if (!CLICK) {
    for (const s of loadSamples) {
        if (s.themeAttr !== STORED) {
            failures.push(`${s.ms}ms: data-framer-theme is "${s.themeAttr}" expected "${STORED}"`)
        }
        const expected = BG_EXPECTED[STORED] || []
        if (s.bgToken && !expected.map(norm).includes(norm(s.bgToken))) {
            failures.push(
                `${s.ms}ms: ${BG_TOKEN} is "${s.bgToken}" expected ${STORED} (${expected.join(" / ")})`
            )
        }
        if (!s.bgToken && s.body.bg) {
            failures.push(`${s.ms}ms: ${BG_TOKEN} missing on body`)
        }
    }
}

for (const s of windowToCheck) {
    if (!s.nav.name) {
        failures.push(`${s.ms}ms: nav missing`)
        continue
    }
    for (const flag of HIDE_FLAGS) {
        if (s.flags && Object.prototype.hasOwnProperty.call(s.flags, flag)) {
            failures.push(`${s.ms}ms: hide flag ${flag}=${s.flags[flag]}`)
        }
    }
    for (const key of ["nav", "body", "stat", "footer"]) {
        if (!s[key]?.bg || !settled[key]?.bg) continue
        if (s[key].bg !== settled[key].bg) {
            failures.push(
                `${s.ms}ms: ${key} background ${s[key].bg} differs from settled ${settled[key].bg}`
            )
        }
        if (s[key].color && settled[key].color && s[key].color !== settled[key].color) {
            failures.push(
                `${s.ms}ms: ${key} color ${s[key].color} differs from settled ${settled[key].color}`
            )
        }
    }
}

if (CLICK && settled.themeAttr !== expectedTheme) {
    failures.push(`after click: data-framer-theme is "${settled.themeAttr}" expected "${expectedTheme}"`)
}

if (failures.length) {
    console.error("\nFAIL\n" + failures.map((f) => "  - " + f).join("\n"))
    process.exit(1)
}
console.log("\nPASS — " + PATH + " stored=" + STORED + (CLICK ? " click" : " load"))
