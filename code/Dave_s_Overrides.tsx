import { forwardRef, useEffect, useLayoutEffect, useRef, type ComponentType } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"
import { randomColor } from "https://framer.com/m/framer/utils.js@^0.9.0"
import { RenderTarget } from "framer"

// Learn more: https://www.framer.com/developers/overrides/

const useStore = createStore({
    background: "#0099FF",
})

export function withRotate(Component): ComponentType {
    return forwardRef((props, ref) => {
        return (
            <Component
                ref={ref}
                {...props}
                animate={{ rotate: 90 }}
                transition={{ duration: 2 }}
            />
        )
    })
}

export function withHover(Component): ComponentType {
    return forwardRef((props, ref) => {
        return <Component ref={ref} {...props} whileHover={{ scale: 1.05 }} />
    })
}

export function withRandomColor(Component): ComponentType {
    return forwardRef((props, ref) => {
        const [store, setStore] = useStore()

        return (
            <Component
                ref={ref}
                {...props}
                animate={{
                    background: store.background,
                }}
                onClick={() => {
                    setStore({ background: randomColor() })
                }}
            />
        )
    })
}

/*copy email*/
export function withCopyEmail(Component): ComponentType {
    return (props) => {
        return (
            <Component
                {...props}
                onClick={() => {
                    navigator.clipboard.writeText("orian.dave@gmail.com")
                }}
            />
        )
    }
}

/**
 * Section scroll spy
 *
 * Apply as a code override on the "Section Nav" frame of the home-redesign
 * page. It watches the page's scroll sections and highlights the nav link that
 * matches whichever section is currently in view — whether the visitor got
 * there by clicking a nav link or by scrolling manually.
 *
 * Each nav link is matched to a section either by the "#<elementId>" hash in
 * its href or, as a fallback, by its lowercased label text.
 *
 * Colors are applied with a stylesheet (not inline !important) so:
 * - default / :visited stay gray on first paint
 * - :hover and :active are white
 * - the current section is white via data-section-active
 */
const SCROLL_SPY_SECTION_IDS = [
    "intro",
    "work",
    "values",
    "background",
    "contact",
]
const SCROLL_SPY_ACTIVE = "rgb(0, 0, 0)"
const SCROLL_SPY_INACTIVE = "rgb(82, 82, 82)"
const SECTION_NAV_STYLE_ID = "section-nav-link-style"
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

const ensureSectionNavLinkStyles = () => {
    if (typeof document === "undefined") return
    let style = document.getElementById(
        SECTION_NAV_STYLE_ID
    ) as HTMLStyleElement | null
    if (!style) {
        style = document.createElement("style")
        style.id = SECTION_NAV_STYLE_ID
        document.head.appendChild(style)
    }
    style.textContent = `
[data-framer-name="Section Nav"] a,
[data-framer-name="Section Nav"] a:link,
[data-framer-name="Section Nav"] a:visited,
[data-framer-name="Section Nav"] a *,
[data-framer-name="Section Links"] a,
[data-framer-name="Section Links"] a:link,
[data-framer-name="Section Links"] a:visited,
[data-framer-name="Section Links"] a * {
    color: ${SCROLL_SPY_INACTIVE} !important;
    font-weight: 500 !important;
    transition: color 0.25s ease, font-weight 0.25s ease;
}
[data-framer-name="Section Nav"] a:hover,
[data-framer-name="Section Nav"] a:hover *,
[data-framer-name="Section Nav"] a:active,
[data-framer-name="Section Nav"] a:active *,
[data-framer-name="Section Nav"] a[data-section-active="true"],
[data-framer-name="Section Nav"] a[data-section-active="true"] *,
[data-framer-name="Section Links"] a:hover,
[data-framer-name="Section Links"] a:hover *,
[data-framer-name="Section Links"] a:active,
[data-framer-name="Section Links"] a:active *,
[data-framer-name="Section Links"] a[data-section-active="true"],
[data-framer-name="Section Links"] a[data-section-active="true"] * {
    color: ${SCROLL_SPY_ACTIVE} !important;
    font-weight: 600 !important;
}
[data-framer-name="Section Nav"] [data-framer-name="Dave Orian Brand"] {
    opacity: 0 !important;
    transition: opacity 0.3s cubic-bezier(0.44, 0, 0.56, 1) !important;
}
[data-framer-name="Section Nav"][data-home-brand-visible="true"] [data-framer-name="Dave Orian Brand"] {
    opacity: 1 !important;
}
`
}


