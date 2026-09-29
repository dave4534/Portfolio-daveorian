import { forwardRef, type ComponentType } from "react"
import { createStore } from "https://framer.com/m/framer/store.js@^1.0.0"
import { randomColor } from "https://framer.com/m/framer/utils.js@^0.9.0"

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

/*Capacity Planning Project Card Gradient*/
import type { ComponentType } from "react"

export function GradientBackground(Component): ComponentType {
    return ({ style, ...props }) => {
        return (
            <Component
                {...props}
                style={{
                    ...style,
                    background:
                        "linear-gradient(45deg, #8ec5fc 0.000%, #8dd3ff 25.000%, #a1d8ff 50.000%, #c1d2ff 75.000%, #e0c3ff 100.000%)",
                }}
            />
        )
    }
}
