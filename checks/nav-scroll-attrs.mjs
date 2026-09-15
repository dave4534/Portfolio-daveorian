import { chromium } from "playwright-core"
const SITE = "https://sustained-standards-647886.framer.app"
const browser = await chromium.launch({ channel: "chrome", headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto(SITE + "/data-capture-2", { waitUntil: "domcontentloaded", timeout: 60000 })
await page.waitForTimeout(1500)
const out = await page.evaluate(() => {
    const pack = (el) => el && {
        name: el.getAttribute("data-framer-name"),
        id: el.id,
        attrs: [...el.attributes].map((a) => a.name + "=" + a.value.slice(0, 80)),
        dataset: { ...el.dataset },
    }
    return {
        projectHero: pack(document.querySelector("#project-hero, [data-framer-name='Hero']")),
        tracker: pack(document.querySelector('[data-framer-name="Nav Scroll Hero"]')),
        rest: pack(document.querySelector('[data-framer-name="Nav Scroll Rest"]')),
        scrollAttrs: [...document.querySelectorAll("*")].filter((el) =>
            [...el.attributes].some((a) => /scroll/i.test(a.name) || /scroll/i.test(a.value))
        ).slice(0, 20).map((el) => ({
            name: el.getAttribute("data-framer-name"),
            attrs: [...el.attributes].filter((a) => /scroll|section|target/i.test(a.name) || /scroll/i.test(a.value)).map((a) => a.name + "=" + a.value.slice(0, 80)),
        })),
    }
})
console.log(JSON.stringify(out, null, 2))
await browser.close()
