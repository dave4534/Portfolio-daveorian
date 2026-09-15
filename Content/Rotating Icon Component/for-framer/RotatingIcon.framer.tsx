/**
 * Framer Code Component wrapper for RotatingIcon.
 *
 * HOW TO USE IN FRAMER:
 * 1. In your Framer project, add three code files (Assets panel → Code → "+"):
 *      - RotatingIcon.tsx        (paste the contents of src/RotatingIcon.tsx)
 *      - logos.ts                (paste the contents of logos.ts)
 *      - RotatingIcon.framer.tsx (paste THIS file's contents)
 * 2. Add dependencies via the Code panel's package manager (or the "Packages"
 *    tab, depending on your Framer version): three, @react-three/fiber
 *    — same versions as package.json in this handoff folder.
 * 3. Drag the "RotatingIcon" component from the Assets/Insert panel onto the
 *    canvas. It lands at 96x96 — the reference icon's real size (see the
 *    annotations below). Property controls show up in the right-hand panel.
 *
 * This file is a thin wrapper: it adds Framer's property controls and size
 * annotations on top of the framework-agnostic component in RotatingIcon.tsx,
 * and intentionally duplicates no rendering logic, so fixes only happen once.
 *
 * The @framerIntrinsicWidth/Height annotations below are the reason this file
 * wraps the component in a function instead of just re-exporting it: Framer
 * reads those annotations off the component declared in this file. Without
 * them Framer drops the component in at its own default frame size (200x200),
 * which renders the puck roughly twice the size it is on the reference site —
 * the component fills whatever box Framer gives it, so the frame size is what
 * decides the puck's on-screen size.
 *
 * @framerIntrinsicWidth 96
 * @framerIntrinsicHeight 96
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
import { addPropertyControls, ControlType } from "framer"
import RotatingIcon, { RotatingIconProps } from "./RotatingIcon"

export default function RotatingIconFramer(props: RotatingIconProps) {
  return <RotatingIcon {...props} />
}

addPropertyControls(RotatingIconFramer, {
  imageUrl: {
    type: ControlType.Image,
    title: "Custom Artwork",
  },
  logoBackgroundColor: {
    type: ControlType.Color,
    title: "Logo Background",
    defaultValue: "#EDEDED",
    hidden: (props) => !props.imageUrl,
  },
  logoPadding: {
    type: ControlType.Number,
    title: "Logo Padding",
    min: 0,
    max: 0.4,
    step: 0.01,
    defaultValue: 0.16,
    hidden: (props) => !props.imageUrl,
  },
  colorA: { type: ControlType.Color, title: "Gradient A", defaultValue: "#8B5CF6" },
  colorB: { type: ControlType.Color, title: "Gradient B", defaultValue: "#EC4899" },
  colorC: { type: ControlType.Color, title: "Gradient C", defaultValue: "#38BDF8" },
  iconColor: { type: ControlType.Color, title: "Glyph Color", defaultValue: "#FFFFFF" },
  edgeColor: { type: ControlType.Color, title: "Edge Color", defaultValue: "#F5F5F7" },
  cornerRadius: {
    type: ControlType.Number,
    title: "Corner Radius",
    min: 0,
    max: 0.85,
    step: 0.01,
    defaultValue: 0.55,
  },
  thickness: {
    type: ControlType.Number,
    title: "Thickness",
    min: 0.05,
    max: 1,
    step: 0.01,
    defaultValue: 0.1785,
    description: "Half the reference's own proportion (which was 0.357, 21% of the face width), per request.",
  },
  dragSensitivity: {
    type: ControlType.Number,
    title: "Drag Sensitivity",
    min: 0.002,
    max: 0.08,
    step: 0.001,
    defaultValue: 0.025,
    description: "Radians per pixel dragged.",
  },
  damping: {
    type: ControlType.Number,
    title: "Drag Smoothing",
    min: 0.02,
    max: 1,
    step: 0.01,
    defaultValue: 0.18,
  },
  flickDecay: {
    type: ControlType.Number,
    title: "Flick Momentum",
    min: 0,
    max: 3,
    step: 0.05,
    defaultValue: 0.6,
    description: "Seconds of coasting after you let go. 0 stops dead.",
  },
  autoRotate: { type: ControlType.Boolean, title: "Auto Rotate", defaultValue: true },
  autoRotateSpeed: {
    type: ControlType.Number,
    title: "Auto Rotate Speed",
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 0.5,
    description: "Radians/second. The reference turns at 0.5 and never stops.",
    hidden: (props) => !props.autoRotate,
  },
  introSpinSpeed: {
    type: ControlType.Number,
    title: "Intro Spin",
    min: 0,
    max: 15,
    step: 0.1,
    defaultValue: 6.9,
    description: "Extra rad/s on load, decaying into the steady rate. 0 disables.",
  },
  introSpinDecay: {
    type: ControlType.Number,
    title: "Intro Spin Decay",
    min: 0.1,
    max: 6,
    step: 0.1,
    defaultValue: 1.6,
    description: "Seconds for the intro burst to fade to ~37%.",
    hidden: (props) => !props.introSpinSpeed,
  },
})