/**
 * Contact Links footer fade
 *
 * Apply on the home page "Contact Links" fixed bar. Fades to 0 as Footer - 2
 * scrolls up into the bar's zone inside the Home Scroll container.
 */
export function withContactLinksFooterFade(Component): ComponentType {
    return forwardRef((props, ref) => {
        const containerRef = useRef<HTMLElement | null>(null)

        const assignRef = (node: HTMLElement | null) => {
            containerRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref)
                (ref as { current: HTMLElement | null }).current = node
        }

        useEffect(() => {
            if (RenderTarget.current() === RenderTarget.canvas) return
            if (
                typeof window === "undefined" ||
                typeof document === "undefined"
            )
                return

            const contact = containerRef.current
            if (!contact) return

            contact.style.transition = "opacity 0.35s ease"
            contact.style.willChange = "opacity"

            const getScrollRoot = () =>
                (document.getElementById("home-scroll") ||
                    document.querySelector(
                        '[data-framer-name="Home Scroll"]'
                    )) as HTMLElement | null

            const getFooter = (root: HTMLElement | null) => {
                if (!root) return null
                return (
                    (root.querySelector("footer") as HTMLElement | null) ||
                    (root.querySelector(
                        '[data-framer-name="Footer - 2"]'
                    ) as HTMLElement | null)
                )
            }

            let rafId = 0
            const update = () => {
                rafId = 0
                const footer = getFooter(getScrollRoot())
                if (!footer) {
                    contact.style.opacity = "1"
                    contact.style.pointerEvents = "auto"
                    return
                }

                const contactRect = contact.getBoundingClientRect()
                const footerRect = footer.getBoundingClientRect()
                const fadeEnd = contactRect.top
                const fadeStart = contactRect.bottom + 496
                const opacity = Math.max(
                    0,
                    Math.min(1, (footerRect.top - fadeEnd) / (fadeStart - fadeEnd))
                )

                contact.style.opacity = String(opacity)
                contact.style.pointerEvents = opacity < 0.05 ? "none" : "auto"
            }

            const onScroll = () => {
                if (rafId) return
                rafId = window.requestAnimationFrame(update)
            }

            update()
            const settleTimer = window.setTimeout(update, 500)
            const scrollRoot = getScrollRoot()
            scrollRoot?.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onScroll)

            return () => {
                if (rafId) window.cancelAnimationFrame(rafId)
                window.clearTimeout(settleTimer)
                scrollRoot?.removeEventListener("scroll", onScroll)
                window.removeEventListener("scroll", onScroll)
                window.removeEventListener("resize", onScroll)
                contact.style.removeProperty("opacity")
                contact.style.removeProperty("pointer-events")
                contact.style.removeProperty("transition")
                contact.style.removeProperty("will-change")
            }
        }, [])

        return <Component ref={assignRef} {...props} />
    })
}

