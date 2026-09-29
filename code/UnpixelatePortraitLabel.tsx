import { useCallback, useEffect, useRef, useState, startTransition, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react"
import { createPortal } from "react-dom"
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"

interface UnpixelatePortraitImage {
    src: string
    srcSet?: string
    alt?: string
}

interface UnpixelatePortraitProps {
    cursorLabel: string
    keepGoingLabel: string
    almostLabel: string
    doneLabel: string
    finalLabel: string
    finalImage?: { src: string; alt?: string }
    labelColor: string
    labelTextColor: string
    image?: UnpixelatePortraitImage
    gridSize: number
    brushSize: number
    padding: string
    style?: CSSProperties
}

function parsePadding(value: string | undefined): [number, number, number, number] {
    if (!value) return [0, 0, 0, 0]
    const parts = value
        .trim()
        .split(/\s+/)
        .map((part) => parseFloat(part) || 0)
    if (parts.length === 1) return [parts[0], parts[0], parts[0], parts[0]]
    if (parts.length === 2) return [parts[0], parts[1], parts[0], parts[1]]
    if (parts.length === 3) return [parts[0], parts[1], parts[2], parts[1]]
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0, parts[3] ?? 0]
}

const DEFAULT_IMAGE_SRC =
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxOTkiIGhlaWdodD0iMTk5IiB2aWV3Qm94PSIwIDAgMTk5IDE5OSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTguNSwwLjApIj4KPHBhdGggZD0iTTY4LjcyODggMTMuMjY4M0M3Mi40NTkyIDguNTE5MzIgNzUuNDgwOSA1LjEyMjU3IDgxLjA1NjYgMi4zNjU3OEM5MC4yNTYyIC0yLjE4MzI3IDEwNC40NDkgLTAuMzg2NTU3IDEwOS4zMDggOS42Mjc3NkMxMTQuMjI4IDYuNjMwMTYgMTE5LjU5MiA0Ljg0MzU5IDEyNS4zMzggNi4yNDk5OEMxMzIuNTQ0IDguMDEzOTcgMTM3LjM5OSAxNC4yMTExIDEzNS40OTkgMjEuNjczOEMxNDIuODY2IDIwLjg4NSAxNTMuMjMzIDIzLjI3NDYgMTU0LjgxMiAzMS45MzYzQzE1NS4xNTUgMzMuODE5MyAxNTQuNzEyIDM2LjEzNjggMTUzLjkzMyAzNy44NTM1QzE1My41NzUgMzguNjQ1IDE1Mi41MjUgMzkuOTM4NCAxNTEuOTc2IDQwLjY4NDdDMTUyLjA2IDQwLjk0MTUgMTUyLjEyNiA0MC45MDQ1IDE1Mi40MjYgNDEuMDkwMkMxNTIuNzIxIDQwLjUxOTQgMTUyLjkwNSA0MC4wOTk1IDE1My42MjIgNDAuNDQzM0MxNTMuNzg5IDQwLjgwODYgMTUzLjc2OCA0MC42MjU0IDE1My43IDQxLjAxMUwxNTMuMzcyIDQxLjQxOTRDMTYxLjg3MSA0NC42NzggMTY0LjMyOCA1NC43MDg4IDE1NS45MTEgNTkuNjE3NEMxNTguNjQ2IDY0LjI3NjQgMTU2LjI3NiA2OC42NDU2IDE1Mi42MzggNzEuODc5OEMxNTIuOTUxIDcyLjE3NiAxNTMuMjQ0IDcyLjQ5MjcgMTUzLjUxNiA3Mi44MjhDMTU0Ljg5NSA3NC41NjY3IDE1NS41MDYgNzYuODk1NyAxNTUuMjQ3IDc5LjA4NzNDMTU0Ljc4IDgzLjAxMDUgMTUyLjM5NyA4NS42NjAzIDE0OS40NTUgODguMDA1OUMxNTEuNjggOTQuOTI3NCAxNDguMTY4IDEwMC44MjQgMTQzLjMwNCAxMDUuNTUxQzE0My4xMzcgMTA2Ljc3OCAxNDIuODE4IDEwOC41OTMgMTQyLjc3OCAxMDkuNzc2QzE0Mi43NDcgMTEwLjY1NSAxNDMuNDc2IDExMi44NjkgMTQzLjc1NSAxMTMuODY5QzE0NC4wOCAxMTUuMDQgMTQ0LjM2OCAxMTYuMjIyIDE0NC42MiAxMTcuNDFDMTQ2LjM0IDEyNS42NzggMTQ1LjgxMiAxMzMuMjk2IDE0My4wNTggMTQxLjI0NUMxNDcuMDkyIDE0Ny4xNjQgMTQ2LjIxMiAxNTMuNTI5IDE0MC40MSAxNTcuODQ3QzE0Mi45MiAxNjQuNzUyIDEzOS41ODYgMTcxLjk3IDEzMi40MDYgMTczLjk1MUMxMzIuNDIxIDE3NC43ODEgMTMyLjM4NSAxNzUuNjEyIDEzMi4yOTcgMTc2LjQzOUMxMzEuODQzIDE4MC4yMTcgMTI5LjkyIDE4My42NjcgMTI2Ljk0NCAxODYuMDRDMTIzLjk5IDE4OC4zNTUgMTIwLjkxNCAxODguOTMxIDExNy4yODQgMTg4LjUwNkMxMTYuOTQ0IDE4OS40MzggMTE2LjM5MSAxOTAuNDU2IDExNS44MzMgMTkxLjI3NEMxMTMuNTcxIDE5NC41OTYgMTEwLjA1OSAxOTYuODU5IDEwNi4wOTkgMTk3LjU0NUMxMDIuMDE0IDE5OC4yODEgOTcuNDc2NyAxOTcuNDIyIDk0LjA1MjggMTk1LjAzOUM5My45ODE1IDE5NS4wOTkgOTMuOTA5MiAxOTUuMTU4IDkzLjgzNTggMTk1LjIxNUM5MC4zMzQ2IDE5Ny45MTIgODYuNDEyNCAxOTkuMDMzIDgyLjAwMiAxOTguNTA3Qzc3Ljg1NzggMTk4LjAxMyA3My42Mjc0IDE5NS44NyA3MS4wNjAyIDE5Mi41MjlDNzAuNjEwOCAxOTIuNzMgNzAuMTUzOCAxOTIuOTE1IDY5LjY5MDUgMTkzLjA4MkM2Ni4yNjEgMTk0LjMxNCA2Mi40ODMyIDE5NC4xMzYgNTkuMTg0NCAxOTIuNTg4QzU1LjM1MzEgMTkwLjc1NSA1Mi43OTg5IDE4Ny41MzEgNTEuNDIyMSAxODMuNTdDNTAuMzk5OCAxODMuNzI5IDQ5LjUyMTIgMTgzLjg0MSA0OC40ODUyIDE4My44MzZDNDEuMTk3NSAxODMuOCAzNS42MTc3IDE3OC4zNjQgMzUuNjY1MyAxNzEuMDM5QzI2LjgzOSAxNjkuNTIxIDIyLjQyNTEgMTYxLjY5MyAyNS4yMjM0IDE1My4yNzJDMjAuNzM4MyAxNTAuMjgzIDE4LjcyNDUgMTQ1LjMxMSAxOS40MDggMTQwLjAzM0MxOS43Mzc3IDEzNy40ODcgMjAuNTc0OCAxMzUuMjI3IDIxLjM5NTMgMTMyLjgyQzE2LjA3NTcgMTMxLjkwOCAxMi4xNTAyIDEzMC4zMTEgOC4wNjgwOCAxMjYuNjUxQzMuMjE1MTcgMTIyLjI0NyAwLjMyMzU2NyAxMTYuMDg2IDAuMDM2NTM2IDEwOS41MzlDLTAuMjk3NzE0IDEwMy4yNzMgMS42NjMyOCA5Ny40NTE3IDUuODQ0MzcgOTIuNzc2OEMyLjU3MjA5IDg3Ljc2NzMgMS44MDQ0MyA4Mi40NzQ2IDUuMTU2MDcgNzcuMjU0NkMyLjYxMzg5IDc0LjI4NCAxLjM1MDAzIDcxLjA0MjUgMS42NDgwMSA2Ny4wOTU5QzIuMDA4NDggNjIuMzIyMiA0LjYwMTUgNTkuMTU5MSA4LjA2NTU2IDU2LjE3MDRDNC4yNTkzMiA1Mi42MTQ2IDMuNDMwMzcgNDcuMzg4NyA2LjM1NTk0IDQyLjk4ODVDOC45NDUzNCAzOS4wOTM5IDEzLjAyOTYgMzYuODU4OSAxNy41Mzc2IDM1LjkyMjNDMTYuNDIxNyAzNC4yOTk4IDE1Ljc0MDQgMzIuODQ2MyAxNS41MzI4IDMwLjg2NEMxNS4wNDU1IDI2LjIxMzIgMTguNDU3NCAyMi4xNDEyIDIzLjE0MjQgMjEuODI0OEMyNi41NjI5IDIxLjU5MzggMjkuNjI1OSAyMi45NDU3IDMyLjIxMDYgMjUuMTYxNkMzMi4yNzA4IDI0LjY2MTIgMzIuMzQzMSAyNC4xNjIyIDMyLjQyNzggMjMuNjY1NEMzMy40NzkyIDE3Ljg0OTcgMzYuNzg1OSAxMi42ODQ5IDQxLjYyNzggOS4yOTYxMkM1MC4yODc1IDMuMzI4NjEgNjIuNTU5OSA0LjI2NDQ2IDY4LjcyODggMTMuMjY4M1oiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik05MC41Mjk5IDQuMjQ5NkM5Ni4zMzk4IDMuNjM5ODEgMTAzLjM2NSA2LjU1MDU0IDEwNS44NzIgMTIuMDk2N0MxMDQuOTEgMTMuOTI1IDEwNS4xNTMgMTYuMTEwNyAxMDcuODg1IDE1LjQ5NTlDMTA4LjYzIDE1LjMyODMgMTA5Ljk1MyAxNC4xMzgyIDExMC42NzcgMTMuNjczN0MxMTMuNDAxIDExLjkyNzcgMTE2LjM1MiAxMC40OTA0IDExOS42MDMgMTAuMDkzQzEyMi42NDUgOS42ODg1OCAxMjUuODM4IDEwLjMwNjYgMTI4LjI2OSAxMi4yMjc4QzEzMS4wMDUgMTQuMzg5NSAxMzIuMTYxIDE3LjUzMDcgMTMxLjMxNyAyMC45MzE4QzEzMS4wNTUgMjEuOTg5MyAxMzAuNTcgMjMuMjM5NiAxMzAuNjk5IDI0LjI5MTVDMTMwLjgwOSAyNS4xODA0IDEzMS40MzMgMjUuNjU1OSAxMzIuMjgzIDI1Ljc5OThDMTMzLjM4NSAyNS45ODU4IDEzNC45MDYgMjUuODA3IDEzNi4wODUgMjUuNzQzMUMxMzkuODk5IDI1LjUzNjYgMTQ0LjQzNCAyNi4wOTk4IDE0Ny42MjEgMjguMzI4OEMxNDkuMDI1IDI5LjMxMTUgMTUwLjI1OSAzMS4wMTExIDE1MC40NTEgMzIuNzM2NEMxNTAuNzA5IDM1LjAxNDcgMTQ5LjYxNCAzNy4xMDg5IDE0OC4xMTkgMzguNzQwNkMxNDcuNDg0IDM5LjQzNDMgMTQ1LjU1NSA0MC45MzE3IDE0NS44MjIgNDEuOTA4MUMxNDYuMjUxIDQzLjQ3NTYgMTQ5LjE5MyA0My45MjE2IDE1MC41MDMgNDQuNTc5NkMxNTEuNDY3IDQ1LjA2NDEgMTUyLjQxMyA0NS40MDE0IDE1My4zMDQgNDYuMDM5NkMxNTcuOTYxIDQ4LjkwOTQgMTU3Ljc2MyA1My45NzA1IDE1My4wMSA1Ni42MDQzQzE1Mi4zOTIgNTYuOTQ2OSAxNTEuMDAyIDU3LjUzNTUgMTUwLjYxOCA1OC4xMTYyQzE1MC4wMjggNTkuMDA5IDE1MS41OSA2MC4zNDU2IDE1MS45NzggNjEuMDk0OUMxNTIuMyA2MS42OTAyIDE1Mi41MDEgNjEuOTc2NSAxNTIuNjY1IDYyLjY5NkMxNTMuMjQgNjUuMjIwMSAxNTEuNDUgNjcuNTk3MyAxNDkuNjI0IDY5LjEyNDNDMTQ4Ljc0NSA2OS44NTk1IDE0Ny41NDcgNzAuNDgyOCAxNDYuOTQxIDcxLjQ0MDRDMTQ2LjkzOCA3Mi40NzE2IDE0OS41MDkgNzQuMjY3MSAxNTAuMjU1IDc1LjY0NThDMTUwLjgyMSA3Ni42OTI5IDE1MS4wMTMgNzcuODM4NCAxNTAuODMgNzkuMDEzQzE1MC4xODMgODMuMTgxMiAxNDUuMTU4IDg1LjI3ODMgMTQ0Ljk0MiA4Ni45MTc3QzE0NC44NTMgODcuNTkzMSAxNDUuMTUzIDg4LjQxMDcgMTQ1LjMyNSA4OS4wNjA4QzE0NS43NiA5MC43MDc3IDE0Ni4wNTUgOTIuNDM2NCAxNDUuNjQyIDk0LjEyNkMxNDQuOTg4IDk2Ljc5ODMgMTQzLjUyOSA5OS4xNDIzIDE0MS43MjMgMTAxLjE4OEMxNDEuMDc0IDEwMS45MjMgMTQwLjIwMSAxMDIuNzE2IDEzOS43NzcgMTAzLjYwNkMxMzkuMjY3IDEwNC42NzggMTM4Ljg5NCAxMDcuMzg0IDEzOC43NjQgMTA4LjY0NkMxMzguNTYxIDExMC42MjMgMTM5Ljc4NyAxMTQuMTg4IDE0MC4yMTQgMTE2LjM0MkMxNDEuNjAxIDEyMy4zMjkgMTQxLjY4MiAxMzAuMTU1IDEzOS45NjkgMTM3LjA4OUMxMzkuNTU1IDEzOC43NjcgMTM4Ljk5MyAxNDAuNDAxIDEzOC40OTcgMTQyLjA1NUMxNDEuNDAyIDE0Ni4yNDcgMTQyLjY0NiAxNTAuMjA3IDEzOC4yODMgMTU0LjEyQzEzNy4zNjQgMTU0Ljk0NSAxMzYuNDE4IDE1NS4zNzUgMTM1LjYyOSAxNTYuMzk1TDEzNS41NDUgMTU2LjUwNUMxMzUuNjQ1IDE1Ny4yNzUgMTM2LjAyMiAxNTguMzA3IDEzNi4yOTkgMTU5LjAxM0MxMzguMDIyIDE2My40MDEgMTM2LjEyMyAxNjguMDI5IDEzMS42MjcgMTY5LjYyOUMxMzAuODYgMTY5LjkwMiAxMjguMzc3IDE3MC40OTggMTI4LjE1MyAxNzEuMzIxQzEyNy44OTEgMTcyLjI4MiAxMjguMTI2IDE3My43OTcgMTI4LjA2IDE3NC44NzZDMTI3Ljk4OSAxNzYuMDQzIDEyNy43NCAxNzcuMTkgMTI3LjMyMiAxNzguMjgxQzEyNi44MSAxNzkuNTk2IDEyNi4wNDEgMTgwLjc5NSAxMjUuMDU4IDE4MS44MDhDMTIwLjggMTg2LjI2OCAxMTYuMjE0IDE4My4wMzcgMTE0LjY4NSAxODQuMTI2QzExMy45NjMgMTg0LjY0MSAxMTMuNTQxIDE4Ni4xNjcgMTEzLjE3NiAxODYuOTdDMTEyLjA0NiAxODkuNDU0IDExMC4wODEgMTkxLjQ2MSAxMDcuNTczIDE5Mi41NTFDMTA0LjE3MiAxOTMuOTkxIDEwMC4yODkgMTkzLjczMyA5Ny4xMDg0IDE5MS44NTdDOTYuMjc4NSAxOTEuMzcyIDk1LjIwMTUgMTkwLjQyMyA5NC40MTA5IDE5MC4wOThDOTMuMzg4MSAxODkuNjc3IDkxLjU4OTggMTkxLjUxMSA5MC42ODI2IDE5Mi4xNTdDOTAuMTAyOSAxOTIuNTY0IDg5LjQ4OCAxOTIuOTE3IDg4Ljg0NSAxOTMuMjEzQzg0LjMwOSAxOTUuMjUxIDc4Ljk4ODMgMTk0LjMxNCA3NS40MjE3IDE5MC44NDlDNzQuMjQwNyAxODkuNzExIDczLjU2NDYgMTg4LjE1NSA3Mi4wMDM1IDE4Ny41OThDNzEuNDUwNiAxODcuNjgzIDcwLjMxMjIgMTg4LjE0NiA2OS44MDkzIDE4OC4zODlDNjQuMDMwMSAxOTEuMTg2IDU4LjIzMDggMTg4LjY1NCA1NS44NzY0IDE4Mi43ODVDNTUuNTQyNSAxODEuOTUzIDU0Ljg3NjUgMTc5LjM0MSA1My45NDUzIDE3OC45OTFDNTIuODA0MSAxNzguNzAyIDUxLjIzNTMgMTc5LjIxOCA1MC4wNjY1IDE3OS4zODJDNDUuMTAyNiAxODAuMzAzIDQwLjE2NDggMTc2LjUxMSA0MC4wNjU5IDE3MS41MDlDMzkuOTYxMiAxNjYuMjI0IDM5LjA4OTEgMTY3LjY5NSAzNC44MDU2IDE2Ni4yODZDMzAuMTk3OCAxNjQuNzcgMjguMTQzNyAxNjAuNTE5IDI5LjEzMzggMTU1Ljg2NEMyOS4zODMgMTU0LjY5MyAzMC4yNjI0IDE1Mi43MTcgMjkuOTgxIDE1MS41MjJDMjkuNjU0OSAxNTAuNTI2IDI3LjY3MzggMTQ5LjY2MSAyNi43NDAyIDE0OC44NjVDMjUuODExMSAxNDguMDczIDI1LjA2IDE0Ny4wOTUgMjQuNTM2MyAxNDUuOTkzQzIzLjA0NjIgMTQyLjgxIDIzLjY1NjkgMTM4Ljk4NyAyNS4wMjI0IDEzNS44ODRDMjUuMjY2OSAxMzUuMzI4IDI1LjQ5OTcgMTM0Ljc2OCAyNS43MDA1IDEzNC4xOTVMMjUuNzQxMyAxMzQuMDc2QzI0Ljk5NzEgMTMyLjE5NCAyNC44ODgxIDEzMC45MTcgMjQuNzUwOSAxMjguOTVMMjQuNTU5MyAxMjguOTQyQzExLjkyOTIgMTI4LjM5NyAzLjA2ODU0IDExOC4wMTQgNC41MzE0MiAxMDUuNTM2QzUuMTMzNTEgMTAwLjM5OSA3LjM4MzM0IDk2LjA2MzIgMTEuMjE2NyA5Mi42MDc0QzEwLjM3MTUgOTEuNTU5MSA5LjQ5NzI0IDkwLjU0MzUgOC44MzA4NSA4OS4zNzExQzYuOTc2MTUgODYuMTA4MyA3LjA1NTIyIDgyLjUzODEgOC44NjY5MiA3OS4yODI0QzkuMTgxMjggNzguNzE3NCAxMC4wMDU4IDc3LjQxNzMgOS45MjIxMSA3Ni44MDExQzkuNzk0NDIgNzUuODYwMyA4LjQ0MDU0IDc0LjUzMDkgNy44MzY2NCA3My43MDgxQzUuOTc1MzEgNzEuMTY5IDUuNTMzNDYgNjcuODU3NCA2LjY2MzkxIDY0LjkxOTJDNy4yMTM4NiA2My40NzAzIDguMTEzMTMgNjIuMTkwMyA5LjEyNTAyIDYxLjAyNzFDOS41OTQ2IDYwLjQ4ODggMTAuMDg4IDU5Ljk3MTggMTAuNjAzOCA1OS40Nzc1QzE0LjA1NzUgNTYuMTg4OSAxNC44ODI1IDU2LjM0NTEgMTAuOTgzOCA1Mi45MDA3QzkuODYyMzMgNTEuNzk4NSA4Ljk5MDQ5IDUwLjA3MDQgOS4xMTAyNSA0OC41MDYzQzkuNTA1MTggNDMuMDE1NyAxNi4xOTEgMzkuOTY1OSAyMC44OTkxIDM5LjIwMzVDMjYuMjA3NyAzOC4zNDQgMjIuMzU3NCAzNS44NTA5IDIxLjAxMjYgMzMuMzk2MkMyMC43MTc3IDMyLjgzNCAyMC4zMDE0IDMyLjA1NiAyMC4xOTQyIDMxLjQzMjNDMTguOTk1IDI0LjQ1MTggMjYuMDY5MyAyNS4wNjA2IDI5Ljg1MTEgMjguMTYxOEMzMS4xMTY4IDI5LjE5OTcgMzIuOTY4MyAzMS4wMDkyIDM0LjM0MjYgMzAuOTg0NEMzNi42MTgzIDMwLjk0MzMgMzYuMTcxMiAyNy41OTY5IDM2LjQ2OCAyNi4xMjM1QzM4LjA0NzkgMTIuMjI0MiA1NC40MjU4IDMuNDc0MDYgNjQuODMyNiAxNC44NzAxQzY1LjcyOCAxNS44NTA1IDY2LjQ4MjEgMTcuMTYwNyA2Ny40MzMxIDE4LjEwMTVDNjkuNzI5NSAyMC4wNjk2IDcxLjc2ODQgMTUuNjYyNCA3My4xMDU0IDE0LjQ2MDVDNzcuODg3MiA4LjgxNzA0IDgyLjkwMDUgNC44OTMxNyA5MC41Mjk5IDQuMjQ5NloiIGZpbGw9IiMxQTFBMUEiLz4KPHBhdGggZD0iTTgwLjQ2MSA0MS40ODg4QzgwLjU0MTQgNDEuNTg2OCA4MC41MDIyIDQxLjUyNyA4MC41NjA1IDQxLjY1NjNDODQuMjI1NSA0OS43MDUxIDkzLjYwOSA1NC45NjQ0IDEwMi4zNjUgNTMuMTg3MkMxMDcuMTE0IDU5LjY5MTUgMTE1LjY5OSA2MS45OTQzIDEyMy4xNDkgNTguODM0MkMxMjMuNTY3IDU4LjY1NzIgMTIzLjk4IDU4LjQ2MDggMTI0LjM5MSA1OC4yNzAzQzEyNy4xNDUgNjEuNzU0NiAxMzEuMDM4IDYzLjcxODcgMTM1LjI3OCA2NC43MTEyQzEzNS43NzYgNjcuMDUwNiAxMzYuNDQxIDY5LjQzODUgMTM2LjggNzEuODQ1M0MxMzcuOTMgNzkuNDYwNSAxMzguNDU4IDg3LjEzMDcgMTM3LjQxIDk0Ljc5ODlDMTM2Ljc2MyA5OS41MzEyIDEzNS4zMzYgMTA0Ljc2NSAxMzQuOTQ1IDEwOS41MTVDMTM0LjgxOSAxMTEuMDI4IDEzNi4xMjUgMTE1LjA1OSAxMzYuNDc1IDExNi44MzdDMTM4LjA0NyAxMjQuODQ4IDEzNy42OTcgMTMyLjk4OSAxMzQuNjY1IDE0MC42MjlDMTMyLjY3OCAxNDUuNTkyIDEyOS4yOTEgMTUxLjEzOCAxMjMuODM4IDE1Mi41NkMxMjIuNDcyIDE1Mi45NTkgMTIwLjE4MiAxNTMuMjc1IDExOS4yNDggMTU0LjQzNkMxMTYuMDk5IDE1OC4zNDkgMTE1LjExIDE2NC45MDQgMTA4Ljc0MSAxNjQuNjYxQzEwNC40NTcgMTY0LjQ5OCAxMDQuMDM1IDE2MC4zMjIgMTAwLjQ2MSAxNTguOTg2Qzk4LjYwMzEgMTU4LjI5MiA5Ni41OTY4IDE1OC4wMTUgOTQuNjA3NiAxNTcuOTA0QzkwLjY0MDIgMTU3LjQ2MSA4OC4zNDQ2IDE1OC4yMjMgODUuNjAzOSAxNjEuMTE5QzgzLjMzNDMgMTYzLjUxNiA4MC40MjI4IDE2My44MzUgNzcuMjc2MyAxNjMuMzA0QzcyLjkyNyAxNjIuNTY3IDY5Ljc5NTMgMTYwLjA4NSA2Ny4yMDIyIDE1Ni41ODZDNjYuMzQ4NSAxNTUuNDMzIDY1LjM3ODMgMTU0LjEzOCA2NC4wOTg0IDE1My40NDVDNjEuNzM0NCAxNTIuMTM0IDU4LjY4OTYgMTUzLjQ4OSA1Ni40MjI0IDE1Mi4zNTdDNTEuNzgxIDE1MC4wMzggNTMuODQ0IDE0NC45NTUgNTIuNTY0NyAxNDEuMjU5QzUxLjc5NDMgMTM5LjAzMiA0OS4zMTEzIDEzOC40OTQgNDcuMzE4OSAxMzcuODhDNDYuMjYwNSAxMzcuNTY2IDQ1LjIxODggMTM3LjE5OCA0NC4xOTc4IDEzNi43NzhDMzcuMTU1NiAxMzMuNzY2IDM0LjgwMDMgMTI4LjA5NyAzMy43NTYgMTIwLjc5NkMzMy41MDY3IDExOS4xODcgMzMuNzA2MSAxMTcuNDEyIDMyLjc5NjggMTE2LjAwMkMzMS43ODU2IDExNC40MzIgMjkuNDYzMiAxMTQuMTk4IDI4LjA3NTIgMTE1LjM1MkMyNS44NTk4IDExNy4xOTIgMjUuNTQ4IDEyMi4yMTcgMjUuMjE1NCAxMjQuODkxQzE0LjQwMiAxMjQuNjY3IDcuMzQ5MzMgMTE2LjMwNyA4LjU5MDc5IDEwNS41OTFDOS4wNDYyIDEwMS42NiAxMC45OTA1IDk3LjkwOTcgMTQuMDY2NCA5NS40MDkzQzE3LjQ4MjkgOTIuNjMxOCAyMi4xMjkxIDkyLjI5NTIgMjUuODU3NCA5NC42MzcyQzI3LjExODggOTUuNDExOCAyOC45MjY5IDk3LjQ0NDUgMzAuMjY3MyA5Ny40NjQ2QzM1LjI5MjMgOTcuNTM3OSAzNS41NzQ0IDg3LjAxMzMgMzcuNzk1NCA4NC4yMjkxQzM5Ljg0MzggODEuNjYxMyA0My41MDA2IDc5LjQxNCA0NS45ODc5IDc3LjIxOTRDNDguNzI0NyA3NC44OTU2IDUxLjQ5MzIgNzIuMDk1NyA1MS44NDQzIDY4LjMyMjlDNTIuMTYzOSA2NC40MTAxIDQ4LjEyMjEgNjcuNDg0NyA0Ni40ODMgNjguMTUxN0M0Mi43NjkzIDY5LjY2MjggMzguODg2MyA3MC44MzgzIDM0Ljg1ODkgNzEuMDUzOUMzMy41MTkyIDcxLjEyNTcgMzEuOTczNiA3MC4zOTc2IDMyLjE1NDMgNjguODQzNUMzMi40MjMyIDY2LjUzMSAzNS43NTUgNjcuMTg4NiAzNy4zNTUyIDY2Ljc0MjZDNDIuMTIyMiA2NS43ODM3IDQ2LjkyMzUgNjQuMTM5NSA1MC43NzUyIDYxLjA4NjhDNTIuOTgxOSA1OS4zMzc3IDUzLjU5NTQgNTYuMjI5MyA1My45Mzc0IDUzLjU5NzhDNTQuMDMwNSA1Mi44ODcxIDUzLjg4NzEgNTEuODA2MiA1My4yMDg0IDUxLjUxMTZDNTIuOTY1OSA1MS40MDY1IDUxLjEzNDMgNTEuOTUxNCA1MC43OTk2IDUyLjAzNTNDNDkuMTA5MiA1Mi40NTk0IDQ3LjM2MjcgNTIuNjE2OCA0NS42MjM2IDUyLjUwMTNDNDMuNjk2IDUyLjM3NjIgMzkuMTQ1MSA1MS41OTc2IDM3Ljg2MzQgNTAuMDM0MUMzNy41MTE1IDQ5LjYwOSAzNy4zNTMxIDQ5LjA1NjIgMzcuNDI2OCA0OC41MDkyQzM3Ljc5MTUgNDUuNzkwNCA0MC44ODE2IDQ3LjQ3ODggNDIuMzAxNyA0Ny45NzYxQzQ2LjgxMDcgNDkuNTU1NCA1Mi40ODI2IDQ4Ljc2NDkgNTUuNzY4NiA0NS4wODA3QzU2LjQ0MTcgNDQuMzI2MSA1Ni45MjQ3IDQzLjQzNTQgNTcuNjQ2NiA0Mi43NjI1QzU3Ljg4MDQgNDIuNTU3NyA2MC44MTY1IDQzLjg3MzEgNjEuMzE3MiA0My45MDUyQzY2LjkzMzQgNDUuNjE0OCA3NS4zMjk4IDQ0LjQyNjMgODAuNDYxIDQxLjQ4ODhaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNODMuNDk3NyAxMjEuN0M4NC4zOTE4IDEyMS45NzYgODUuNDYwOCAxMjIuMjk3IDg2LjQwNzIgMTIyLjM0NkM4OC43NDcgMTIyLjQ2NiA5MC4wNDEgMTIyLjE3OCA5Mi4zMzA2IDEyMi45NDJDOTUuNDgzMyAxMjMuOTU4IDk3LjYxMDEgMTI2Ljk3MiAxMDEuMDU4IDEyNy4xMTNDMTA0LjYyNSAxMjcuMjU5IDExMS4yNDcgMTI1LjI5MSAxMTEuNTU0IDEyMC45MTJDMTExLjY0OSAxMTkuNTUyIDExMC44MzYgMTE3LjI4MSAxMTAuMzQyIDExNS45NjlDMTA4LjM3NiAxMTAuNjkgMTA2LjM1NyAxMDUuNDkgMTA1LjAyOSA5OS45ODkyQzEwNC42NzcgOTcuOTYwOCAxMDIuNjI1IDkxLjkyMjIgMTA2LjE5NiA5MS45NDc4QzEwNi41MDYgOTEuOTUwMSAxMDcuMzg2IDkyLjM0NjIgMTA3LjU0IDkyLjYxNzZDMTA4LjExNCA5My43MjY1IDEwOC4wNzQgOTUuMDc5NSAxMDguMjc2IDk2LjI5NTRDMTA5LjE4IDEwMS43NDQgMTExLjI5IDEwNi45NTMgMTEzLjExNyAxMTIuMTQ1QzExNS4wNDIgMTE3LjYxNyAxMTguMTM4IDEyMi43NjcgMTEyLjE5NSAxMjYuODQ2QzExMy4xMzEgMTI3LjA1NSAxMTMuOTcgMTI3LjM3IDExNC44NyAxMjcuNjkxQzEyMS4yNzUgMTI5Ljk2NyAxMjcuODIxIDEzNS4wMTggMTI3LjA0OCAxNDIuNTY3QzEyNi44MTggMTQ0LjgxNiAxMjUuMjgyIDE0Ny4yODUgMTIyLjY3IDE0Ni43NEMxMjAuMTY3IDE0Ni4yMiAxMTguNTcgMTQzLjggMTE3LjIzNyAxNDEuODI5QzExNS40MDIgMTQzLjc5MSAxMTMuMjE4IDE0Mi43NDcgMTExLjMyOSAxNDEuNDg3TDExMS4yOTUgMTQyLjEyNUMxMTEuMTA4IDE0My43NjMgMTEwLjI0MyAxNDUuNCAxMDkuMzYyIDE0Ni43NDhDMTA0LjEyNiAxNTQuNzU0IDk0LjQ3MzYgMTU1LjA2OSA4Ny4wNzIzIDE0OS44MzJDODMuMjU1NiAxNDcuMTMyIDc5LjU1ODQgMTQzLjIzMiA3OC42NjczIDEzOC40NTdDNzguNDI4MiAxMzguNTEzIDc4LjE4OTEgMTM4LjU2NCA3Ny45NDkgMTM4LjYxQzc1LjU2MzUgMTM5LjA1NCA3MS42NTM2IDEzOC44MzYgNzEuMTc4MSAxMzUuODMxQzY4Ljc2MzMgMTM3LjM2NyA2NS42NzA3IDE0MS4xNTEgNjMuMDIzOCAxNDEuNjg4QzU2Ljc4NzMgMTQyLjk1MSA1Ny4yMjggMTM1LjkzIDU5LjM0ODUgMTMyLjQ0MkM2My41MDcxIDEyNS42MDIgNzAuMjAzNiAxMjMuODIxIDc3LjU2MjIgMTIyLjU3MUM3OS42MTI3IDEyMi4yMjIgODEuNTUxNyAxMjIuMjI0IDgzLjQ5NzcgMTIxLjdaIiBmaWxsPSIjMUExQTFBIi8+CjxwYXRoIGQ9Ik0xMTEuMjkgMTQyLjEyM0MxMTEuMTE0IDE0MS43NjIgMTEwLjE0MiAxNDEuMTggMTA5LjgzIDE0MC4xODlDMTEwLjM5IDE0MC41NjMgMTEwLjczOCAxNDEuMjQgMTExLjMyNCAxNDEuNDg1TDExMS4yOSAxNDIuMTIzWiIgZmlsbD0iIzAwRkYwMCIvPgo8cGF0aCBkPSJNODcuNjA2NyAxMzcuNTE3Qzg3LjY0NzkgMTM4LjIyMiA4Ni44OTE0IDEzOS4xMzYgODcuODE2NyAxMzkuODExQzkxLjE1NTEgMTQyLjI0NCA5NS4zNDQ2IDE0MC4zNTYgOTcuNzMzNiAxMzcuNzM2Qzk5Ljc5MzIgMTQxLjA0NyAxMDMuMTc0IDE0Mi42NzEgMTA3LjA0MyAxNDIuNDg1QzEwNi4yNzkgMTQ0LjIwOSAxMDUuMjY3IDE0NS42MyAxMDMuODI2IDE0Ni44NDVDMTAzLjE0MyAxNDcuNDM2IDEwMi4zODQgMTQ3LjkzNyAxMDEuNTY5IDE0OC4zM0M5NC43MDM2IDE1MS42MDcgODUuOTUzIDE0NS41MTMgODMuMDMyNSAxMzkuMzYyQzg0Ljk3NzUgMTM5LjEzNiA4NS45NjcxIDEzOC41NDcgODcuNjA2NyAxMzcuNTE3WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTY4LjA3MjUgNzQuNTczNEM2OS44NDMxIDc0LjQwMzkgNzEuNjE0OSA3NC41MzU2IDczLjM3NjQgNzQuNzM5Qzc2LjU2OTcgNzUuMTA3NiA4OS40NDAzIDc3LjU5NTMgOTEuMjM5NyA4MC4wMjk1QzkxLjY0NjYgODAuNTc5OSA5MS43MTE5IDgxLjMxMDcgOTEuNjA3NCA4MS45Njg0QzkxLjQyNzUgODMuMDkzMiA5MC43NjQ1IDg0LjE2ODIgODkuODI4MSA4NC44MjExQzg5LjI0MDQgODUuMjMwOSA4OC41NjczIDg1LjQxMSA4Ny44NTQgODUuNDAwMkM4NS44NzQ4IDg1LjM3MDEgODMuNjgyNiA4NC41OTE2IDgxLjc1MzcgODQuMTM4NkM3OS44NTk5IDgzLjcwNjcgNzcuOTU1MSA4My4zMjE0IDc2LjA0MjIgODIuOTgzMUM3MC4wNDY3IDgxLjc3ODcgNjUuOTcxNiA4MS43Mzc2IDYwLjE4NDEgODMuODI1OEM1OC42OTM4IDg0LjI3OTQgNTcuMjA1NiA4NS4xNDY4IDU1LjY4OTkgODUuNDY3M0M1NC41ODY1IDg1LjcwMDcgNTMuMjYyNyA4NS4xOTg2IDUzLjIwOTkgODMuOTM5NEM1My4xMjg1IDgxLjk5NjIgNTQuODIzMSA4MC41OTcyIDU2LjIwNTEgNzkuNTQwM0M1OS42NDkyIDc2LjkwNjQgNjMuNzM4OCA3NS4wMjA5IDY4LjA3MjUgNzQuNTczNFoiIGZpbGw9IiMxQTFBMUEiLz4KPHBhdGggZD0iTTExMy42MzUgODQuMTk1NEMxMTcuOTY0IDgzLjg3OTUgMTIzLjc5OCA4NC45Mzc3IDEyNy45NzcgODYuMDkyNkMxMzEuMjYxIDg3LjEwMDcgMTMzLjY2OSA4OC43ODU4IDEzNS4zMiA5MS44MjA0QzEzNi4yOTYgOTMuNjE0MiAxMzUuOTc1IDk3LjEzODYgMTMzLjM2NiA5Ni4xNTRDMTMyLjI3MiA5NS40OTcgMTMwLjk0MyA5NC42NzQ3IDEyOS43NzQgOTQuMTkxOEMxMjUuNzIxIDkyLjUxNjMgMTIxLjEwNiA5MS45MjE0IDExNi44MjQgOTEuMDMzNUMxMTUuNjYgOTAuNzkyIDExMi45NCA5MC4zNzk4IDExMS45OTIgODkuODk3QzExMS40MDYgODkuNTk3IDExMC45NjggODkuMDcwNCAxMTAuNzgxIDg4LjQzOTRDMTEwLjE3NyA4Ni4zNDEzIDExMS42NjkgODQuNjkxNyAxMTMuNjM1IDg0LjE5NTRaIiBmaWxsPSIjMUExQTFBIi8+CjxwYXRoIGQ9Ik02OC43MDggODkuMTYwNUM3MS4yMzYgODkuMTAyOCA3My4zMzI4IDkxLjEwNDMgNzMuMzkyNiA5My42MzI0QzczLjQ1MjQgOTYuMTYwNSA3MS40NTI1IDk4LjI1OSA2OC45MjQ2IDk4LjMyMDRDNjYuMzkzOCA5OC4zODI1IDY0LjI5MjYgOTYuMzc5NyA2NC4yMzI4IDkzLjg0OUM2NC4xNzI5IDkxLjMxODEgNjYuMTc3MSA4OS4yMTg0IDY4LjcwOCA4OS4xNjA1WiIgZmlsbD0iIzFBMUExQSIvPgo8cGF0aCBkPSJNMTE4LjcyMiA5Ni43NjI4QzExOS45NCA5Ni42NTAyIDEyMC44MTUgOTYuNzExNiAxMjEuOTQ3IDk3LjE4NUMxMjQuOTMgOTguNDMwOSAxMjUuMzA5IDEwMi4wNiAxMjMuMDU2IDEwNC4yMjRDMTIyLjQ3NCAxMDQuNzgzIDEyMS45MzkgMTA1LjA0MiAxMjEuMTk0IDEwNS4zMTdDMTE1LjE0NiAxMDYuMjY0IDExMi45MTcgOTguMjk5MSAxMTguNzIyIDk2Ljc2MjhaIiBmaWxsPSIjMUExQTFBIi8+CjxwYXRoIGQ9Ik0xMjcuODUzIDQ2LjcxNzlDMTI4Ljg0MSA0Ni43MjEyIDEyOS44NzUgNDcuMDY3OSAxMjkuOTg2IDQ4LjE5NjRDMTMwLjExOSA0OS41NTEgMTI5LjE3NyA1MC42NTAyIDEyOC4zOTIgNTEuNjM5NEMxMzEuNjMyIDU1LjkzNDEgMTM2LjM0NCA1OC43OTE2IDE0MS43NjggNTYuNzI2NEMxNDMgNTYuMjU3NiAxNDQuNzQyIDU0LjcyNSAxNDUuOTczIDU1LjY5NTVDMTQ2LjM5NCA1Ni4wMzQ1IDE0Ni42NTkgNTYuNTMwOSAxNDYuNzA1IDU3LjA2OThDMTQ2Ljk0MSA1OS44MTc5IDE0MC45NiA2MS4zNjE4IDEzOC44NzcgNjEuNDI5M0MxMzQuMzY4IDYxLjU3NTQgMTMxLjIzMiA1OS44NjU4IDEyNy45OTQgNTYuOTc4M0MxMjYuOTQ4IDU1Ljk1MjYgMTI2LjMxOSA1NS4xNDUzIDEyNS40NDcgNTMuOTkzM0MxMjEuNjM3IDU2LjIzNDQgMTE4LjAzMyA1Ny4zNjY2IDExMy42MDcgNTYuNDQzNUMxMTAuNzExIDU1LjgzOTggMTA3Ljg1MiA1NC40OTg2IDEwNi4xODEgNTEuOTcxM0MxMDYuOTk5IDUxLjI2MDUgMTA4LjExMyA1MC42ODA5IDEwOS4wNzIgNTAuMTc4M0MxMDkuOTcxIDUwLjc1NTMgMTEwLjYyIDUxLjI1NDEgMTExLjU5OSA1MS43MTM4QzExNi4wOTcgNTMuODIyOSAxMjAuODk2IDUyLjcxNDMgMTI0LjU0MSA0OS40OTkyQzEyNS41ODcgNDguNTc2NSAxMjYuNDY2IDQ3LjE2MjQgMTI3LjczOSA0Ni43NTU5QzEyNy43NzcgNDYuNzQzMiAxMjcuODE0IDQ2LjczMDYgMTI3Ljg1MyA0Ni43MTc5WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTg0LjkwOTIgMzYuMTcyM0M4Ni45ODg5IDM2LjA5NzMgODcuMTAzNCAzNy4zNDI4IDg3LjkwODEgMzguOTUyNEM4OC44NTY1IDQwLjgyNzUgOTAuMjQzIDQyLjQ0NjkgOTEuOTQ4OSA0My42NzM2Qzk2LjIwNTYgNDYuNjkyMSAxMDEuNjEyIDQ2LjY5OTYgMTA1Ljg0MyA0My42Mzg5QzEwNi44MzcgNDMuMTg4NyAxMDguNTA2IDQwLjk3NDEgMTA5LjYwMSA0MC45ODNDMTEyLjg5NyA0MS4wMDk1IDExMS42NjcgNDMuODAwOCAxMTAuMzU3IDQ1LjIyNTNDMTA4Ljc3NSA0Ni44MDk3IDEwNy4zMjYgNDcuNjQ3MSAxMDUuMzQ2IDQ4LjU5M0M5Ny4yMDkyIDUyLjQ4MDMgODcuMzcyNiA0Ny45NTg0IDgzLjgzMDIgMzkuOTU2M0M4My4wOTE4IDM4LjI4NjggODMuMDA2NCAzNi45NTI5IDg0LjkwOTIgMzYuMTcyM1oiIGZpbGw9IndoaXRlIi8+CjwvZz48L3N2Zz4="

