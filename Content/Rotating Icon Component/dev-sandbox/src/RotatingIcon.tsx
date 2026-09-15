/**
 * RotatingIcon
 * ------------
 * A draggable, physically-lit 3D "app icon puck" built with react-three-fiber.
 * Reverse-engineered from the interaction pattern on danield.design/case-studies/clocks
 * (a <canvas data-engine="three.js r176"> with cursor:grab, rotated by pointer drag).
 *
 * This file is framework-agnostic React — no Framer imports — so it can be run,
 * tested, and iterated on in any React setup (Vite/Next/CRA) via Claude Code or
 * Cursor. See RotatingIcon.framer.tsx for the Framer Code Component wrapper that
 * adds property controls, and README-handoff.md for setup + a handoff prompt.
 */
import * as React from "react"
import { useRef, useMemo, useCallback, useState, useEffect } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import * as THREE from "three"
import { SALESFORCE_LOGO_DATA_URI } from "./logos"

export interface RotatingIconProps {
  /** Overall square size in pixels (the component fills its container, this is just a fallback for standalone use). */
  size?: number
  /** Gradient stops for the front-face artwork — only used when `imageUrl` is not set. */
  colorA?: string
  colorB?: string
  colorC?: string
  /** Color of the icon glyph drawn on top of the gradient — only used when `imageUrl` is not set. */
  iconColor?: string
  /** Color of the puck's edge / rim. */
  edgeColor?: string
  /** Corner rounding of the squircle, in local units (0 = square, ~0.85 = pill). */
  cornerRadius?: number
  /** Thickness of the puck along the viewing axis. */
  thickness?: number
  /**
   * Radians of rotation per pixel of horizontal drag. Measured off the
   * reference at roughly 0.025 (a drag across the icon's own width turns it
   * about 140°). Rotation is constrained to side-to-side turntable spin
   * (yaw, around the vertical axis) only — vertical drag doesn't tilt it,
   * so it can't be flipped end-over-end into an upside-down orientation.
   */
  dragSensitivity?: number
  /**
   * 0-1, how quickly the puck eases toward its target rotation (higher =
   * snappier, 1 = no smoothing). Frame-rate independent: the value is the
   * fraction closed per 1/60s, corrected for the real frame time, so the
   * feel is the same at 30, 60 or 120fps.
   */
  damping?: number
  /**
   * Keep turning on its own. The reference never comes to rest — it spins
   * continuously at a slow, constant rate — so this is on by default.
   */
  autoRotate?: boolean
  /** Steady rotation rate in radians/second. The reference measures 0.5 (a full turn every ~12.5s). */
  autoRotateSpeed?: number
  /**
   * A one-time burst of extra spin on mount, on top of `autoRotateSpeed`,
   * that decays away exponentially — the reference's landing animation
   * starts fast (~6.9 rad/s measured) and eases down into its steady rate
   * rather than swinging back and stopping. Set to 0 to start at the steady
   * rate with no intro.
   */
  introSpinSpeed?: number
  /** Seconds for the intro burst to decay to ~37% of its speed. Measured ~1.6 on the reference. */
  introSpinDecay?: number
  /**
   * Seconds for a flick's leftover momentum to decay after the pointer is
   * released. The reference keeps spinning briefly after you let go; set to
   * 0 to stop dead on release.
   */
  flickDecay?: number
  /**
   * Use your own artwork instead of the procedural gradient+glyph. Pass any
   * browser-loadable image URL — a PNG/JPG, an SVG, or a data: URI (handiest
   * for a logo file, since it keeps the component self-contained). The image
   * doesn't need to be square or edge-to-edge: it's centered and scaled to
   * fit on a `logoBackgroundColor`-filled square first, so a wide logo like
   * a wordmark, or one with transparent padding, still looks like a proper
   * app icon instead of stretching or showing raw transparency. Falls back
   * to the procedural texture (colorA/B/C + iconColor) when omitted. Shown
   * on both the front and back faces (mirrored correctly, not flipped) so
   * the puck reads the same from either side.
   */
  imageUrl?: string
  /** Background fill behind `imageUrl` artwork (ignored when `imageUrl` is unset). */
  logoBackgroundColor?: string
  /** Fraction of the texture reserved as empty margin around `imageUrl` artwork, per side. */
  logoPadding?: number
}

