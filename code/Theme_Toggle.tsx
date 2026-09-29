import type { ComponentType } from "react"
import React, { useEffect } from "react"

type HomeFrameProps = {
    [key: string]: unknown
}

const PHONE_QUERY = "(max-width: 809.98px)"
const FRAME_COLOR = "rgb(86, 84, 215)"
const FRAME_SIZE = "20px"
const FRAME_SIZE_PHONE = "0px"

const HOME_FRAME_INLINE_PROPS = [
    "overflow",
    "overflow-x",
    "overflow-y",
    "scrollbar-width",
    "height",
    "max-height",
    "position",
    "top",
    "right",
    "bottom",
    "left",
    "width",
    "max-width",
] as const

const clearHomeFrameInlineStyles = (node: HTMLElement) => {
    for (const prop of HOME_FRAME_INLINE_PROPS) {
        node.style.removeProperty(prop)
    }
}

const releaseHomePageFrameDocumentLocks = () => {
    if (typeof document === "undefined") return
    document.getElementById("home-page-frame-styles")?.remove()
    ;[
        "home-frame-top",
        "home-frame-bottom",
        "home-frame-left",
        "home-frame-right",
    ].forEach((id) => document.getElementById(id)?.remove())
    clearHomeFrameInlineStyles(document.documentElement)
    clearHomeFrameInlineStyles(document.body)
}