const RENDER_SIZE = 640
// Share of the visible artwork that counts as "complete"
const COMPLETE_AT = 0.95
// Label timings (ms)
const FADE_MS = 400
// hold: time fully visible. mandatory: the next stage waits for it to finish.
// next: stage to move to when the hold ends (otherwise the pill just hides).
const STAGES: Record<number, { hold: number; mandatory: boolean; next?: number } | undefined> = {
    1: { hold: 4000, mandatory: true },
    2: { hold: 3000, mandatory: false },
    3: { hold: 2000, mandatory: true, next: 4 },
}
// The initial "drag" label stays for this long once the cursor first sees it
const DRAG_HOLD_MS = 2000
const LABEL_FONT = '"Google Sans", "Google Sans Placeholder", "Manrope", sans-serif'
const LABEL_GAP = 32
const EDGE = 8

/**
 * Unpixelate Portrait (Cursor Label test copy)
 *
 * Move your cursor over the portrait to reveal pixel-art, one block at a time, one block at a time. Every cell your brush passes over flips on and stays revealed.
 *
 * @framerIntrinsicWidth 480
 * @framerIntrinsicHeight 480
 *
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function UnpixelatePortraitLabel(props: UnpixelatePortraitProps) {
    const {
        image = { src: DEFAULT_IMAGE_SRC, alt: "Portrait" },
        gridSize = 53,
        brushSize = 2.5,
        padding = "0px",
        cursorLabel = "drag",
        keepGoingLabel = "Keep going 🤩",
        almostLabel = "Almost there...",
        doneLabel = "Amazing! 🎉",
        finalLabel = "It's nice to meet ya :)",
        finalImage,
        labelColor = "#5654D7",
        labelTextColor = "#FFFFFF",
        style,
    } = props

    const isStatic = useIsStaticRenderer()
    const containerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const smallCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const imgRef = useRef<HTMLImageElement | null>(null)
    const revealedRef = useRef<Uint8Array | null>(null)
    const revealedCountRef = useRef(0)
    const gridRef = useRef(gridSize)

    const contentRef = useRef<Uint8Array | null>(null)
    const contentTotalRef = useRef(0)
    const contentRevealedRef = useRef(0)
    const stageRef = useRef(0)

    const [imageReady, setImageReady] = useState(false)
    // 0 = idle, 1 = started, 2 = 70%+, 3 = complete, 4 = final greeting (1s after complete)
    const [stage, setStage] = useState(0)

    const updateStage = useCallback((next: number) => {
        if (stageRef.current === next) return
        stageRef.current = next
        setStage(next)
    }, [])

    // What the pill currently displays, and whether it is faded in. On every stage
    // change the current text fades out, the next one is swapped in, then fades in.
    // Timed stages hide themselves again after their hold time.
    const [shownStage, setShownStage] = useState(0)
    const [visible, setVisible] = useState(true)
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    const engineRef = useRef<{
        shown: number
        mandatoryUntil: number
        swap: number | undefined
        hide: number | undefined
        dragArmed: boolean
    }>({ shown: 0, mandatoryUntil: 0, swap: undefined, hide: undefined, dragArmed: true })

    useEffect(() => {
        const e = engineRef.current
        if (stage === e.shown) return

        window.clearTimeout(e.swap)
        // A mandatory stage (e.g. "Keep going") always finishes its hold first
        const wait = Math.max(0, e.mandatoryUntil - Date.now())
        e.swap = window.setTimeout(() => {
            setVisible(false)
            e.swap = window.setTimeout(() => {
                window.clearTimeout(e.hide)
                e.shown = stage
                setShownStage(stage)
                setVisible(true)
                const cfg = STAGES[stage]
                e.mandatoryUntil = cfg?.mandatory ? Date.now() + cfg.hold : 0
                if (stage === 0) e.dragArmed = true
                if (cfg) {
                    e.hide = window.setTimeout(() => {
                        if (cfg.next !== undefined) updateStage(cfg.next)
                        else setVisible(false)
                    }, cfg.hold)
                }
            }, FADE_MS)
        }, wait)
    }, [stage, updateStage])

    useEffect(() => {
        const e = engineRef.current
        return () => {
            window.clearTimeout(e.swap)
            window.clearTimeout(e.hide)
        }
    }, [])

    // Load the source image once (or whenever it changes)
    useEffect(() => {
        if (typeof window === "undefined") return
        setImageReady(false)
        const img = new window.Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
            imgRef.current = img
            startTransition(() => setImageReady(true))
        }
        img.src = image.src
        return () => {
            imgRef.current = null
        }
    }, [image.src])

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        const small = smallCanvasRef.current
        const revealed = revealedRef.current
        if (!canvas || !small || !revealed) return
        const ctx = canvas.getContext("2d")
        const sctx = small.getContext("2d", { willReadFrequently: true })
        if (!ctx || !sctx) return

        const grid = gridRef.current
        const cellPx = RENDER_SIZE / grid
        ctx.clearRect(0, 0, RENDER_SIZE, RENDER_SIZE)

        const data = sctx.getImageData(0, 0, grid, grid).data
        for (let y = 0; y < grid; y++) {
            for (let x = 0; x < grid; x++) {
                const idx = y * grid + x
                if (!revealed[idx]) continue
                const di = idx * 4
                const r = data[di]
                const g = data[di + 1]
                const b = data[di + 2]
                const a = data[di + 3] / 255
                if (a <= 0.02) continue
                ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")"
                ctx.fillRect(
                    Math.floor(x * cellPx),
                    Math.floor(y * cellPx),
                    Math.ceil(cellPx) + 1,
                    Math.ceil(cellPx) + 1
                )
            }
        }
    }, [])

    // Rebuild the downsampled grid whenever the image or grid density changes
    useEffect(() => {
        if (!imageReady) return
        const img = imgRef.current
        if (!img) return

        const grid = Math.max(4, Math.round(gridSize))
        gridRef.current = grid

        let small = smallCanvasRef.current
        if (!small) {
            small = document.createElement("canvas")
            smallCanvasRef.current = small
        }
        small.width = grid
        small.height = grid
        const sctx = small.getContext("2d", { willReadFrequently: true })
        if (!sctx) return
        sctx.imageSmoothingEnabled = true
        sctx.clearRect(0, 0, grid, grid)
        sctx.drawImage(img, 0, 0, grid, grid)

        revealedRef.current = new Uint8Array(grid * grid)
        revealedCountRef.current = 0

        // Only cells with visible artwork count towards progress
        const pixels = sctx.getImageData(0, 0, grid, grid).data
        const content = new Uint8Array(grid * grid)
        let total = 0
        for (let i = 0; i < grid * grid; i++) {
            if (pixels[i * 4 + 3] / 255 > 0.02) {
                content[i] = 1
                total++
            }
        }
        contentRef.current = content
        contentTotalRef.current = total
        contentRevealedRef.current = 0
        updateStage(0)
        draw()
    }, [imageReady, gridSize, draw, updateStage])

    const revealAt = useCallback(
        (clientX: number, clientY: number) => {
            const canvas = canvasRef.current
            const revealed = revealedRef.current
            if (!canvas || !revealed) return
            const rect = canvas.getBoundingClientRect()
            if (rect.width === 0 || rect.height === 0) return

            const grid = gridRef.current
            const cellPx = RENDER_SIZE / grid
            const scaleX = RENDER_SIZE / rect.width
            const scaleY = RENDER_SIZE / rect.height
            const px = (clientX - rect.left) * scaleX
            const py = (clientY - rect.top) * scaleY
            const cx = px / cellPx
            const cy = py / cellPx
            const r = brushSize

            const minX = Math.max(0, Math.floor(cx - r))
            const maxX = Math.min(grid - 1, Math.ceil(cx + r))
            const minY = Math.max(0, Math.floor(cy - r))
            const maxY = Math.min(grid - 1, Math.ceil(cy + r))

            let changed = false
            for (let y = minY; y <= maxY; y++) {
                for (let x = minX; x <= maxX; x++) {
                    const dx = x + 0.5 - cx
                    const dy = y + 0.5 - cy
                    if (dx * dx + dy * dy <= r * r) {
                        const idx = y * grid + x
                        if (!revealed[idx]) {
                            revealed[idx] = 1
                            revealedCountRef.current++
                            if (contentRef.current?.[idx]) contentRevealedRef.current++
                            changed = true
                        }
                    }
                }
            }
            if (changed) {
                const total = contentTotalRef.current
                const progress = total > 0 ? contentRevealedRef.current / total : 0
                if (stageRef.current < 3) {
                    if (progress >= COMPLETE_AT) {
                        // Finish the portrait so it never ends with stray gaps
                        revealed.fill(1)
                        contentRevealedRef.current = total
                        updateStage(3)
                    } else if (progress >= 0.7) {
                        updateStage(2)
                    } else if (progress > 0) {
                        updateStage(1)
                    }
                }
                draw()
            }
        },
        [brushSize, draw, updateStage]
    )

    // Cursor label: a small bubble that trails the pointer (top-right of it) while
    // hovering. Moved via direct DOM writes so pointer moves never re-render React.
    const labelRef = useRef<HTMLDivElement>(null)

    const moveLabel = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
        const label = labelRef.current
        if (!label) return
        // First time the cursor sees the "drag" pill: keep it up for a moment
        const engine = engineRef.current
        if (engine.dragArmed && engine.shown === 0) {
            engine.dragArmed = false
            engine.mandatoryUntil = Date.now() + DRAG_HOLD_MS
        }
        if (e.pointerType === "touch") {
            label.style.opacity = "0"
            return
        }
        // Fixed viewport coordinates (the pill lives in a portal on <body> so no
        // parent frame can clip it). Flip to the other side near the screen edges.
        const w = label.offsetWidth
        const h = label.offsetHeight
        let x = e.clientX + LABEL_GAP
        let y = e.clientY - LABEL_GAP - h
        if (x + w > window.innerWidth - EDGE) x = e.clientX - LABEL_GAP - w
        if (y < EDGE) y = e.clientY + LABEL_GAP
        x = Math.max(EDGE, x)
        label.style.transform = `translate3d(${x}px, ${y}px, 0)`
        label.style.opacity = "1"
    }, [])

    const hideLabel = useCallback(() => {
        if (labelRef.current) labelRef.current.style.opacity = "0"
    }, [])

    const handlePointerMove = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            moveLabel(e)
            revealAt(e.clientX, e.clientY)
        },
        [isStatic, revealAt, moveLabel]
    )

    const handlePointerDown = useCallback(
        (e: ReactPointerEvent<HTMLDivElement>) => {
            if (isStatic) return
            moveLabel(e)
            revealAt(e.clientX, e.clientY)
        },
        [isStatic, revealAt, moveLabel]
    )

    // The outer wrapper is a neutral, passive container: it owns the padding and
    // establishes a CSS query container so the inner stage can size itself to
    // "100cqmin" (100% of whichever is smaller, the padded width or height) —
    // a pure-CSS square-that-fits, with no JS measurement involved. This keeps
    // padding and sizing correct everywhere, including Framer's canvas/thumbnail
    // renderers, which don't always run client JS the way a published page does.
    const wrapperStyle = {
        position: "relative",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        padding,
        containerType: "size",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        ...style,
    } as CSSProperties

    const stageStyle = {
        position: "relative",
        width: "100cqmin",
        height: "100cqmin",
        overflow: "hidden",
        background: "transparent",
        cursor: "crosshair",
        touchAction: "none",
        userSelect: "none",
    } as CSSProperties

    return (
        <div ref={containerRef} style={wrapperStyle}>
            <div style={stageStyle} onPointerMove={handlePointerMove} onPointerDown={handlePointerDown} onPointerEnter={moveLabel} onPointerLeave={hideLabel}>
                <canvas
                    ref={canvasRef}
                    width={RENDER_SIZE}
                    height={RENDER_SIZE}
                    style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        imageRendering: "pixelated",
                        pointerEvents: "none",
                    }}
                    aria-label={image.alt ?? "Scrub to reveal a pixel-art portrait"}
                />
            </div>
            {!isStatic && mounted
                ? createPortal(
                <div
                    ref={labelRef}
                    aria-hidden
                    style={{
                        position: "fixed",
                        left: 0,
                        top: 0,
                        opacity: 0,
                        transition: "opacity 0.15s ease",
                        pointerEvents: "none",
                        zIndex: 2147483647,
                        willChange: "transform",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 14px",
                            borderRadius: "14px 14px 14px 0",
                            background: labelColor,
                            color: labelTextColor,
                            fontFamily: LABEL_FONT,
                            fontSize: 16,
                            fontWeight: 500,
                            lineHeight: 1.2,
                            whiteSpace: "nowrap",
                            opacity: visible ? 1 : 0,
                            transition: `opacity ${FADE_MS}ms ease`,
                        }}
                    >
                        {[cursorLabel, keepGoingLabel, almostLabel, doneLabel, finalLabel][shownStage]}
                        {shownStage === 4 && finalImage?.src ? (
                            <img
                                src={finalImage.src}
                                alt={finalImage.alt ?? ""}
                                style={{ height: "1.5em", width: "auto", display: "block", margin: "-3px 0" }}
                            />
                        ) : null}
                    </div>
                </div>,
                      document.body
                  )
                : null}
        </div>
    )
}

addPropertyControls(UnpixelatePortraitLabel, {
    image: {
        type: ControlType.ResponsiveImage,
        title: "Image",
    },
    gridSize: {
        type: ControlType.Number,
        title: "Grid Density",
        defaultValue: 53,
        min: 12,
        max: 80,
        step: 1,
    },
    brushSize: {
        type: ControlType.Number,
        title: "Brush Size",
        defaultValue: 2.5,
        min: 1,
        max: 8,
        step: 0.1,
    },
    cursorLabel: {
        type: ControlType.String,
        title: "Cursor Label",
        defaultValue: "drag",
    },
    keepGoingLabel: {
        type: ControlType.String,
        title: "Started",
        defaultValue: "Keep going 🤩",
    },
    almostLabel: {
        type: ControlType.String,
        title: "70%+",
        defaultValue: "Almost there...",
    },
    doneLabel: {
        type: ControlType.String,
        title: "Complete",
        defaultValue: "Amazing! 🎉",
    },
    finalLabel: {
        type: ControlType.String,
        title: "After 1s",
        defaultValue: "It's nice to meet ya :)",
    },
    finalImage: {
        type: ControlType.ResponsiveImage,
        title: "Final Emoji",
    },
    labelColor: {
        type: ControlType.Color,
        title: "Label BG",
        defaultValue: "#5654D7",
    },
    labelTextColor: {
        type: ControlType.Color,
        title: "Label Text",
        defaultValue: "#FFFFFF",
    },
    padding: {
        type: ControlType.Padding,
        title: "Padding",
        description: "Inner padding around the reveal stage, on each side.",
        defaultValue: "0px",
    },
})