export function withSectionScrollSpy(Component): ComponentType {
    return forwardRef((props, ref) => {
        const containerRef = useRef<HTMLElement | null>(null)

        const assignRef = (node: HTMLElement | null) => {
            containerRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref)
                (ref as { current: HTMLElement | null }).current = node
        }

        if (typeof document !== "undefined") ensureSectionNavLinkStyles()

        useEffect(() => {
            if (RenderTarget.current() === RenderTarget.canvas) return
            if (
                typeof window === "undefined" ||
                typeof document === "undefined"
            )
                return

            ensureSectionNavLinkStyles()

            const container = containerRef.current
            if (!container) return

            const anchors = Array.from(
                container.querySelectorAll("a")
            ) as HTMLAnchorElement[]

            const entries = SCROLL_SPY_SECTION_IDS.map((id) => {
                const link =
                    anchors.find((a) =>
                        (a.getAttribute("href") || "").includes("#" + id)
                    ) ||
                    anchors.find(
                        (a) =>
                            (a.textContent || "").trim().toLowerCase() === id
                    ) ||
                    null
                return { id, link }
            })

            if (entries.every((entry) => !entry.link)) return

            const paint = (activeId: string) => {
                for (const { id, link } of entries) {
                    if (!link) continue
                    link.setAttribute(
                        "data-section-active",
                        id === activeId ? "true" : "false"
                    )
                    const targets = [
                        link,
                        ...Array.from(link.querySelectorAll("*")),
                    ] as HTMLElement[]
                    for (const el of targets) {
                        el.style.removeProperty("color")
                    }
                }
            }

            const getScrollRoot = () =>
                (document.getElementById("home-scroll") ||
                    document.querySelector(
                        '[data-framer-name="Home Scroll"]'
                    )) as HTMLElement | null

            const resolveSectionEl = (id: string) => {
                const root = getScrollRoot()
                const scope = root ?? document
                const targetId = SECTION_HASH_IDS[id] || id
                const byId = scope.querySelector(
                    `#${targetId}`
                ) as HTMLElement | null
                if (byId) return byId
                if (id === "background") {
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
                const name = SECTION_ALIGN_NAMES[id]
                const named = name
                    ? (scope.querySelector(
                          `[data-framer-name="${name}"]`
                      ) as HTMLElement | null)
                    : null
                if (named) return named
                return document.getElementById(targetId)
            }

            const resolveActiveId = (): string => {
                const root = getScrollRoot()
                const scrollY = root ? root.scrollTop : window.scrollY
                const viewH = root ? root.clientHeight : window.innerHeight
                const scrollHeight = root
                    ? root.scrollHeight
                    : document.documentElement.scrollHeight
                const nav = (document.querySelector(
                    '[data-framer-name="Section Nav"]'
                ) ||
                    container) as HTMLElement | null
                const lineY = nav
                    ? nav.getBoundingClientRect().bottom
                    : root
                      ? root.getBoundingClientRect().top
                      : 0
                // Order sections by their real vertical position on the page
                // rather than by DOM order, so this keeps working even if the
                // section frames are not in visual order in the tree.
                const trackable = entries.filter((entry) => entry.link)
                const positioned = trackable
                    .map(({ id }) => {
                        const section = resolveSectionEl(id)
                        if (!section) return null
                        return {
                            id,
                            top: section.getBoundingClientRect().top,
                        }
                    })
                    .filter(
                        (item): item is { id: string; top: number } =>
                            item !== null
                    )
                    .sort((a, b) => a.top - b.top)

                if (positioned.length === 0) return "work"

                const atBottom = viewH + scrollY >= scrollHeight - 4
                if (atBottom) return positioned[positioned.length - 1].id

                if (scrollY <= 4) return positioned[0].id

                let activeId = positioned[0].id
                for (const item of positioned) {
                    if (item.top <= lineY + 1) activeId = item.id
                }
                return activeId
            }

            const paintHomeBrand = () => {
                const root = getScrollRoot()
                const hero =
                    (document.getElementById("hero-wordmark") as
                        | HTMLElement
                        | null) ||
                    (root?.querySelector(
                        '[data-framer-name="hi, i\'m dave"]'
                    ) as HTMLElement | null) ||
                    resolveSectionEl("intro")
                if (!hero) return
                const rootTop = root ? root.getBoundingClientRect().top : 0
                const visible =
                    hero.getBoundingClientRect().bottom < rootTop + 12
                container.setAttribute(
                    "data-home-brand-visible",
                    visible ? "true" : "false"
                )
            }

            let rafId = 0
            const update = () => {
                rafId = 0
                paint(resolveActiveId())
                paintHomeBrand()
            }
            const onScroll = () => {
                if (rafId) return
                rafId = window.requestAnimationFrame(update)
            }

            update()
            const settleTimer = window.setTimeout(update, 500)
            const scrollRoot = getScrollRoot()
            scrollRoot?.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onScroll)
            window.addEventListener("hashchange", update)

            const clickCleanups = entries.map(() => () => {})

            return () => {
                if (rafId) window.cancelAnimationFrame(rafId)
                window.clearTimeout(settleTimer)
                scrollRoot?.removeEventListener("scroll", onScroll)
                window.removeEventListener("scroll", onScroll)
                window.removeEventListener("resize", onScroll)
                window.removeEventListener("hashchange", update)
                container.removeAttribute("data-home-brand-visible")
                for (const cleanup of clickCleanups) cleanup()
            }
        }, [])

        return <Component ref={assignRef} {...props} />
    })
}