// Every value below that says "measured" was read directly off the live
// reference (danield.design/case-studies/clocks) by instrumenting its WebGL
// context and capturing its actual model-view and projection matrices frame
// by frame — not eyeballed from screenshots. See README-handoff.md.
const DEFAULTS: Required<Omit<RotatingIconProps, never>> = {
  // The reference's canvas is 96x96 CSS px, and the puck fills ~54% of it
  // face-on. This is only the fallback minimum for standalone use — the
  // component fills whatever box its container gives it.
  size: 96,
  colorA: "#8B5CF6",
  colorB: "#EC4899",
  colorC: "#38BDF8",
  iconColor: "#FFFFFF",
  edgeColor: "#F5F5F7",
  cornerRadius: 0.55,
  // Measured off the reference: 0.182 deep against a 0.866 face (21% of the
  // face width), which against this component's 1.7-unit face is 1.7 x 0.21
  // = 0.357. Per an explicit request, halved from that to 0.1785 — a
  // noticeably thinner puck than the reference's own proportions.
  thickness: 0.1785,
  // Measured: ~0.025 rad per pixel of drag.
  dragSensitivity: 0.025,
  damping: 0.18,
  // Measured: the reference never stops. It turns continuously at a
  // constant 0.5 rad/s and only ever pauses while you're dragging it.
  autoRotate: true,
  autoRotateSpeed: 0.5,
  // Measured: the landing spin starts at ~6.9 rad/s on top of the steady
  // 0.5, and decays exponentially with a ~1.6s time constant (it is still
  // visibly easing down ~4s in).
  introSpinSpeed: 6.9,
  introSpinDecay: 1.6,
  flickDecay: 0.6,
  // Swap this default (or pass your own `imageUrl` prop) to change the logo.
  // See ./logos.ts — it's just a data: URI, no external file dependency.
  imageUrl: SALESFORCE_LOGO_DATA_URI,
  // A soft off-white rather than pure #FFFFFF — measured directly off the
  // reference icon's face, which reads as a light warm gray, not paper-white.
  logoBackgroundColor: "#EDEDED",
  logoPadding: 0.16,
}

// ---------------------------------------------------------------------------
// Procedural front-face texture (gradient + simple glyph), used when no
// imageUrl is supplied. Keeps the component fully self-contained with zero
// external assets.
// ---------------------------------------------------------------------------
function useProceduralTexture(colorA: string, colorB: string, colorC: string, iconColor: string) {
  return useMemo(() => {
    const size = 512
    const canvas = document.createElement("canvas")
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext("2d")!

    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, colorA)
    gradient.addColorStop(0.5, colorB)
    gradient.addColorStop(1, colorC)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)

    // soft glossy highlight, top-left
    const highlight = ctx.createRadialGradient(
      size * 0.3, size * 0.25, 0,
      size * 0.3, size * 0.25, size * 0.6
    )
    highlight.addColorStop(0, "rgba(255,255,255,0.35)")
    highlight.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = highlight
    ctx.fillRect(0, 0, size, size)

    // simple chevron glyph in the middle (swap for your own icon via imageUrl)
    ctx.strokeStyle = iconColor
    ctx.lineWidth = size * 0.09
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.beginPath()
    ctx.moveTo(size * 0.32, size * 0.4)
    ctx.lineTo(size * 0.5, size * 0.6)
    ctx.lineTo(size * 0.68, size * 0.4)
    ctx.stroke()

    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    texture.needsUpdate = true
    return texture
  }, [colorA, colorB, colorC, iconColor])
}

/**
 * Finds the bounding box of the non-transparent pixels in an image. Many
 * source logos (this SVG included) are authored on a canvas noticeably
 * bigger than the visible artwork — e.g. a 100x100 viewBox holding a blob
 * that's only ~60x40 — so sizing off the image's raw width/height bakes in
 * extra invisible margin on top of whatever `logoPadding` asks for, making
 * the logo look smaller than intended. Trimming to the actual ink first
 * means `logoPadding` is the only margin in play.
 */
