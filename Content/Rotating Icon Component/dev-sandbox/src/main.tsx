import * as React from "react"
import { createRoot } from "react-dom/client"
import RotatingIcon from "./RotatingIcon"

// Matches the reference icon's own canvas size (danield.design/case-studies/clocks
// renders its icon in a 96x96 CSS px canvas) so this preview shows the puck at a
// directly comparable size, not blown up for visibility.
const PREVIEW_SIZE = 96

function Preview() {
  // No prop overrides on purpose — this renders exactly what someone dropping
  // the component in with its defaults will see.
  return (
    <div style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}>
      <RotatingIcon />
    </div>
  )
}

createRoot(document.getElementById("root")!).render(<Preview />)