/**
 * Left column fade
 *
 * Apply on the home/test left column frame. Fades the hero copy and section
 * links out once scroll passes the Background section, and back in when
 * scrolling above it again.
 */
export function withLeftColumnScrollFade(Component): ComponentType {
    return forwardRef((props, ref) => {
        const containerRef = useRef<HTMLElement | null>(null)

        const assignRef = (node: HTMLElement | null) => {
            containerRef.current = node
            if (typeof ref === "function") ref(node)
            else if (ref)
                (ref as { current: HTMLElement | null }).current = node
        }

        useEffect(() => {
            if (RenderTarget.current() === RenderTarget.canvas) return
            if (
                typeof window === "undefined" ||
                typeof document === "undefined"
            )
                return

            const container = containerRef.current
            if (!container) return

            container.style.transition = "opacity 0.35s ease"
            container.style.willChange = "opacity"

            const getScrollRoot = () =>
                (document.getElementById("home-scroll") ||
                    document.querySelector(
                        '[data-framer-name="Home Scroll"]'
                    )) as HTMLElement | null

            const getBackgroundSection = (root: HTMLElement | null) => {
                if (!root) return null
                return (
                    (root.querySelector(
                        '[data-framer-name="Background"]'
                    ) as HTMLElement | null) ||
                    (document.getElementById(
                        "background-content"
                    ) as HTMLElement | null)
                )
            }

            let rafId = 0
            const update = () => {
                rafId = 0
                const root = getScrollRoot()
                const background = getBackgroundSection(root)
                if (!background) {
                    container.style.opacity = "1"
                    container.style.pointerEvents = "auto"
                    return
                }

                const rootTop = root
                    ? root.getBoundingClientRect().top
                    : 0
                const passedBackground =
                    background.getBoundingClientRect().bottom < rootTop + 1
                const opacity = passedBackground ? 0 : 1

                container.style.opacity = String(opacity)
                container.style.pointerEvents =
                    opacity < 0.05 ? "none" : "auto"
            }

            const onScroll = () => {
                if (rafId) return
                rafId = window.requestAnimationFrame(update)
            }

            update()
            const settleTimer = window.setTimeout(update, 500)
            const scrollRoot = getScrollRoot()
            scrollRoot?.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("scroll", onScroll, { passive: true })
            window.addEventListener("resize", onScroll)

            return () => {
                if (rafId) window.cancelAnimationFrame(rafId)
                window.clearTimeout(settleTimer)
                scrollRoot?.removeEventListener("scroll", onScroll)
                window.removeEventListener("scroll", onScroll)
                window.removeEventListener("resize", onScroll)
                container.style.removeProperty("opacity")
                container.style.removeProperty("pointer-events")
                container.style.removeProperty("transition")
                container.style.removeProperty("will-change")
            }
        }, [])

        return <Component ref={assignRef} {...props} />
    })
}