function getOpaqueBounds(image: HTMLImageElement) {
  const srcW = image.naturalWidth || image.width || 1
  const srcH = image.naturalHeight || image.height || 1
  const canvas = document.createElement("canvas")
  canvas.width = srcW
  canvas.height = srcH
  const ctx = canvas.getContext("2d")!
  ctx.drawImage(image, 0, 0, srcW, srcH)

  let data: Uint8ClampedArray
  try {
    data = ctx.getImageData(0, 0, srcW, srcH).data
  } catch {
    // Cross-origin images without proper CORS headers taint the canvas and
    // block pixel reads — fall back to the untrimmed full image rather than
    // throwing.
    return { x: 0, y: 0, width: srcW, height: srcH }
  }

  let minX = srcW, minY = srcH, maxX = -1, maxY = -1
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      const alpha = data[(y * srcW + x) * 4 + 3]
      if (alpha > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  // Fully transparent image (or a solid opaque one with no alpha channel at
  // all, in which case every pixel already passed the alpha>10 test) — bail
  // to the untrimmed full image.
  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width: srcW, height: srcH }
  }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

/**
 * Composites an arbitrary (possibly non-square, possibly transparent) source
 * image onto a solid-color square canvas, centered and scaled to fit inside
 * `1 - 2*padding` of the square ("contain", never cropped/stretched). This is
 * what lets a wide logo like a wordmark-in-a-blob, or one with transparent
 * edge padding, read as a proper app icon instead of stretching to fill a
 * square texture or showing a checkerboard of raw transparency. Sizes off
 * the image's actual visible content (see getOpaqueBounds), not its raw
 * pixel dimensions, so a logo with baked-in transparent margin isn't
 * shrunk twice.
 */
function compositeLogoTexture(image: HTMLImageElement, backgroundColor: string, padding: number) {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")!

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, size, size)

  const bounds = getOpaqueBounds(image)
  const maxDim = size * (1 - padding * 2)
  const scale = Math.min(maxDim / bounds.width, maxDim / bounds.height)
  const drawW = bounds.width * scale
  const drawH = bounds.height * scale
  const dx = (size - drawW) / 2
  const dy = (size - drawH) / 2
  ctx.drawImage(image, bounds.x, bounds.y, bounds.width, bounds.height, dx, dy, drawW, drawH)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

/**
 * Picks between a user-supplied image and the procedural gradient texture.
 * Both underlying hooks are always called (rules-of-hooks safe) — we just
 * choose which *result* to use. The custom-image path loads asynchronously
 * (needed for both remote URLs and data: URIs, since SVG data URIs in
 * particular don't decode synchronously) and re-composites onto a
 * `backgroundColor`-filled square whenever the image, background, or padding
 * changes, so the procedural texture is shown briefly while it loads rather
 * than a blank/flashing face.
 */
function useIconTexture(
  imageUrl: string | undefined,
  colorA: string,
  colorB: string,
  colorC: string,
  iconColor: string,
  logoBackgroundColor: string,
  logoPadding: number
) {
  const procedural = useProceduralTexture(colorA, colorB, colorC, iconColor)
  const [customTexture, setCustomTexture] = useState<THREE.CanvasTexture | null>(null)

  useEffect(() => {
    if (!imageUrl) {
      setCustomTexture(null)
      return
    }
    let cancelled = false
    const image = new Image()
    // Harmless for same-origin/data: URIs; needed so cross-origin images
    // (a hosted PNG, say) don't taint the canvas we draw them into.
    image.crossOrigin = "anonymous"
    image.onload = () => {
      if (cancelled) return
      setCustomTexture(compositeLogoTexture(image, logoBackgroundColor, logoPadding))
    }
    image.onerror = () => {
      if (cancelled) return
      setCustomTexture(null)
    }
    image.src = imageUrl
    return () => {
      cancelled = true
    }
  }, [imageUrl, logoBackgroundColor, logoPadding])

  return customTexture ?? procedural
}

