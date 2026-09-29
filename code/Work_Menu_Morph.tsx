import {
    forwardRef,
    useCallback,
    useEffect,
    useRef,
    useState,
    type ComponentType,
    type CSSProperties,
    type MouseEvent as ReactMouseEvent,
} from "react"

type WorkMenuProps = {
    style?: CSSProperties
    onClick?: (event: ReactMouseEvent) => void
    [key: string]: unknown
}

const STYLE_ID = "work-menu-morph-style"

const ensureStyles = () => {
    if (typeof document === "undefined") return
    let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
    if (!style) {
        style = document.createElement("style")
        style.id = STYLE_ID
        document.head.appendChild(style)
    }
    style.textContent = `
[data-framer-name="Work Menu"] {
    top: calc(100% + 4px) !important;
    transform: none !important;
    translate: 0 !important;
    scale: none !important;
    transition: none !important;
}
[data-sw-open="false"] [data-framer-name="Work Menu"] {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
}
[data-sw-open="true"] [data-framer-name="Work Menu"] {
    opacity: 1 !important;
    visibility: visible !important;
    pointer-events: auto !important;
}
[data-framer-name="Trigger"] {
    pointer-events: auto !important;
    transition: background-color 0.15s !important;
}
[data-sw-open]:hover [data-framer-name="Trigger"],
[data-framer-theme="light"] [data-framer-name="Trigger"]:hover,
[data-framer-theme="light"] [data-framer-name="Trigger"]:active,
[data-framer-theme="light"] [data-sw-open="true"] [data-framer-name="Trigger"] {
    background-color: rgb(245, 245, 245) !important;
}
[data-framer-theme="dark"] [data-sw-open]:hover [data-framer-name="Trigger"],
[data-framer-theme="dark"] [data-framer-name="Trigger"]:hover,
[data-framer-theme="dark"] [data-framer-name="Trigger"]:active,
[data-framer-theme="dark"] [data-sw-open="true"] [data-framer-name="Trigger"],
:root:not([data-framer-theme="light"]) [data-sw-open]:hover [data-framer-name="Trigger"],
:root:not([data-framer-theme="light"]) [data-framer-name="Trigger"]:hover,
:root:not([data-framer-theme="light"]) [data-framer-name="Trigger"]:active,
:root:not([data-framer-theme="light"]) [data-sw-open="true"] [data-framer-name="Trigger"] {
    background-color: rgba(255, 255, 255, 0.08) !important;
}
[data-framer-theme="light"] [data-sw-open]:hover [data-framer-name="Trigger"] {
    background-color: rgb(245, 245, 245) !important;
}
[data-framer-name="Work Menu"] [data-framer-name="Data Capture"],
[data-framer-name="Work Menu"] [data-framer-name="Capacity Planning"],
[data-framer-name="Work Menu"] [data-framer-name="Customer View"],
[data-framer-name="Work Menu"] [data-framer-name="Seller Coupons"] {
    transform: none !important;
    background-color: transparent !important;
    transition: background-color 0.15s !important;
    height: 40px !important;
    min-height: 40px !important;
    max-height: 40px !important;
    padding: 8px 5px 8px 10px !important;
    box-sizing: border-box !important;
}
[data-framer-name="Work Menu"] [data-framer-name="Label"] {
    font-size: 16px !important;
    line-height: 24px !important;
}
[data-framer-name="Work Menu"] [data-framer-name="Logo"],
[data-framer-name="Drawer"] [data-framer-name="Logo"] {
    flex: none !important;
    width: 40px !important;
    height: 40px !important;
    transform: scale(0.6) !important;
    transform-origin: left center !important;
    margin-right: -16px !important;
    margin-top: -8px !important;
    margin-bottom: -8px !important;
}
[data-framer-theme="light"] [data-framer-name="Work Menu"] [data-framer-name="Data Capture"]:hover,
[data-framer-theme="light"] [data-framer-name="Work Menu"] [data-framer-name="Capacity Planning"]:hover,
[data-framer-theme="light"] [data-framer-name="Work Menu"] [data-framer-name="Customer View"]:hover,
[data-framer-theme="light"] [data-framer-name="Work Menu"] [data-framer-name="Seller Coupons"]:hover {
    background-color: rgb(245, 245, 245) !important;
}
[data-framer-theme="dark"] [data-framer-name="Work Menu"] [data-framer-name="Data Capture"]:hover,
[data-framer-theme="dark"] [data-framer-name="Work Menu"] [data-framer-name="Capacity Planning"]:hover,
[data-framer-theme="dark"] [data-framer-name="Work Menu"] [data-framer-name="Customer View"]:hover,
[data-framer-theme="dark"] [data-framer-name="Work Menu"] [data-framer-name="Seller Coupons"]:hover,
:root:not([data-framer-theme="light"]) [data-framer-name="Work Menu"] [data-framer-name="Data Capture"]:hover,
:root:not([data-framer-theme="light"]) [data-framer-name="Work Menu"] [data-framer-name="Capacity Planning"]:hover,
:root:not([data-framer-theme="light"]) [data-framer-name="Work Menu"] [data-framer-name="Customer View"]:hover,
:root:not([data-framer-theme="light"]) [data-framer-name="Work Menu"] [data-framer-name="Seller Coupons"]:hover {
    background-color: rgba(255, 255, 255, 0.08) !important;
}
[data-sw-open="true"] [data-framer-name="Chevron"] {
    transform: rotate(180deg) !important;
    transform-origin: center !important;
}
`
}

/**
 * Opens the Selected work menu with React state so it works in Framer Preview.
 */
export function withWorkMenuMorph(
    Component: ComponentType<WorkMenuProps>
): ComponentType<WorkMenuProps> {
    return forwardRef((props: WorkMenuProps, ref) => {
        const [open, setOpen] = useState(false)
        const rootRef = useRef<HTMLDivElement>(null)

        useEffect(() => {
            ensureStyles()
        }, [])

        useEffect(() => {
            if (!open) return
            const onPointerDown = (event: PointerEvent) => {
                const target = event.target as Node | null
                const inside = Boolean(
                    target && rootRef.current?.contains(target)
                )
                if (!inside) setOpen(false)
            }
            document.addEventListener("pointerdown", onPointerDown)
            return () => {
                document.removeEventListener("pointerdown", onPointerDown)
            }
        }, [open])

        const style: CSSProperties = {
            ...(props.style || {}),
            overflow: "visible",
        }

        const onRootClick = useCallback(
            (event: ReactMouseEvent<HTMLDivElement>) => {
                const target = event.target as HTMLElement | null
                const trigger = target?.closest(
                    '[data-framer-name="Trigger"]'
                ) as HTMLElement | null
                const link = target?.closest("a")
                if (link && !trigger) {
                    return
                }
                if (trigger) {
                    setOpen((current) => !current)
                }
                props.onClick?.(event)
            },
            [props]
        )

        return (
            <div
                ref={rootRef}
                data-sw-open={open ? "true" : "false"}
                onClick={onRootClick}
                style={{
                    position: "relative",
                    width: "max-content",
                    height: "auto",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                }}
            >
                <Component
                    ref={ref}
                    {...props}
                    style={style}
                />
            </div>
        )
    })
}