export function homePageFrame(
    Component: ComponentType<HomeFrameProps>
): ComponentType<HomeFrameProps> {
    return (props) => {
        useEffect(() => {
            if (typeof document === "undefined") return

            const styleId = "home-page-frame-styles"
            let style = document.getElementById(styleId) as HTMLStyleElement | null
            if (!style) {
                style = document.createElement("style")
                style.id = styleId
                document.head.appendChild(style)
            }

            style.textContent = `
html {
    --home-frame-size: ${FRAME_SIZE};
}
@media ${PHONE_QUERY} {
    html {
        --home-frame-size: ${FRAME_SIZE_PHONE};
    }
    .home-frame-bar {
        display: none;
    }
}
html, body {
    overflow: hidden !important;
    height: 100% !important;
    max-height: 100vh !important;
    overscroll-behavior: none;
    background: #ffffff;
    scrollbar-width: none !important;
}
html::-webkit-scrollbar,
body::-webkit-scrollbar {
    display: none !important;
    width: 0 !important;
    height: 0 !important;
}
#home-scroll,
[data-framer-name="Home Scroll"] {
    position: fixed !important;
    top: var(--home-frame-size) !important;
    right: var(--home-frame-size) !important;
    bottom: var(--home-frame-size) !important;
    left: var(--home-frame-size) !important;
    width: auto !important;
    height: unset !important;
    max-width: none !important;
    max-height: none !important;
    overflow-x: clip !important;
    overscroll-behavior-x: none !important;
    touch-action: pan-y !important;
    overflow-y: auto !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
    z-index: 1 !important;
    scrollbar-gutter: stable;
}
#home-scroll::-webkit-scrollbar,
[data-framer-name="Home Scroll"]::-webkit-scrollbar {
    width: 8px;
    height: 8px;
    background: transparent;
}
#home-scroll::-webkit-scrollbar-track,
[data-framer-name="Home Scroll"]::-webkit-scrollbar-track,
#home-scroll::-webkit-scrollbar-corner,
[data-framer-name="Home Scroll"]::-webkit-scrollbar-corner {
    background: transparent;
}
#home-scroll::-webkit-scrollbar-thumb,
[data-framer-name="Home Scroll"]::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.25);
    border-radius: 99px;
    border: 2px solid transparent;
    background-clip: padding-box;
}
#home-scroll,
[data-framer-name="Home Scroll"] {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.25) transparent;
}
.home-frame-bar {
    position: fixed;
    background: ${FRAME_COLOR};
    z-index: 2147483000;
    pointer-events: none;
}
#home-frame-top { top: 0; left: 0; right: 0; height: var(--home-frame-size); }
#home-frame-bottom { bottom: 0; left: 0; right: 0; height: var(--home-frame-size); }
#home-frame-left { top: 0; bottom: 0; left: 0; width: var(--home-frame-size); }
#home-frame-right { top: 0; bottom: 0; right: 0; width: var(--home-frame-size); }
`

            const barIds = [
                "home-frame-top",
                "home-frame-bottom",
                "home-frame-left",
                "home-frame-right",
            ]
            barIds.forEach((id) => {
                if (document.getElementById(id)) return
                const bar = document.createElement("div")
                bar.id = id
                bar.className = "home-frame-bar"
                document.body.appendChild(bar)
            })

            const getHomeScroll = () =>
                (document.getElementById("home-scroll") ||
                    document.querySelector(
                        '[data-framer-name="Home Scroll"]'
                    )) as HTMLElement | null

            const lockedNodes = new Set<HTMLElement>()

            const lockOuterScrollers = (home: HTMLElement) => {
                const lock = (node: HTMLElement) => {
                    if (node === home || home.contains(node)) return
                    node.style.setProperty("overflow", "hidden", "important")
                    node.style.setProperty("overflow-x", "hidden", "important")
                    node.style.setProperty("overflow-y", "hidden", "important")
                    node.style.setProperty("scrollbar-width", "none", "important")
                    lockedNodes.add(node)
                }

                lock(document.documentElement)
                lock(document.body)
                document.documentElement.style.setProperty("height", "100%", "important")
                document.body.style.setProperty("height", "100%", "important")
                document.documentElement.style.setProperty("max-height", "100vh", "important")
                document.body.style.setProperty("max-height", "100vh", "important")

                let parent = home.parentElement
                while (parent) {
                    lock(parent)
                    parent.style.setProperty("height", "100%", "important")
                    parent.style.setProperty("max-height", "100vh", "important")
                    lockedNodes.add(parent)
                    parent = parent.parentElement
                }

                const all = Array.from(document.querySelectorAll("body *")) as HTMLElement[]
                for (const node of all) {
                    if (node === home || home.contains(node)) continue
                    const cs = getComputedStyle(node)
                    const canScroll =
                        (cs.overflowY === "auto" ||
                            cs.overflowY === "scroll" ||
                            cs.overflow === "auto" ||
                            cs.overflow === "scroll") &&
                        node.scrollHeight > node.clientHeight + 4
                    if (canScroll) lock(node)
                }
            }

            const apply = () => {
                const el = getHomeScroll()
                if (!el) return false
                lockOuterScrollers(el)
                el.style.setProperty("position", "fixed", "important")
                el.style.setProperty("top", "var(--home-frame-size)", "important")
                el.style.setProperty("right", "var(--home-frame-size)", "important")
                el.style.setProperty("bottom", "var(--home-frame-size)", "important")
                el.style.setProperty("left", "var(--home-frame-size)", "important")
                el.style.setProperty("width", "auto", "important")
                el.style.setProperty("height", "unset", "important")
                el.style.setProperty("overflow-x", "clip", "important")
                el.style.setProperty("overflow-y", "auto", "important")
                el.style.setProperty("overscroll-behavior-x", "none", "important")
                el.style.setProperty("touch-action", "pan-y", "important")
                return true
            }

            const onWheel = (event: WheelEvent) => {
                const el = getHomeScroll()
                if (!el) return
                if (el.contains(event.target as Node)) return
                el.scrollTop += event.deltaY
            }


            const getNavAlignY = () => {
                const nav = getSectionNav()
                if (nav) return nav.getBoundingClientRect().top
                const el = getHomeScroll()
                return el ? el.getBoundingClientRect().top : 0
            }

            let pendingScroll: number | null = null

            const getSectionNav = () =>
                document.querySelector(
                    '[data-framer-name="Section Nav"]'
                ) as HTMLElement | null

            const SECTION_HASH_IDS: Record<string, string> = {
                intro: "hero-wordmark",
                background: "background",
                work: "work",
                values: "values",
                contact: "contact",
            }
            const SECTION_ALIGN_NAMES: Record<string, string> = {
                intro: "Hero",
                background: "Fortunate Paragraph",
                work: "Work Header",
                values: "How I Work Text",
                contact: "Footer - 2",
            }

            const resolveSectionEl = (hash: string) => {
                const root = getHomeScroll()
                const scope = root ?? document
                const targetId = SECTION_HASH_IDS[hash] || hash
                const byId = scope.querySelector(
                    `#${targetId}`
                ) as HTMLElement | null
                if (byId) return byId
                if (hash === "background") {
                    const paragraphs = Array.from(
                        scope.querySelectorAll(
                            '[data-framer-name="Fortunate Paragraph"]'
                        )
                    ) as HTMLElement[]
                    const fortunate = paragraphs.find((node) =>
                        (node.textContent || "").includes("fortunate")
                    )
                    if (fortunate) return fortunate
                }
                const name = SECTION_ALIGN_NAMES[hash]
                const named = name
                    ? (scope.querySelector(
                          `[data-framer-name="${name}"]`
                      ) as HTMLElement | null)
                    : null
                if (named) return named
                return document.getElementById(targetId) as HTMLElement | null
            }

            const scrollSectionToNav = (
                hash: string,
                behavior: ScrollBehavior = "smooth"
            ) => {
                const el = getHomeScroll()
                if (!el) return
                if (pendingScroll !== null) {
                    cancelAnimationFrame(pendingScroll)
                    pendingScroll = null
                }
                const alignTop = getNavAlignY()
                let nextTop: number
                if (hash === "contact") {
                    nextTop = Math.max(0, el.scrollHeight - el.clientHeight)
                } else {
                    const section = resolveSectionEl(hash)
                    if (!section) return
                    nextTop = Math.max(
                        0,
                        section.getBoundingClientRect().top -
                            alignTop +
                            el.scrollTop
                    )
                }
                el.scrollTo({ top: nextTop, behavior })
            }

            const onHashClick = (event: MouseEvent) => {
                const target = event.target as HTMLElement | null
                const anchor = target?.closest("a")
                if (!anchor) return
                const href = anchor.getAttribute("href") || ""
                const hash = href.includes("#") ? href.split("#").pop() : ""
                if (!hash) return
                const el = getHomeScroll()
                if (!resolveSectionEl(hash) || !el) return
                event.preventDefault()
                event.stopPropagation()
                if (window.location.hash !== "#" + hash) {
                    history.pushState(null, "", "#" + hash)
                }
                scrollSectionToNav(hash)
            }

            apply()
            window.addEventListener("wheel", onWheel, { passive: true })
            document.addEventListener("click", onHashClick, true)
            const hash = window.location.hash.replace(/^#/, "")
            if (hash) window.requestAnimationFrame(() => scrollSectionToNav(hash, "auto"))
            const interval = 0 /* apply once; interval caused scroll fights */

            return () => {
                window.clearInterval(interval)
                window.removeEventListener("wheel", onWheel)
                document.removeEventListener("click", onHashClick, true)
                const home = getHomeScroll()
                if (home) clearHomeFrameInlineStyles(home)
                for (const node of lockedNodes) {
                    clearHomeFrameInlineStyles(node)
                }
                lockedNodes.clear()
                releaseHomePageFrameDocumentLocks()
            }
        }, [])

        return <Component {...props} />
    }
}