// ---------------------------------------------------------------------------
// Geometry: a rounded-rect ("squircle") shape, built as three separate
// meshes (front cap, back cap, rim) rather than one fused extrude. This is
// deliberately simple/robust — three independent geometries with distinct
// materials — instead of relying on three.js's internal ExtrudeGeometry
// material-group ordering, which differs across faces and is easy to get
// backwards by mistake.
// ---------------------------------------------------------------------------
function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const r = Math.min(radius, width / 2, height / 2)

  // Traced counter-clockwise (bottom → right → top → left). three.js expects
  // an outer contour to wind CCW when viewed from +Z; getting this backwards
  // silently flips the face normal to -Z, which then gets back-face culled
  // and is invisible from a camera on the +Z side — a very easy mistake to
  // make with a hand-rolled Shape path, so it's called out here deliberately.
  shape.moveTo(x + r, y)
  shape.lineTo(x + width - r, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + r)
  shape.lineTo(x + width, y + height - r)
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  shape.lineTo(x + r, y + height)
  shape.quadraticCurveTo(x, y + height, x, y + height - r)
  shape.lineTo(x, y + r)
  shape.quadraticCurveTo(x, y, x + r, y)
  return shape
}

/** Remaps a ShapeGeometry's default UVs (raw shape-space coords) to a clean 0..1 range. */
function normalizeUVs(geometry: THREE.BufferGeometry) {
  geometry.computeBoundingBox()
  const bbox = geometry.boundingBox!
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  const spanX = bbox.max.x - bbox.min.x || 1
  const spanY = bbox.max.y - bbox.min.y || 1
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - bbox.min.x) / spanX, (pos.getY(i) - bbox.min.y) / spanY)
  }
  uv.needsUpdate = true
}

/**
 * Builds the puck's edge (rim) as a strip of quads walking the shape's
 * outline, one pair of triangles per contour segment, extruded from
 * z = -thickness/2 to z = +thickness/2. Assumes `shape` winds
 * counter-clockwise (see roundedRectShape above) so the computed outward
 * normal — the edge direction rotated -90° — actually points away from the
 * puck rather than into it.
 */
function buildRimGeometry(shape: THREE.Shape, thickness: number, segments = 128) {
  const points = shape.getPoints(segments)
  const halfT = thickness / 2
  const positions: number[] = []
  const normals: number[] = []

  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const edgeX = b.x - a.x
    const edgeY = b.y - a.y
    const len = Math.hypot(edgeX, edgeY)
    if (len < 1e-8) continue // skip degenerate (e.g. duplicate closing point)

    const nx = edgeY / len
    const ny = -edgeX / len

    const aBot = [a.x, a.y, -halfT]
    const bBot = [b.x, b.y, -halfT]
    const bTop = [b.x, b.y, halfT]
    const aTop = [a.x, a.y, halfT]

    positions.push(...aBot, ...bBot, ...bTop, ...aBot, ...bTop, ...aTop)
    for (let k = 0; k < 6; k++) normals.push(nx, ny, 0)
  }

  const geo = new THREE.BufferGeometry()
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
  return geo
}

function IconMesh({
  radius,
  thickness,
  frontTexture,
  edgeColor,
}: {
  radius: number
  thickness: number
  frontTexture: THREE.Texture
  edgeColor: string
}) {
  const width = 1.7
  const height = 1.7

  const shape = useMemo(() => roundedRectShape(width, height, radius), [radius])

  // Front + back caps: flat shape geometries, with UVs remapped to 0..1
  // (three.js's built-in ShapeGeometry UVs are raw shape-space coordinates,
  // not normalized, which distorts/clamps a texture unless fixed up).
  const capGeometry = useMemo(() => {
    const geo = new THREE.ShapeGeometry(shape, 32)
    normalizeUVs(geo)
    return geo
  }, [shape])

  // Rim: the puck's edge, built by hand as a strip of quads around the
  // shape's outline (rather than pulling the "sides" group out of an
  // ExtrudeGeometry — that group's index/ordering turned out to vary and is
  // easy to get backwards, which silently duplicates the front/back caps
  // onto the rim at the same depth and z-fights them into invisibility).
  // This walks the same contour points used everywhere else, so it can't
  // disagree with the caps about where the outline actually is.
  const rimGeometry = useMemo(() => buildRimGeometry(shape, thickness), [shape, thickness])

  // Front and back share one material (and thus one texture): the back mesh
  // is the same flat cap geometry, positioned behind and rotated 180° about
  // Y. That local flip combined with the puck's own drag-driven rotation
  // cancels out — when the back fully rotates into view, the artwork reads
  // correctly (not mirrored), the same way engraving on both faces of a
  // coin reads correctly no matter which side is up.
  // Matte finish, per an explicit request modeled on a specific reference: the
  // orange (MeshPhongMaterial, shininess 80, no env map) sphere at
  // https://threejsdemos.com/demos/basics/materials-gallery. That sphere reads
  // as matte because it has no environment reflection and next to no visible
  // specular highlight — a soft diffuse gradient and nothing else. The PBR
  // equivalent here is clearcoat off, high roughness (soft/no specular
  // highlight), zero metalness (a metal surface tints its highlight and never
  // reads as truly matte), and envMapIntensity dropped to just enough to keep
  // the puck from looking flat/unlit in the dark background of its own
  // rotation, without producing a visible reflection.
  const frontMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: frontTexture,
        roughness: 0.9,
        metalness: 0,
        clearcoat: 0,
        envMapIntensity: 0.08,
      }),
    [frontTexture]
  )
  const edgeMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: edgeColor,
        roughness: 0.9,
        metalness: 0,
        clearcoat: 0,
        envMapIntensity: 0.08,
      }),
    [edgeColor]
  )

  return (
    <group>
      {/* front face, facing +Z toward the default camera */}
      <mesh geometry={capGeometry} material={frontMaterial} position={[0, 0, thickness / 2]} />
      {/* back face, flipped to face -Z — same material/texture as the front */}
      <mesh geometry={capGeometry} material={frontMaterial} position={[0, 0, -thickness / 2]} rotation={[0, Math.PI, 0]} />
      {/* rim connecting them */}
      <mesh geometry={rimGeometry} material={edgeMaterial} />
    </group>
  )
}

/**
 * A soft vertical-gradient "sky" (bright above, dimmer below), baked into a
 * PMREM environment map and assigned to the scene. This originally existed
 * to give IconMesh's clearcoat a real highlight gradient instead of a flat,
 * evenly-lit look — a couple of directional lights alone light the material
 * evenly but can't create that highlight, which is why an earlier version
 * of this component (ambient + directional lights only, to avoid an
 * external HDRI asset) rendered noticeably duller/flatter than the
 * reference icon's (then-glossy) look. Since the matte finish switch (see
 * "Lighting and material" in the README) clearcoat is off and this texture
 * is applied at a low envMapIntensity instead, just enough to keep the puck
 * from reading as flat/unlit — not to produce a visible reflection. Still
 * built as a tiny 2x2 canvas gradient rather than a full HDRI file or
 * three.js's example `RoomEnvironment` scene (a lit room of boxes) — that
 * scene's bright area lights would overpower and wash out any textured
 * artwork on the front face even at a low intensity; this plain gradient
 * needs nothing beyond three.js's own PMREMGenerator (no external file, no
 * network).
 */
function buildEnvironmentTexture() {
  const canvas = document.createElement("canvas")
  canvas.width = 2
  canvas.height = 2
  const ctx = canvas.getContext("2d")!
  const gradient = ctx.createLinearGradient(0, 0, 0, 2)
  gradient.addColorStop(0, "#ffffff")
  gradient.addColorStop(1, "#9a9a9a")
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 2)
  const texture = new THREE.CanvasTexture(canvas)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

/**
 * Bakes buildEnvironmentTexture() into a PMREM environment map once per
 * WebGLRenderer and assigns it to the scene, giving IconMesh's materials a
 * faint gradient to pick up (at low envMapIntensity, for a matte look —
 * see buildEnvironmentTexture's comment above). Renders nothing itself.
 */
function SceneEnvironment() {
  const { gl, scene } = useThree()
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const source = buildEnvironmentTexture()
    const renderTarget = pmrem.fromEquirectangular(source)
    scene.environment = renderTarget.texture
    source.dispose()
    pmrem.dispose()
    return () => {
      renderTarget.dispose()
      scene.environment = null
    }
  }, [gl, scene])
  return null
}

// ---------------------------------------------------------------------------
// Drag-to-rotate rig. Rotation is yaw-only (around the vertical axis) —
// matching the reference, vertical drag does nothing, so the puck spins side
// to side like a turntable but is never tipped or tumbled.
//
// The model here is "one angle, several things pushing it", which is what the
// reference's captured matrices actually show:
//
//   * a steady rate (`autoRotateSpeed`) that never stops,
//   * a one-time intro burst (`introSpinSpeed`) that decays away
//     exponentially into that steady rate,
//   * whatever the pointer adds while dragging,
//   * and the leftover momentum of a flick after release.
//
// An earlier version modeled the intro as a spring that swung out and settled
// facing front. That was wrong: the reference never settles at all — it turns
// at a constant 0.5 rad/s indefinitely, and the intro is simply a faster spin
// easing down into that rate.
//
// Pointer move/up are bound to `window`, not the canvas. On a 96px icon a
// normal drag leaves the canvas almost immediately, and binding them to the
// element means the rotation stops dead the moment the cursor crosses the
// edge — which reads as "dragging doesn't work".
// ---------------------------------------------------------------------------
function RotationRig({
  children,
  sensitivity,
  damping,
  autoRotate,
  autoRotateSpeed,
  introSpinSpeed,
  introSpinDecay,
  flickDecay,
}: {
  children: React.ReactNode
  sensitivity: number
  damping: number
  autoRotate: boolean
  autoRotateSpeed: number
  introSpinSpeed: number
  introSpinDecay: number
  flickDecay: number
}) {
  const group = useRef<THREE.Group>(null!)
  // The continuous spin (auto-rotate + intro burst + flick momentum) is
  // applied straight to the mesh, while only the pointer's contribution is
  // eased. Running the spin through the same easing made it ramp up from a
  // standstill instead of starting at full speed, which visibly softened the
  // landing animation the reference opens with.
  const spin = useRef(0)
  const dragTarget = useRef(0)
  const dragEased = useRef(0)
  const introVel = useRef(introSpinSpeed)
  const flickVel = useRef(0)
  const dragging = useRef(false)
  const lastX = useRef(0)
  const lastMoveTime = useRef(0)
  const { gl } = useThree()

  // Keep the live values in a ref so the window listeners never need to be
  // torn down and re-bound when a prop changes mid-drag.
  const cfg = useRef({ sensitivity, flickDecay })
  cfg.current = { sensitivity, flickDecay }

  useEffect(() => {
    const el = gl.domElement
    el.style.cursor = "grab"
    el.style.touchAction = "none"

    const onDown = (e: PointerEvent) => {
      dragging.current = true
      lastX.current = e.clientX
      lastMoveTime.current = performance.now()
      // Grabbing it takes over: kill the intro burst and any leftover flick
      // so they don't fight the pointer.
      introVel.current = 0
      flickVel.current = 0
      el.style.cursor = "grabbing"
      try {
        el.setPointerCapture(e.pointerId)
      } catch {
        // no-op: capture isn't available for this pointer, window listeners
        // below still keep the drag alive outside the canvas
      }
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const dx = e.clientX - lastX.current
      lastX.current = e.clientX
      // Vertical movement (e.clientY) is deliberately ignored — no tilt.
      const delta = dx * cfg.current.sensitivity
      dragTarget.current += delta

      // Remember how fast the pointer was moving, so releasing mid-swipe
      // hands that speed over to the flick momentum below.
      const now = performance.now()
      const dt = (now - lastMoveTime.current) / 1000
      lastMoveTime.current = now
      if (dt > 0) flickVel.current = delta / Math.max(dt, 1 / 120)
    }

    const onUp = (e: PointerEvent) => {
      if (!dragging.current) return
      dragging.current = false
      el.style.cursor = "grab"
      // A flick that ended in a pause shouldn't fling: if the last movement
      // was a while ago, there's no momentum to carry.
      if (performance.now() - lastMoveTime.current > 120) flickVel.current = 0
      if (cfg.current.flickDecay <= 0) flickVel.current = 0
      try {
        el.releasePointerCapture(e.pointerId)
      } catch {
        // no-op: pointer capture may already be released
      }
    }

    el.addEventListener("pointerdown", onDown)
    // Bound to window so the drag survives leaving the (small) canvas.
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      el.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [gl])

  useFrame((_, delta) => {
    // Clamp so a backgrounded tab resuming with a huge delta can't fling the
    // puck through a wild single-frame jump.
    const dt = Math.min(delta, 1 / 30)

    if (!dragging.current) {
      if (autoRotate) spin.current += autoRotateSpeed * dt

      if (introVel.current !== 0) {
        spin.current += introVel.current * dt
        introVel.current *= Math.exp(-dt / Math.max(introSpinDecay, 1e-3))
        if (Math.abs(introVel.current) < 0.005) introVel.current = 0
      }

      if (flickVel.current !== 0) {
        spin.current += flickVel.current * dt
        flickVel.current *= Math.exp(-dt / Math.max(flickDecay, 1e-3))
        if (Math.abs(flickVel.current) < 0.005) flickVel.current = 0
      }
    }

    // Frame-rate-independent easing: `damping` is the fraction of the
    // remaining distance closed per 1/60s, rescaled to the frame actually
    // rendered. Only the pointer's contribution is smoothed.
    const k = 1 - Math.pow(1 - Math.min(Math.max(damping, 0.001), 0.999), dt * 60)
    dragEased.current += (dragTarget.current - dragEased.current) * k
    if (group.current) {
      group.current.rotation.y = spin.current + dragEased.current
    }
  })

  return <group ref={group}>{children}</group>
}

function Scene(props: Required<Omit<RotatingIconProps, "imageUrl">> & { imageUrl?: string }) {
  const texture = useIconTexture(
    props.imageUrl,
    props.colorA,
    props.colorB,
    props.colorC,
    props.iconColor,
    props.logoBackgroundColor,
    props.logoPadding
  )

  return (
    <>
      <SceneEnvironment />
      <ambientLight intensity={1.75} />
      <directionalLight position={[3, 4, 5]} intensity={1.4} />
      <directionalLight position={[-4, -2, -3]} intensity={0.35} />
      <RotationRig
        sensitivity={props.dragSensitivity}
        damping={props.damping}
        autoRotate={props.autoRotate}
        autoRotateSpeed={props.autoRotateSpeed}
        introSpinSpeed={props.introSpinSpeed}
        introSpinDecay={props.introSpinDecay}
        flickDecay={props.flickDecay}
      >
        <IconMesh
          radius={props.cornerRadius}
          thickness={props.thickness}
          frontTexture={texture}
          edgeColor={props.edgeColor}
        />
      </RotationRig>
    </>
  )
}

export default function RotatingIcon(props: RotatingIconProps) {
  const merged = { ...DEFAULTS, ...props }

  return (
    <div style={{ width: "100%", height: "100%", minWidth: merged.size, minHeight: merged.size }}>
      <Canvas
        dpr={[1, 2]}
        // FOV matched to the reference's own, captured from its live
        // projection matrix: 50°. At 50° this close the puck's corners swing
        // measurably nearer the camera as it turns, so it visibly swells —
        // about 25% wider edge-on than face-on — which is most of what makes
        // the reference read as a solid object rather than a flat sticker.
        // An earlier version used a 30° lens pulled further back, which
        // flattened that out and, because the puck was sized to match the
        // reference's *turned* silhouette, also rendered it about 20% too
        // large face-on.
        //
        // Distance is intentionally NOT matched to the reference. A distance
        // of 3.53 reproduced the reference's own face-on size exactly (52.5px
        // measured in a 96px canvas, vs. the reference's 52.2px). Two later,
        // explicit requests made the puck bigger from there — first to
        // 68.5px (camera to 2.743), then, after thickness was independently
        // halved (which itself shrank the face-on size slightly to 66.0px —
        // see "Size, thickness, and motion" in the README), a further +16px
        // to 82.0px, landing here at 2.232 — while leaving fov at 50° so the
        // perspective swell and drag feel are unchanged throughout. Re-derive
        // via the same pixel-bounding-box measurement (see README) if this
        // is retuned again; don't assume distance scales as a simple 1/d
        // from any prior value, since the thickness-dependent offset shifts
        // the fit each time thickness changes too.
        camera={{ position: [0, 0, 2.232], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <Scene {...merged} />
      </Canvas>
    </div>
  )
}
