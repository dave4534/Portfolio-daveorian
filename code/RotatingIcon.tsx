// @ts-nocheck
/**
 * Framer RotatingIcon — vanilla Three.js against Framer's bundled r136.
 * No @react-three/fiber. Do not copy over dev-sandbox/src/RotatingIcon.tsx.
 */
import { addPropertyControls, ControlType, useIsStaticRenderer } from "framer"
import * as React from "react"
import { useEffect, useRef, useState, type CSSProperties } from "react"
import * as THREE from "three"

const SALESFORCE_LOGO_DATA_URI =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik00NC45NzQzIDMzLjA5MzFDNDYuODkyIDMxLjA0NzcgNDkuNjAzMiAyOS44MDI3IDUyLjU3OSAyOS44MDI3QzU2LjU0NjcgMjkuODAyNyA1OS45ODUzIDMyLjAyNiA2MS44MzY5IDM1LjMzODZDNjMuNDQ2IDM0LjYyNzIgNjUuMjA5NCAzNC4yMjcgNjcuMDYxIDM0LjIyN0M3NC4yMDI4IDM0LjIyNyA4MCA0MC4xMTg2IDgwIDQ3LjM4ODZDODAgNTQuNjU4NyA3NC4yMDI4IDYwLjU1MDMgNjcuMDYxIDYwLjU1MDNDNjYuMTc5MyA2MC41NTAzIDY1LjM0MTcgNjAuNDYxMyA2NC41MDQgNjAuMjgzNUM2Mi44OTQ5IDYzLjE5NTkgNTkuNzg2OSA2NS4xNzQ2IDU2LjI2MDEgNjUuMTc0NkM1NC43ODMyIDY1LjE3NDYgNTMuMzcyNSA2NC44MTg5IDUyLjExNjEgNjQuMjE4NkM1MC40NjI5IDY4LjEwOTMgNDYuNjQ5NSA3MC44NDM5IDQyLjE5NjkgNzAuODQzOUMzNy41NDU5IDcwLjg0MzkgMzMuNjAwMyA2Ny44ODcgMzIuMDc5NCA2My43Mjk1QzMxLjQxODEgNjMuODYyOSAzMC43MzQ4IDYzLjk1MTggMzAuMDI5NCA2My45NTE4QzI0LjQ3NDcgNjMuOTA3NCAyMCA1OS4zNDk3IDIwIDUzLjcwMjdDMjAgNDkuOTIzMSAyMi4wMDU5IDQ2LjYzMjcgMjUuMDAzNyA0NC44NTQxQzI0LjM4NjUgNDMuNDMxMiAyNC4wNTU4IDQxLjg1MjcgMjQuMDU1OCA0MC4xODUzQzI0LjA1NTggMzMuNzE1NiAyOS4yNTc5IDI4LjQ2ODggMzUuNjk0MyAyOC40Njg4QzM5LjQ4NTcgMjguNDY4OCA0Mi44MzYyIDMwLjI2OTYgNDQuOTc0MyAzMy4wOTMxVjMzLjA5MzFaIiBmaWxsPSIjMEQ5RERBIi8+CjxwYXRoIGQ9Ik01NC45MzYxIDQzLjIzMjVDNTUuMTEyMyA0My4yMzI1IDU1LjI2NjggNDMuMjU1MyA1NS4zOTkgNDMuMjc3NUM1NS41MzEyIDQzLjI5OTcgNTUuNjQyMyA0My4zMjE5IDU1Ljc1MjUgNDMuMzY2M0M1NS43NzQ5IDQzLjM4ODQgNTUuODM5NiA0My40MTA4IDU1Ljc3NCA0My40OTkxTDU1LjUwOTMgNDQuMjMyNUM1NS40ODczIDQ0LjI3NyA1NS40NjUyIDQ0LjMyMTkgNTUuMzU1IDQ0LjI3NzVDNTUuMzMyOSA0NC4yNzczIDU1LjI4ODkgNDQuMjU0NyA1NS4xNzkyIDQ0LjIzMjVDNTUuMDkxMSA0NC4yMzI1IDU1LjAwMjMgNDQuMjExMSA1NC44OTIxIDQ0LjIxMTFDNTQuNzYwMSA0NC4yMTExIDU0LjYyODIgNDQuMjEwOCA1NC41MTgxIDQ0LjI1NUM1NC40MDc5IDQ0LjI3NzIgNTQuMzE5MSA0NC4zNDM5IDU0LjIzMSA0NC40MzI3QzU0LjE0MjkgNDQuNTIxNiA1NC4wMzMgNDQuNjU1MiA1My45ODg4IDQ0LjgxMDdDNTMuODc4NiA0NS4xODg2IDUzLjgxMjEgNDUuNTg5MiA1My44MTIxIDQ1LjYxMTVINTQuOTE0NkM1NS4wMDI2IDQ1LjYxMTUgNTUuMDI0OSA0NS42NTYxIDU1LjAyNDkgNDUuNzIyOEw1NC44OTIxIDQ2LjQ1NjJDNTQuODcwMSA0Ni41NjczIDU0Ljc4MTggNDYuNTY3NSA1NC43ODE4IDQ2LjU2NzVINTMuNjM2M0w1Mi44NDIzIDUxLjAzNjNDNTIuNzU0MiA1MS41MDMxIDUyLjY0MzkgNTEuOTAzNyA1Mi41MzM3IDUyLjIxNUM1Mi40MjM2IDUyLjUyNTggNTIuMjkxNCA1Mi43NzAyIDUyLjA5MzMgNTIuOTkyM0M1MS45MTcgNTMuMTkyNCA1MS42OTYxIDUzLjM0ODcgNTEuNDUzNyA1My40Mzc2QzUxLjIxMTMgNTMuNTI2NSA1MC45MjQ3IDUzLjU3MDQgNTAuNTk0MyA1My41NzA0QzUwLjQ0MDEgNTMuNTcwNCA1MC4yODU2IDUzLjU3MDkgNTAuMDg3NCA1My41MjY1QzQ5Ljk1NTMgNTMuNTA0MyA0OS44ODg4IDUzLjQ4MiA0OS43Nzg4IDUzLjQzNzZDNDkuNzM0OCA1My40Mzc2IDQ5LjcxMjkgNTMuMzcwNSA0OS43MzQ5IDUzLjMwMzhDNDkuNzU3MiA1My4yMzY1IDQ5Ljk3NTYgNTIuNjYyIDQ5Ljk5ODYgNTIuNTkyOUM1MC4wNDI3IDUyLjQ4MTcgNTAuMTMxNCA1Mi41MjU1IDUwLjEzMTQgNTIuNTI1NUM1MC4xOTc1IDUyLjU0NzcgNTAuMjQxNSA1Mi41NzA3IDUwLjMyOTYgNTIuNTkyOUM1MC40MTc3IDUyLjU5MjkgNTAuNTI3NyA1Mi42MTQzIDUwLjYxNTggNTIuNjE0NEM1MC43NyA1Mi42MTQ0IDUwLjkyNDUgNTIuNTkyNCA1MS4wMzQ3IDUyLjU0OEM1MS4xNjY4IDUyLjUwMzYgNTEuMjU1MiA1Mi40MTQ4IDUxLjM0MzMgNTIuMzAzOEM1MS40MzE1IDUyLjE5MjcgNTEuNTIwMyA1Mi4wMzY4IDUxLjU4NjUgNTEuODE0NkM1MS42NTI2IDUxLjU5MjMgNTEuNzE4NiA1MS4zMDMxIDUxLjc4NDcgNTAuOTQ3NEw1Mi41NTYyIDQ2LjU2NzVINTEuNzg0N0M1MS42OTY1IDQ2LjU2NzUgNTEuNjc0NCA0Ni41MjI5IDUxLjY3NDQgNDYuNDU2Mkw1MS44MDYyIDQ1LjcyMjhDNTEuODI3OCA0NS42MTM4IDUxLjkxMzIgNDUuNjExNSA1MS45MTY1IDQ1LjYxMTVINTIuNzEwNUw1Mi43NTQ0IDQ1LjM2NzNDNTIuODg2NyA0NC42NTU5IDUzLjEwNjggNDQuMTIxNSA1My40NTk1IDQzLjc2NTdDNTMuODEyMSA0My40MTAyIDU0LjI5NzEgNDMuMjMyNiA1NC45MzYxIDQzLjIzMjVaTTMwLjg0NTMgNDUuNDc3N0MzMS41MDYzIDQ1LjQ3NzcgMzIuMTQ1MiA0NS42NTU1IDMyLjYwNzkgNDUuOTQ0NUMzMi42NTIgNDUuOTY2NyAzMi42OTYxIDQ2LjAxMDggMzIuNjc0NCA0Ni4wNzczQzMyLjY1MjMgNDYuMTQzOSAzMi40NTQ2IDQ2LjY5OSAzMi40MzIyIDQ2Ljc2NjdDMzIuMzg5NSA0Ni44NzQyIDMyLjI4NDcgNDYuODE1NiAzMi4yNzc5IDQ2LjgxMTZDMzEuODgxMSA0Ni41ODkzIDMxLjI0MTUgNDYuNDExMyAzMC43MTI0IDQ2LjQxMTNDMzAuMjI3NiA0Ni40MTEzIDI5LjkxOTUgNDYuNjU2MSAyOS45MTk1IDQ3LjAxMThWNDcuMDMzM0MyOS45MTk1IDQ3LjQzMzUgMzAuNDQ3OSA0Ny42MTE2IDMxLjA2NSA0Ny44MTE2TDMxLjE3NTMgNDcuODU2NkMzMS45OTA5IDQ4LjEyMzQgMzIuODUxMSA0OC40Nzg5IDMyLjg1MTEgNDkuNDU3MlY0OS40Nzk2QzMyLjg1MDkgNTAuNTI0MiAzMi4wNzkyIDUxLjE5MTQgMzAuODQ1MyA1MS4xOTE1QzMwLjI1MDEgNTEuMTkxNSAyOS42NzYzIDUxLjEwMjIgMjkuMDU5MSA1MC43Njg3QzI4LjkyNyA1MC43MDIgMjguODE2NyA1MC42NTc0IDI4LjcwNjYgNTAuNTY4NUMyOC43MDYzIDUwLjU0NjMgMjguNjQxMyA1MC41MjQzIDI4LjY4NTEgNTAuNDM1N0wyOC45MDQ4IDQ5LjcyMzhDMjguOTI2OSA0OS41OTA0IDI5LjAxNSA0OS42MzUxIDI5LjA1OTEgNDkuNjU3M0MyOS4xMjUxIDQ5LjcwMTcgMjkuMTY5NSA0OS43NDU4IDI5LjI1NzQgNDkuNzkwMkMyOS45ODQ4IDUwLjI1NyAzMC42NDY5IDUwLjI1NyAzMC44NDUzIDUwLjI1N0MzMS4zNzQgNTAuMjU2OCAzMS43MDQ2IDQ5Ljk2NzggMzEuNzA0NiA0OS41OVY0OS41Njg1QzMxLjcwNDYgNDkuMTQ2MSAzMS4xOTcyIDQ4Ljk5MDUgMzAuNjAyMSA0OC44MTI2TDMwLjQ3MDMgNDguNzY3N0MyOS42NTQ3IDQ4LjU0NTQgMjguNzk0NSA0OC4yMTIgMjguNzk0NSA0Ny4xNjcxVjQ3LjE0NDdDMjguNzk0NiA0Ni4xNjY1IDI5LjU4ODQgNDUuNDc3NyAzMC43MTI0IDQ1LjQ3NzdIMzAuODQ1M1pNNDguODc1NSA0NS40Nzc3QzQ5LjUzNjggNDUuNDc3NyA1MC4xNzYzIDQ1LjY1NTQgNTAuNjM5MiA0NS45NDQ1QzUwLjY4MzEgNDUuOTY2NyA1MC43MjczIDQ2LjAxMDkgNTAuNzA1NiA0Ni4wNzczQzUwLjY4MzYgNDYuMTQ0IDUwLjQ4NDYgNDYuNjk5OCA1MC40NjI0IDQ2Ljc2NjdDNTAuNDE4NCA0Ni44Nzc5IDUwLjMwODEgNDYuODExNiA1MC4zMDgxIDQ2LjgxMTZDNDkuOTExNCA0Ni41ODk0IDQ5LjI3MjYgNDYuNDExMyA0OC43NDM3IDQ2LjQxMTNDNDguMjU4OCA0Ni40MTEzIDQ3Ljk0OTcgNDYuNjU2MSA0Ny45NDk3IDQ3LjAxMThWNDcuMDMzM0M0Ny45NDk3IDQ3LjQzMzUgNDguNDc5IDQ3LjYxMTYgNDkuMDk2MiA0Ny44MTE2TDQ5LjIwNjYgNDcuODU2NkM1MC4wMjIxIDQ4LjEyMzMgNTAuODgxNCA0OC40NzkxIDUwLjg4MTQgNDkuNDU3MlY0OS40Nzk2QzUwLjg4MTIgNTAuNTI0MyA1MC4xMDk4IDUxLjE5MTUgNDguODc1NSA1MS4xOTE1QzQ4LjI4MDUgNTEuMTkxNSA0Ny43MDc1IDUxLjEwMjEgNDcuMDkwNCA1MC43Njg3QzQ2Ljk1ODIgNTAuNzAyIDQ2Ljg0OCA1MC42NTc0IDQ2LjczNzggNTAuNTY4NUM0Ni43Mzc1IDUwLjU0NjMgNDYuNjcxOCA1MC41MjQxIDQ2LjcxNTQgNTAuNDM1N0w0Ni45MzYxIDQ5LjcyMzhDNDYuOTU4MSA0OS42MTI3IDQ3LjA2ODMgNDkuNjM1MSA0Ny4wOTA0IDQ5LjY1NzNDNDcuMTU2MyA0OS43MDE3IDQ3LjIwMDYgNDkuNzQ1OCA0Ny4yODg2IDQ5Ljc5MDJDNDguMDE1OCA1MC4yNTY5IDQ4LjY3NyA1MC4yNTcgNDguODc1NSA1MC4yNTdDNDkuNDA0NSA1MC4yNTcgNDkuNzM0OSA0OS45Njc5IDQ5LjczNDkgNDkuNTlWNDkuNTY4NUM0OS43MzQ5IDQ5LjE0NjEgNDkuMjI4NCA0OC45OTA1IDQ4LjYzMzMgNDguODEyNkw0OC41MDA1IDQ4Ljc2NzdDNDcuNjg1MSA0OC41NDU0IDQ2LjgyNTggNDguMjExOCA0Ni44MjU3IDQ3LjE2NzFWNDcuMTQ0N0M0Ni44MjU4IDQ2LjE2NjUgNDcuNjE5NiA0NS40Nzc3IDQ4Ljc0MzcgNDUuNDc3N0g0OC44NzU1Wk02Ny4xMjY1IDQ1LjUyMjZDNjcuNDEyOSA0NS41MjI2IDY3LjY3NzYgNDUuNTIzMSA2Ny44OTggNDUuNTY3NUM2OC4xNDA0IDQ1LjYxMiA2OC40NDkzIDQ1LjcwMDggNjguNTgxNiA0NS43NDUyQzY4LjYwMzYgNDUuNzQ1MiA2OC42NyA0NS43Njc2IDY4LjY0OCA0NS44NTY2QzY4LjU1OTkgNDYuMTQ1MyA2OC40OTM5IDQ2LjMyMzEgNjguNDA1OCA0Ni41Njc1QzY4LjM4NDEgNDYuNjc3IDY4LjI5OCA0Ni42MzUyIDY4LjI5NTQgNDYuNjMzOUM2Ny45NjQ5IDQ2LjUyMjggNjcuNjM0MSA0Ni40Nzg3IDY3LjIxNTQgNDYuNDc4NkM2Ni43MDg0IDQ2LjQ3ODYgNjYuMzExNCA0Ni42NTY5IDY2LjA2ODkgNDYuOTkwNEM2NS44MDQ2IDQ3LjMyMzggNjUuNjcyNSA0Ny43NjgxIDY1LjY3MjQgNDguMzQ1OEM2NS42NzI0IDQ4Ljk5MDQgNjUuODI2NCA0OS40Nzk2IDY2LjExMjggNDkuNzY4N0M2Ni4zOTkzIDUwLjA1NzYgNjYuNzc0IDUwLjIxMzkgNjcuMjgwOCA1MC4yMTRDNjcuNTAxMSA1MC4yMTQgNjcuNjc3OCA1MC4xOTEzIDY3Ljg1NCA1MC4xNjkxQzY4LjAzMDQgNTAuMTQ2OCA2OC4xODUxIDUwLjEwMjkgNjguMzM5NCA1MC4wMzYzQzY4LjMzOTQgNTAuMDM2MyA2OC40MjcxIDQ5Ljk5MTUgNjguNDcxMiA1MC4xMDI3TDY4LjY2OTUgNTAuNzkyMUM2OC42OTEzIDUwLjg4MDkgNjguNjI1NSA1MC45MjQ5IDY4LjYyNTUgNTAuOTI0OUM2OC4yMjg5IDUxLjA4MDUgNjcuNzAwMiA1MS4xOTE1IDY3LjE3MTQgNTEuMTkxNUM2Ni4yODk4IDUxLjE5MTUgNjUuNjA2IDUwLjkyNTQgNjUuMTQzMSA1MC40MTQyQzY0LjY4MDIgNDkuOTAyOCA2NC40NTk1IDQ5LjIxMjkgNjQuNDU5NSA0OC4zNDU4QzY0LjQ1OTUgNDcuOTQ1OCA2NC41MjYxIDQ3LjU2NzkgNjQuNjM2MyA0Ny4yMzQ1QzY0Ljc0NjUgNDYuOTAxIDY0LjkyMjcgNDYuNTg5NCA2NS4xNDMxIDQ2LjM0NDhDNjUuMzYzNSA0Ni4xMDA0IDY1LjY1MDUgNDUuOTAwOCA2NS45ODEgNDUuNzQ1MkM2Ni4zMTE1IDQ1LjU4OTcgNjYuNjg1OSA0NS41MjI2IDY3LjEyNjUgNDUuNTIyNlpNMzUuODQ4MiA0NS40Nzc3QzM2LjUzMTQgNDUuNDc3NyAzNy4wNjA0IDQ1LjY1NTcgMzcuNDM1MSA0NS45NjY5QzM3LjgwOTYgNDYuMzAwNCAzNy45ODU4IDQ2LjgxMTQgMzcuOTg1OSA0Ny41MjI2VjUwLjcyNDdDMzcuOTg1NyA1MC43MzE3IDM3Ljk4MjIgNTAuODEzNyAzNy44OTggNTAuODM1MUMzNy44OTggNTAuODM1MSAzNy43NjU5IDUwLjg4MDIgMzcuNjU1OCA1MC45MDI1QzM3LjUyMzYgNTAuOTQ2OSAzNy4xMDQ2IDUxLjAxMzUgMzYuNzc0IDUxLjA4MDJDMzYuNDIxMyA1MS4xNDY5IDM2LjA2ODEgNTEuMTY5MSAzNS43MTU0IDUxLjE2OTFDMzUuMzYyOCA1MS4xNjkxIDM1LjA1NCA1MS4xNDY5IDM0Ljc4OTYgNTEuMDgwMkMzNC41MjUyIDUxLjAxMzUgMzQuMjgyOCA1MC45MDIgMzQuMDg0NSA1MC43Njg3QzMzLjg4NjIgNTAuNjEzMSAzMy43MzE4IDUwLjQzNTMgMzMuNjIxNiA1MC4yMTNDMzMuNTExNCA0OS45OTA3IDMzLjQ2NzMgNDkuNzIzNSAzMy40NjczIDQ5LjQxMjJDMzMuNDY3NCA0OS4xMjMzIDMzLjUxMTkgNDguODM0NyAzMy42NDQxIDQ4LjYxMjRDMzMuNzc2MyA0OC4zOTAxIDMzLjkzMDUgNDguMTg5OSAzNC4xNTA5IDQ4LjAzNDNDMzQuMzcxMyA0Ny44Nzg3IDM0LjYxNCA0Ny43NjcgMzQuODc4NSA0Ny43MDAzQzM1LjE0MjggNDcuNjMzNyAzNS40Mjk0IDQ3LjU4OSAzNS43Mzc4IDQ3LjU4OUMzNS45NTgxIDQ3LjU4OSAzNi4xNTY0IDQ3LjYxMTQgMzYuMjg4NiA0Ny42MTE1QzM2LjI4ODYgNDcuNjExNSAzNi41NTMyIDQ3LjYzNDQgMzYuOTA1OCA0Ny42Nzg4VjQ3LjUyMjZDMzYuOTA1OCA0Ny4wNTU5IDM2LjgxNzkgNDYuODMzNSAzNi42MTk3IDQ2LjY3NzlDMzYuNDIxMyA0Ni41MjIyIDM2LjEzNCA0Ni40NTUyIDM1Ljc1OTMgNDYuNDU1MkMzNS43Mzc3IDQ2LjQ1NTMgMzQuODkxNiA0Ni40NjA1IDM0LjIzODggNDYuODExNkMzNC4xOTQ4IDQ2LjgzMzggMzQuMTcyNCA0Ni44MzMxIDM0LjE3MjQgNDYuODMzMUMzNC4xNjgyIDQ2LjgzNDEgMzQuMDgzNSA0Ni44NTM1IDM0LjA2MjEgNDYuNzY2N0wzMy44MTk5IDQ2LjA5OTdDMzMuNzc2IDQ2LjAxMDkgMzMuODQyMyA0NS45NjY5IDMzLjg0MjMgNDUuOTY2OUMzNC4xNzMgNDUuNzIyNCAzNC45MjI0IDQ1LjU2NjUgMzQuOTIyNCA0NS41NjY1QzM1LjE2NDkgNDUuNTIyMSAzNS41ODM4IDQ1LjQ3NzcgMzUuODQ4MiA0NS40Nzc3Wk01Ny42NzA0IDQ1LjUyMTZDNTguMDg5MyA0NS41MjE2IDU4LjQ2NDQgNDUuNTg4NiA1OC43NzMgNDUuNzQ0M0M1OS4wODE1IDQ1Ljg3NzcgNTkuMzQ1NiA0Ni4xMDAzIDU5LjU2NiA0Ni4zNDQ4QzU5Ljc2NDMgNDYuNTg5MyA1OS45MTg2IDQ2LjkwMDIgNjAuMDI4OCA0Ny4yMzM1QzYwLjEzOTEgNDcuNTg5MiA2MC4xODMxIDQ3Ljk0NTYgNjAuMTgzMSA0OC4zNDU4QzYwLjE4MzEgNDguNzQ1OCA2MC4xMzkgNDkuMTIzOCA2MC4wMjg4IDQ5LjQ1NzJDNTkuOTQwNyA0OS43OTA1IDU5Ljc2NDMgNTAuMTAxMyA1OS41NjYgNTAuMzQ1OEM1OS4zNDU2IDUwLjU5MDMgNTkuMDgxNSA1MC44MTMgNTguNzczIDUwLjk0NjRDNTguNDY0NCA1MS4xMDIgNTguMDg5MyA1MS4xNjkxIDU3LjY3MDQgNTEuMTY5MUM1Ny4yNTE4IDUxLjE2OSA1Ni44Nzc0IDUxLjA3OTcgNTYuNTY4OSA1MC45NDY0QzU2LjI2MDMgNTAuODEzIDU1Ljk5NTQgNTAuNTkwNCA1NS43NzQ5IDUwLjM0NThDNTUuNTc2NyA1MC4xMDEzIDU1LjQyMjIgNDkuNzkwNSA1NS4zMTIxIDQ5LjQ1NzJDNTUuMjAxOSA0OS4xMjM4IDU1LjE1NzggNDguNzQ1OCA1NS4xNTc4IDQ4LjM0NThDNTUuMTU3OCA0Ny45NDU2IDU1LjIwMTggNDcuNTY3IDU1LjMxMjEgNDcuMjMzNUM1NS40MDAyIDQ2LjkwMDIgNTUuNTc2NyA0Ni41ODkzIDU1Ljc3NDkgNDYuMzQ0OEM1NS45OTU0IDQ2LjEwMDMgNTYuMjYwMyA0NS44OTk5IDU2LjU2ODkgNDUuNzQ0M0M1Ni44Nzc0IDQ1LjU4ODcgNTcuMjUxOCA0NS41MjE2IDU3LjY3MDQgNDUuNTIxNlpNNDMuNzgzNyA0NS41MDAxQzQ0LjE1ODUgNDUuNTAwMSA0NC40ODk0IDQ1LjU2NjkgNDQuNzc1OSA0NS43MDAzQzQ0Ljk5NjMgNDUuNzg5MyA0NS4yMTY3IDQ1Ljk2NzUgNDUuNDM3MSA0Ni4yMTJDNDUuNTY5MyA0Ni4zNjc3IDQ1Ljc4OTMgNDYuNzAxIDQ1Ljg3NzUgNDcuMDM0M0M0Ni4wOTc3IDQ3LjgzNCA0NS45ODg1IDQ4LjUyMyA0Ni4wMTAzIDQ4LjUwMjFDNDUuOTg4NCA0OC41ODk5IDQ1LjkwMTYgNDguNTkwOSA0NS44OTk5IDQ4LjU5MDlINDIuNDE3NUM0Mi40Mzk2IDQ5LjEwMjIgNDIuNTQ5NSA0OS40ODA0IDQyLjgxNCA0OS43NDcyQzQzLjA1NjUgNTAuMDEzOCA0My40NzU2IDUwLjE2OTEgNDQuMDA0NCA1MC4xNjkxQzQ0Ljg0MTkgNTAuMTY5IDQ1LjE5NDYgNDkuOTkxNCA0NS40MzcxIDQ5LjkwMjVDNDUuNDM4NSA0OS45MDIxIDQ1LjUyNTEgNDkuODgxMSA0NS41Njg5IDQ5Ljk2ODlMNDUuNzg5NiA1MC42MTM0QzQ1LjgzMzYgNTAuNzI0NCA0NS44MTIxIDUwLjc2OTggNDUuNzY4MSA1MC43OTIxQzQ1LjU2OTcgNTAuOTI1NSA0NS4wMzk5IDUxLjE0NzYgNDQuMDI1OSA1MS4xNDc2QzQzLjU0MTIgNTEuMTQ3NSA0My4xMjI2IDUxLjA4MDcgNDIuNzcwMSA1MC45NDc0QzQyLjQxNzQgNTAuODE0IDQyLjEwODYgNTAuNjEzOCA0MS44ODgyIDUwLjM2OTNDNDEuNjQ1OCA1MC4xMjQ3IDQxLjQ5MTYgNDkuODEzMSA0MS4zODE0IDQ5LjQ3OTZDNDEuMjcxMiA0OS4xNDYyIDQxLjIyNzEgNDguNzY4MyA0MS4yMjcxIDQ4LjM2ODNDNDEuMjI3MSA0Ny45NjgyIDQxLjI3MTIgNDcuNjEyNiA0MS4zODE0IDQ3LjI1N0M0MS40Njk2IDQ2LjkwMTIgNDEuNjIzOSA0Ni42MTE2IDQxLjg0NDMgNDYuMzQ0OEM0Mi4wNDI2IDQ2LjA3ODMgNDIuMzA2OSA0NS44NzgzIDQyLjYzNzIgNDUuNzIyOEM0Mi45NDU4IDQ1LjU2NzIgNDMuMzQyOSA0NS41MDAxIDQzLjc4MzcgNDUuNTAwMVpNNzEuNjIzNiA0NS41MDAxQzcxLjk5ODMgNDUuNTAwMSA3Mi4zMjkyIDQ1LjU2NjkgNzIuNjE1OCA0NS43MDAzQzcyLjgzNjEgNDUuNzg5MyA3My4wNTY1IDQ1Ljk2NzUgNzMuMjc2OSA0Ni4yMTJDNzMuNDA5MSA0Ni4zNjc3IDczLjYyOTEgNDYuNzAxIDczLjcxNzMgNDcuMDM0M0M3My45Mzc2IDQ3LjgzNDIgNzMuODI4MyA0OC41MjM0IDczLjg1MDEgNDguNTAyMUM3My44MjgzIDQ4LjU4OTUgNzMuNzQyMyA0OC41OTA5IDczLjczOTggNDguNTkwOUg3MC4yNTc0QzcwLjI3OTQgNDkuMTAyMiA3MC4zODk0IDQ5LjQ4MDQgNzAuNjUzOCA0OS43NDcyQzcwLjg5NjQgNTAuMDEzOCA3MS4zMTU0IDUwLjE2OTEgNzEuODQ0MyA1MC4xNjkxQzcyLjY4MTcgNTAuMTY5IDczLjAzNDQgNDkuOTkxNCA3My4yNzY5IDQ5LjkwMjVDNzMuMjc5MyA0OS45MDE5IDczLjM2NTIgNDkuODgxNiA3My40MDg3IDQ5Ljk2ODlMNzMuNjI5NCA1MC42MTM0QzczLjY3MzQgNTAuNzI0NCA3My42NTE5IDUwLjc2OTggNzMuNjA3OSA1MC43OTIxQzczLjQwOTYgNTAuOTI1NSA3Mi44Nzk3IDUxLjE0NzYgNzEuODY1OCA1MS4xNDc2QzcxLjM4MTEgNTEuMTQ3NiA3MC45NjI1IDUxLjA4MDcgNzAuNjA5OSA1MC45NDc0QzcwLjI1NzIgNTAuODE0IDY5Ljk0ODUgNTAuNjEzOCA2OS43MjgxIDUwLjM2OTNDNjkuNDg1NiA1MC4xMjQ3IDY5LjMzMTQgNDkuODEzMSA2OS4yMjEyIDQ5LjQ3OTZDNjkuMTExMSA0OS4xNDYyIDY5LjA2NjkgNDguNzY4NCA2OS4wNjY5IDQ4LjM2ODNDNjkuMDY2OSA0Ny45NjgyIDY5LjExMTEgNDcuNjEyNiA2OS4yMjEyIDQ3LjI1N0M2OS4zMDk0IDQ2LjkwMTIgNjkuNDYzNyA0Ni42MTE2IDY5LjY4NDEgNDYuMzQ0OEM2OS44ODI0IDQ2LjA3ODMgNzAuMTQ2NyA0NS44NzgzIDcwLjQ3NzEgNDUuNzIyOEM3MC43ODU3IDQ1LjU2NzIgNzEuMTgyNyA0NS41MDAxIDcxLjYyMzYgNDUuNTAwMVpNNjMuNzA5NSA0NS41ODlDNjMuOTI5OSA0NS41ODkgNjQuMjE2NiA0NS42NTU2IDY0LjI4MjggNDUuNjc3OUM2NC4zMDQ4IDQ1LjcwMDEgNjQuMzQ4NyA0NS43MjI3IDY0LjMyNjcgNDUuODExNkM2NC4zMDQ1IDQ1LjkwMDggNjQuMTI3NyA0Ni4zNjczIDY0LjAzOTYgNDYuNTQ1QzY0LjAxNzUgNDYuNTg5NSA2My45NzM4IDQ2LjYzMzkgNjMuOTA3OCA0Ni42MzM5QzYzLjkwMjUgNDYuNjMyNyA2My43MDY3IDQ2LjU5IDYzLjUzMjggNDYuNTlDNjMuNDAwNSA0Ni41OSA2My4yMjQgNDYuNjExOSA2My4wNjk5IDQ2LjY1NjRDNjIuOTE1NyA0Ni43MDA5IDYyLjc4MzEgNDYuNzg5NyA2Mi42NTA5IDQ2LjkyM0M2Mi41MTg3IDQ3LjAzNDEgNjIuNDA4NCA0Ny4yMTI1IDYyLjM0MjMgNDcuNDM0N0M2Mi4yNzYzIDQ3LjYzNDggNjIuMjMzIDQ3Ljk5MDQgNjIuMjMyOSA0OC4zNDU4VjUwLjk5MTNDNjIuMjMyOSA1MS4wNTggNjIuMTg4NiA1MS4xMDI2IDYyLjEyMjYgNTEuMTAyN0g2MS4yMTgzQzYxLjE1MjQgNTEuMTAyNSA2MS4xMDc5IDUxLjA1NzkgNjEuMTA3OSA1MC45OTEzVjQ1Ljc2NjdDNjEuMTA4MSA0NS43MDAzIDYxLjE1MjUgNDUuNjU2NSA2MS4yMTgzIDQ1LjY1NjRINjIuMTAwMUM2Mi4xNjYyIDQ1LjY1NjQgNjIuMjEwMyA0NS43MDAyIDYyLjIxMDUgNDUuNzY2N1Y0Ni4xODk2QzYyLjM0MjYgNDYuMDExOSA2Mi41ODQ5IDQ1LjgzNDIgNjIuODA1MiA0NS43NDUyQzYzLjAyNTYgNDUuNjM0MSA2My4yNjg3IDQ1LjU2NjggNjMuNzA5NSA0NS41ODlaTTQwLjEwMjEgNDMuMzY2M0M0MC4xNjc5IDQzLjM2NjUgNDAuMjEyMyA0My40MTAzIDQwLjIxMjQgNDMuNDc2N1Y1MC45Njk4QzQwLjIxMjMgNTEuMDM2MiA0MC4xNjc5IDUxLjA4MDEgNDAuMTAyMSA1MS4wODAySDM5LjE3NjNDMzkuMTEwMyA1MS4wODAyIDM5LjA2NjEgNTEuMDM2MyAzOS4wNjYgNTAuOTY5OFY0My40NzY3QzM5LjA2NjEgNDMuNDEwMiAzOS4xMTAzIDQzLjM2NjMgMzkuMTc2MyA0My4zNjYzSDQwLjEwMjFaTTM1LjkxMzYgNDguNDc4NkMzNS4yMDg2IDQ4LjQ1NjUgMzQuODk5OSA0OC43MjM4IDM0Ljg5OTkgNDguNzIzOEMzNC43MDE4IDQ4Ljg3OTMgMzQuNTkxNCA0OS4xMDEzIDM0LjU5MTMgNDkuNDEyMkMzNC41OTEzIDQ5LjYxMjEgMzQuNjM1NyA0OS43Njc5IDM0LjcwMTcgNDkuODc5QzM0Ljc0NTggNDkuOTQ1NyAzNC43Njc5IDQ5Ljk2ODIgMzQuODk5OSA1MC4wNzkyQzM0Ljg5OTkgNTAuMDc5MiAzNS4yMDg2IDUwLjMyNCAzNS45MTM2IDUwLjMwMTlDMzYuNDIwNiA1MC4yNTc0IDM2Ljg2MTkgNTAuMTY4MSAzNi44NjE5IDUwLjE2ODFWNDguNTY3NUMzNi44NTYzIDQ4LjU2NjQgMzYuNDE3NCA0OC40Nzg2IDM1LjkxMzYgNDguNDc4NlpNNTcuNjcwNCA0Ni40NTUyQzU3LjIwNzkgNDYuNDU1MyA1Ni44OTk2IDQ2LjYxMTMgNTYuNjc5MiA0Ni45NDQ1QzU2LjQ1ODggNDcuMjc3OSA1Ni4zNDgyIDQ3Ljc0NTUgNTYuMzQ4MiA0OC4zNDU4QzU2LjM0ODIgNDguOTQ1OSA1Ni40NTg5IDQ5LjQxMjggNTYuNjc5MiA0OS43NDYyQzU2Ljg5OTYgNTAuMDc5NCA1Ny4yMDc4IDUwLjIzNTQgNTcuNjcwNCA1MC4yMzU1QzU4LjExMTMgNTAuMjM1NSA1OC40NDIyIDUwLjA3OTYgNTguNjYyNiA0OS43NDYyQzU4Ljg4MyA0OS40MTI4IDU4Ljk5MzYgNDguOTQ1OSA1OC45OTM3IDQ4LjM0NThDNTguOTkzNyA0Ny43NDU1IDU4Ljg4MzEgNDcuMjc3OSA1OC42NjI2IDQ2Ljk0NDVDNTguNDY0MiA0Ni42MTExIDU4LjEzMzMgNDYuNDU1MiA1Ny42NzA0IDQ2LjQ1NTJaTTQzLjY5NTggNDYuNDMzN0M0My4yMzMgNDYuNDMzNyA0Mi45MjQxIDQ2LjYxMiA0Mi43MDM3IDQ2Ljk0NTRDNDIuNTQ5NCA0Ny4xNjc3IDQyLjQ2MTYgNDcuNDM0NCA0Mi40MTc1IDQ3Ljc2NzdINDQuODg2M0M0NC44NjQyIDQ3LjQ1NjYgNDQuNzk3OCA0Ny4xNjc3IDQ0LjY2NTYgNDYuOTQ1NEM0NC40NDUyIDQ2LjYxMiA0NC4xNTg2IDQ2LjQzMzggNDMuNjk1OCA0Ni40MzM3Wk03MS41MzU3IDQ2LjQzMzdDNzEuMDcyOCA0Ni40MzM3IDcwLjc2MzkgNDYuNjEyIDcwLjU0MzUgNDYuOTQ1NEM3MC4zODkzIDQ3LjE2NzcgNzAuMzAxNSA0Ny40MzQ0IDcwLjI1NzQgNDcuNzY3N0g3Mi43MjYxQzcyLjcwNDEgNDcuNDU2NiA3Mi42NTk2IDQ3LjE2NzcgNzIuNTA1NCA0Ni45NDU0QzcyLjI4NSA0Ni42MTIgNzEuOTk4NCA0Ni40MzM4IDcxLjUzNTcgNDYuNDMzN1oiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo="

interface RotatingIconProps {
  size?: number
  colorA?: string
  colorB?: string
  colorC?: string
  iconColor?: string
  edgeColor?: string
  cornerRadius?: number
  thickness?: number
  dragSensitivity?: number
  damping?: number
  autoRotate?: boolean
  autoRotateSpeed?: number
  introSpinSpeed?: number
  introSpinDecay?: number
  flickDecay?: number
  imageUrl?: string | { src?: string }
  logo?: string | { src?: string }
  logoUrl?: string
  logoURL?: string
  logoBackgroundColor?: string
  puckColorLight?: string
  puckColorDark?: string
  edgeColorLight?: string
  edgeColorDark?: string
  logoPadding?: number
  logoSize?: number
  logoColor?: string
  logoColorLight?: string
  logoColorDark?: string
  tintLogo?: boolean
  style?: CSSProperties
}

const DEFAULTS = {
  size: 96,
  colorA: "#8B5CF6",
  colorB: "#EC4899",
  colorC: "#38BDF8",
  iconColor: "#FFFFFF",
  cornerRadius: 0.55,
  thickness: 0.1785,
  dragSensitivity: 0.025,
  damping: 0.18,
  autoRotate: true,
  autoRotateSpeed: 0.5,
  introSpinSpeed: 6.9,
  introSpinDecay: 1.6,
  flickDecay: 0.6,
  imageUrl: SALESFORCE_LOGO_DATA_URI,
  logoBackgroundColor: "#EDEDED",
  puckColorLight: "#EDEDED",
  puckColorDark: "#2A2A2A",
  edgeColor: "#F5F5F7",
  edgeColorLight: "#F5F5F7",
  edgeColorDark: "#3D3D3D",
  tintLogo: false,
  logoColorLight: "#111111",
  logoColorDark: "#FFFFFF",
  logoPadding: 0.16,
  logoSize: 68,
}

function isUsableImageUrl(value) {
  if (typeof value !== "string") return false
  const url = value.trim()
  if (!url) return false
  if (url.startsWith("data:image/")) return true
  if (url.includes("framerusercontent.com/")) return true
  if (/^https?:\/\//i.test(url) && /\.(png|jpe?g|webp|gif|svg)(\?|#|$)/i.test(url)) return true
  return false
}

function resolveImageUrl(value) {
  if (!value) return DEFAULTS.imageUrl
  if (typeof value === "string") return isUsableImageUrl(value) ? value : DEFAULTS.imageUrl
  if (value.src && isUsableImageUrl(value.src)) return value.src
  return DEFAULTS.imageUrl
}

function pickColor(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value
  }
  return undefined
}

function isTruthy(value, fallback) {
  if (typeof value === "string") return value !== "false"
  return typeof value === "boolean" ? value : fallback
}

/**
 * Tint Logo off keeps the artwork's own colors, so no control has to carry a
 * transparent color to mean "leave it alone".
 */
function resolveLogoColor(props, theme) {
  if (!isTruthy(props?.tintLogo, DEFAULTS.tintLogo)) return undefined
  const value =
    theme === "dark"
      ? pickColor(props?.logoColorDark, props?.logoColor, DEFAULTS.logoColorDark)
      : pickColor(props?.logoColorLight, props?.logoColor, DEFAULTS.logoColorLight)
  const paint = parseColor(value)
  if (!paint || paint.a < 0.01) return undefined
  return rgbaCss(paint)
}

function tintedLogoImage(image, logoColor) {
  if (!logoColor || typeof document === "undefined") return image
  const width = image.naturalWidth || image.width
  const height = image.naturalHeight || image.height
  if (!width || !height) return image
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  ctx.drawImage(image, 0, 0)
  ctx.globalCompositeOperation = "source-in"
  ctx.fillStyle = logoColor
  ctx.fillRect(0, 0, width, height)
  return canvas
}

function readFramerTheme() {
  if (typeof document === "undefined") return "light"
  return document.documentElement.getAttribute("data-framer-theme") === "dark" ? "dark" : "light"
}

function resolvePuckColor(props, theme = readFramerTheme()) {
  if (theme === "dark") {
    return pickColor(props.puckColorDark, "#2A2A2A")
  }
  return pickColor(props.puckColorLight, props.puckColor, props.logoBackgroundColor, "#EDEDED")
}

function resolveEdgeColor(props, theme = readFramerTheme()) {
  if (theme === "dark") {
    return pickColor(props.edgeColorDark, "#3D3D3D")
  }
  return pickColor(props.edgeColorLight, props.edgeColor, "#F5F5F7")
}

function resolveLogoScale(props) {
  const raw = props?.logoSize
  const size = typeof raw === "string" ? parseFloat(raw) : raw
  if (typeof size === "number" && Number.isFinite(size)) {
    return size > 1 ? Math.min(1, Math.max(0.2, size / 100)) : Math.min(1, Math.max(0.2, size))
  }
  const padRaw = props?.logoPadding
  const pad = typeof padRaw === "string" ? parseFloat(padRaw) : padRaw
  if (typeof pad === "number" && Number.isFinite(pad)) {
    return Math.min(1, Math.max(0.2, 1 - pad * 2))
  }
  return 0.68
}

function applySRGB(texture) {
  if (THREE.sRGBEncoding !== undefined && "encoding" in texture) {
    texture.encoding = THREE.sRGBEncoding
  } else if (THREE.SRGBColorSpace && "colorSpace" in texture) {
    texture.colorSpace = THREE.SRGBColorSpace
  }
}

const FALLBACK_PUCK_PAINT = { r: 237, g: 237, b: 237, a: 1 }
const FALLBACK_EDGE_PAINT = { r: 245, g: 245, b: 247, a: 1 }

/**
 * Colors reach this component as anything CSS accepts, including Framer color
 * styles (`var(--token-…)`) that Three and canvas 2D cannot parse. Resolve them
 * through the DOM once, then hand plain numbers to the renderer.
 */
const COLOR_PROBE_SENTINEL = "rgb(1, 2, 3)"

function parseColor(color) {
  if (typeof color !== "string" || !color.trim()) return null
  if (typeof document === "undefined") return null
  const probe = document.createElement("span")
  probe.style.display = "none"
  probe.style.color = COLOR_PROBE_SENTINEL
  probe.style.color = color
  document.documentElement.appendChild(probe)
  const computed = getComputedStyle(probe).color
  document.documentElement.removeChild(probe)
  if (!computed || computed === COLOR_PROBE_SENTINEL) return null
  const parts = computed
    .replace(/^[^(]*\(/, "")
    .replace(/[a-z-]+/gi, " ")
    .match(/[\d.]+/g)
  if (!parts || parts.length < 3) return null
  const scale = computed.startsWith("color(") ? 255 : 1
  const channel = (value) => Math.max(0, Math.min(255, Math.round(Number(value) * scale)))
  return {
    r: channel(parts[0]),
    g: channel(parts[1]),
    b: channel(parts[2]),
    a: parts.length > 3 ? Math.max(0, Math.min(1, Number(parts[3]))) : 1,
  }
}

function resolvePaint(color, fallback) {
  return parseColor(color) || fallback
}

function rgbaCss(paint) {
  return `rgba(${paint.r}, ${paint.g}, ${paint.b}, ${paint.a})`
}

function rgbCss(paint) {
  return `rgb(${paint.r}, ${paint.g}, ${paint.b})`
}

function numberOr(value, fallback) {
  const parsed = typeof value === "string" ? parseFloat(value) : value
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : fallback
}

function makeSolidPuckTexture(backgroundColor) {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = rgbaCss(resolvePaint(backgroundColor, FALLBACK_PUCK_PAINT))
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  applySRGB(texture)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

function applyOutputEncoding(renderer) {
  if ("physicallyCorrectLights" in renderer) {
    renderer.physicallyCorrectLights = true
  }
  if (THREE.sRGBEncoding !== undefined && "outputEncoding" in renderer) {
    renderer.outputEncoding = THREE.sRGBEncoding
  } else if (THREE.SRGBColorSpace && "outputColorSpace" in renderer) {
    renderer.outputColorSpace = THREE.SRGBColorSpace
  }
}

function getOpaqueBounds(image) {
  const srcW = image.naturalWidth || image.width || 1
  const srcH = image.naturalHeight || image.height || 1
  const canvas = document.createElement("canvas")
  canvas.width = srcW
  canvas.height = srcH
  const ctx = canvas.getContext("2d")
  ctx.drawImage(image, 0, 0, srcW, srcH)
  let data
  try {
    data = ctx.getImageData(0, 0, srcW, srcH).data
  } catch {
    return { x: 0, y: 0, width: srcW, height: srcH }
  }
  let minX = srcW, minY = srcH, maxX = -1, maxY = -1
  for (let y = 0; y < srcH; y++) {
    for (let x = 0; x < srcW; x++) {
      if (data[(y * srcW + x) * 4 + 3] > 10) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < minX || maxY < minY) return { x: 0, y: 0, width: srcW, height: srcH }
  return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
}

function compositeLogoTexture(image, backgroundColor, padding, logoColor) {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, size, size)
  ctx.fillStyle = rgbaCss(resolvePaint(backgroundColor, FALLBACK_PUCK_PAINT))
  ctx.fillRect(0, 0, size, size)
  const source = tintedLogoImage(image, logoColor)
  const bounds = getOpaqueBounds(source)
  const maxDim = size * (1 - padding * 2)
  const scale = Math.min(maxDim / bounds.width, maxDim / bounds.height)
  const drawW = bounds.width * scale
  const drawH = bounds.height * scale
  ctx.drawImage(
    source,
    bounds.x,
    bounds.y,
    bounds.width,
    bounds.height,
    (size - drawW) / 2,
    (size - drawH) / 2,
    drawW,
    drawH
  )
  const texture = new THREE.CanvasTexture(canvas)
  applySRGB(texture)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

function makeProceduralTexture(colorA, colorB, colorC, iconColor) {
  const size = 512
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext("2d")
  const gradient = ctx.createLinearGradient(0, 0, size, size)
  gradient.addColorStop(0, colorA)
  gradient.addColorStop(0.5, colorB)
  gradient.addColorStop(1, colorC)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const highlight = ctx.createRadialGradient(size * 0.3, size * 0.25, 0, size * 0.3, size * 0.25, size * 0.6)
  highlight.addColorStop(0, "rgba(255,255,255,0.35)")
  highlight.addColorStop(1, "rgba(255,255,255,0)")
  ctx.fillStyle = highlight
  ctx.fillRect(0, 0, size, size)
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
  applySRGB(texture)
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

function roundedRectShape(width, height, radius) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -height / 2
  const r = Math.min(radius, width / 2, height / 2)
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

function normalizeUVs(geometry) {
  geometry.computeBoundingBox()
  const bbox = geometry.boundingBox
  const pos = geometry.attributes.position
  const uv = geometry.attributes.uv
  const spanX = bbox.max.x - bbox.min.x || 1
  const spanY = bbox.max.y - bbox.min.y || 1
  for (let i = 0; i < uv.count; i++) {
    uv.setXY(i, (pos.getX(i) - bbox.min.x) / spanX, (pos.getY(i) - bbox.min.y) / spanY)
  }
  uv.needsUpdate = true
}

function buildRimGeometry(shape, thickness, segments = 128) {
  const points = shape.getPoints(segments)
  const halfT = thickness / 2
  const positions = []
  const normals = []
  for (let i = 0; i < points.length; i++) {
    const a = points[i]
    const b = points[(i + 1) % points.length]
    const edgeX = b.x - a.x
    const edgeY = b.y - a.y
    const len = Math.hypot(edgeX, edgeY)
    if (len < 1e-8) continue
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

function tryBakePmrem(renderer, scene) {
  try {
    const canvas = document.createElement("canvas")
    canvas.width = 16
    canvas.height = 8
    const ctx = canvas.getContext("2d")
    const gradient = ctx.createLinearGradient(0, 0, 0, 8)
    gradient.addColorStop(0, "#ffffff")
    gradient.addColorStop(1, "#9a9a9a")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 16, 8)
    const source = new THREE.CanvasTexture(canvas)
    source.mapping = THREE.EquirectangularReflectionMapping
    applySRGB(source)
    source.generateMipmaps = true
    source.minFilter = THREE.LinearMipmapLinearFilter
    source.needsUpdate = true
    const pmrem = new THREE.PMREMGenerator(renderer)
    const renderTarget = pmrem.fromEquirectangular(source)
    scene.environment = renderTarget.texture
    source.dispose()
    pmrem.dispose()
    renderer.setRenderTarget(null)
    return renderTarget
  } catch {
    scene.environment = null
    try {
      renderer.setRenderTarget(null)
    } catch {
      /* ignore */
    }
    return null
  }
}

function StaticPuck({ imageUrl, background, radius, logoScale, logoColor }) {
  const pct = `${Math.round(logoScale * 100)}%`
  const mark = logoColor
    ? {
        width: pct,
        height: pct,
        backgroundColor: logoColor,
        WebkitMaskImage: `url("${imageUrl}")`,
        maskImage: `url("${imageUrl}")`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }
    : null
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: `${Math.max(0, Math.min(radius, 0.85)) * 50}%`,
        background: rgbaCss(resolvePaint(background, FALLBACK_PUCK_PAINT)),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {mark ? (
        <div aria-hidden style={mark} />
      ) : (
        <img
          src={imageUrl}
          alt=""
          draggable={false}
          style={{ width: pct, height: pct, objectFit: "contain" }}
          onError={(event) => {
            event.currentTarget.style.display = "none"
          }}
        />
      )}
    </div>
  )
}

/**
 * @framerIntrinsicWidth 96
 * @framerIntrinsicHeight 96
 * @framerSupportedLayoutWidth any-prefer-fixed
 * @framerSupportedLayoutHeight any-prefer-fixed
 */
export default function RotatingIcon(props: RotatingIconProps) {
  const merged = { ...DEFAULTS, ...props }
  const isStatic = useIsStaticRenderer()
  const hostRef = useRef(null)
  const imageUrl = resolveImageUrl(
    props.logo ?? props.imageUrl ?? props.logoURL ?? props.logoUrl
  )
  const logoColorLight = resolveLogoColor(props, "light")
  const logoColorDark = resolveLogoColor(props, "dark")
  const logoScale = resolveLogoScale(merged)
  const logoPadding = (1 - logoScale) / 2
  const [theme, setTheme] = useState(readFramerTheme)
  const puckColor = resolvePuckColor(merged, theme)
  const edgeColor = resolveEdgeColor(merged, theme)
  const logoColor = theme === "dark" ? logoColorDark : logoColorLight

  // Framer derives prop names from control titles, so several arrive renamed.
  const cornerRadius = numberOr(props.cornerRadius, DEFAULTS.cornerRadius)
  const thickness = numberOr(props.thickness, DEFAULTS.thickness)
  const dragSensitivity = numberOr(props.dragSensitivity, DEFAULTS.dragSensitivity)
  const dragSmoothing = numberOr(props.dragSmoothing ?? props.damping, DEFAULTS.damping)
  const flickMomentum = numberOr(props.flickMomentum ?? props.flickDecay, DEFAULTS.flickDecay)
  const introSpin = numberOr(props.introSpin ?? props.introSpinSpeed, DEFAULTS.introSpinSpeed)
  const introSpinDecay = numberOr(props.introSpinDecay, DEFAULTS.introSpinDecay)
  const autoRotateSpeed = numberOr(props.autoRotateSpeed, DEFAULTS.autoRotateSpeed)
  const autoRotate = isTruthy(props.autoRotate, DEFAULTS.autoRotate)

  useEffect(() => {
    if (typeof document === "undefined") return
    const sync = () => setTheme(readFramerTheme())
    sync()
    const html = document.documentElement
    const observer = new MutationObserver(sync)
    observer.observe(html, { attributes: true, attributeFilter: ["data-framer-theme"] })
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isStatic) return
    const host = hostRef.current
    if (!host || typeof window === "undefined") return

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      return
    }
    applyOutputEncoding(renderer)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.setClearColor(0x000000, 0)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    camera.position.set(0, 0, 2.232)

    scene.add(new THREE.AmbientLight(0xffffff, 1.75))
    const key = new THREE.DirectionalLight(0xffffff, 1.4)
    key.position.set(3, 4, 5)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.35)
    fill.position.set(-4, -2, -3)
    scene.add(fill)

    const faceW = 1.7
    const shape = roundedRectShape(faceW, faceW, cornerRadius)
    const capGeometry = new THREE.ShapeGeometry(shape, 32)
    normalizeUVs(capGeometry)
    const rimGeometry = buildRimGeometry(shape, thickness)

    let faceTexture = makeSolidPuckTexture(puckColor)
    const frontMaterial = new THREE.MeshPhysicalMaterial({
      map: faceTexture,
      roughness: 0.9,
      metalness: 0,
      clearcoat: 0,
      envMapIntensity: 0.08,
      transparent: true,
    })
    const edgePaint = resolvePaint(edgeColor, FALLBACK_EDGE_PAINT)
    const edgeMaterial = new THREE.MeshPhysicalMaterial({
      color: rgbCss(edgePaint),
      roughness: 0.9,
      metalness: 0,
      clearcoat: 0,
      envMapIntensity: 0.08,
      transparent: true,
      opacity: edgePaint.a,
    })

    const group = new THREE.Group()
    const front = new THREE.Mesh(capGeometry, frontMaterial)
    front.position.z = thickness / 2
    const back = new THREE.Mesh(capGeometry, frontMaterial)
    back.position.z = -thickness / 2
    back.rotation.y = Math.PI
    group.add(front, back, new THREE.Mesh(rimGeometry, edgeMaterial))
    scene.add(group)

    const canvas = renderer.domElement
    canvas.style.position = "absolute"
    canvas.style.inset = "0"
    canvas.style.width = "100%"
    canvas.style.height = "100%"
    canvas.style.display = "block"
    canvas.style.cursor = "grab"
    canvas.style.touchAction = "none"
    const resize = () => {
      const w = Math.max(host.clientWidth || merged.size, 1)
      const h = Math.max(host.clientHeight || merged.size, 1)
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(host)

    const envRT = tryBakePmrem(renderer, scene)
    if (envRT && envRT.texture) {
      frontMaterial.envMap = envRT.texture
      edgeMaterial.envMap = envRT.texture
      frontMaterial.needsUpdate = true
      edgeMaterial.needsUpdate = true
    }

    host.appendChild(canvas)
    renderer.render(scene, camera)

    let cancelled = false
    let loadedImage = null
    const applyFace = (image, nextTheme) => {
      const tint = nextTheme === "dark" ? logoColorDark : logoColorLight
      const next = image
        ? compositeLogoTexture(image, resolvePuckColor(merged, nextTheme), logoPadding, tint)
        : makeSolidPuckTexture(resolvePuckColor(merged, nextTheme))
      const prev = faceTexture
      faceTexture = next
      frontMaterial.map = next
      frontMaterial.needsUpdate = true
      if (prev && prev !== next) prev.dispose()
    }
    const applyThemeLook = (nextTheme) => {
      const paint = resolvePaint(resolveEdgeColor(merged, nextTheme), FALLBACK_EDGE_PAINT)
      edgeMaterial.color.set(rgbCss(paint))
      edgeMaterial.opacity = paint.a
      edgeMaterial.needsUpdate = true
      applyFace(loadedImage, nextTheme)
    }
    const image = new Image()
    image.crossOrigin = "anonymous"
    image.onload = () => {
      if (cancelled) return
      loadedImage = image
      applyFace(image, readFramerTheme())
    }
    image.src = imageUrl
    const html = document.documentElement
    const themeObserver = new MutationObserver(() => {
      if (!cancelled) applyThemeLook(readFramerTheme())
    })
    themeObserver.observe(html, { attributes: true, attributeFilter: ["data-framer-theme"] })

    let raf = 0
    let last = performance.now()
    let dragging = false
    let lastX = 0
    let lastMoveTime = 0
    let spin = 0
    let dragTarget = 0
    let dragEased = 0
    let introVel = introSpin
    let flickVel = 0

    const loop = (now) => {
      const dt = Math.min((now - last) / 1000, 1 / 30)
      last = now
      if (!dragging) {
        if (autoRotate) spin += autoRotateSpeed * dt
        if (introVel) {
          spin += introVel * dt
          introVel *= Math.exp(-dt / Math.max(introSpinDecay, 1e-3))
          if (Math.abs(introVel) < 0.005) introVel = 0
        }
        if (flickVel) {
          spin += flickVel * dt
          flickVel *= Math.exp(-dt / Math.max(flickMomentum, 1e-3))
          if (Math.abs(flickVel) < 0.005) flickVel = 0
        }
      }
      const k = 1 - Math.pow(1 - Math.min(Math.max(dragSmoothing, 0.001), 0.999), dt * 60)
      dragEased += (dragTarget - dragEased) * k
      group.rotation.y = spin + dragEased
      renderer.render(scene, camera)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)

    const onDown = (e) => {
      dragging = true
      lastX = e.clientX
      lastMoveTime = performance.now()
      introVel = 0
      flickVel = 0
      canvas.style.cursor = "grabbing"
      try {
        canvas.setPointerCapture(e.pointerId)
      } catch {
        /* window listeners keep the drag */
      }
    }
    const onMove = (e) => {
      if (!dragging) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      const delta = dx * dragSensitivity
      dragTarget += delta
      const t = performance.now()
      const moveDt = (t - lastMoveTime) / 1000
      lastMoveTime = t
      if (moveDt > 0) flickVel = delta / Math.max(moveDt, 1 / 120)
    }
    const onUp = (e) => {
      if (!dragging) return
      dragging = false
      canvas.style.cursor = "grab"
      if (performance.now() - lastMoveTime > 120) flickVel = 0
      if (flickMomentum <= 0) flickVel = 0
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* already released */
      }
    }

    canvas.addEventListener("pointerdown", onDown)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      themeObserver.disconnect()
      canvas.removeEventListener("pointerdown", onDown)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
      if (canvas.parentNode === host) host.removeChild(canvas)
      capGeometry.dispose()
      rimGeometry.dispose()
      frontMaterial.dispose()
      edgeMaterial.dispose()
      faceTexture.dispose()
      if (envRT) envRT.dispose()
      renderer.dispose()
    }
  }, [
    isStatic,
    imageUrl,
    merged.edgeColor,
    cornerRadius,
    thickness,
    dragSensitivity,
    dragSmoothing,
    autoRotate,
    autoRotateSpeed,
    introSpin,
    introSpinDecay,
    flickMomentum,
    merged.puckColorLight,
    merged.puckColorDark,
    merged.edgeColorLight,
    merged.edgeColorDark,
    merged.puckColor,
    merged.logoBackgroundColor,
    logoPadding,
    logoColorLight,
    logoColorDark,
    merged.size,
  ])

  return (
    <div
      ref={hostRef}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        minWidth: merged.size,
        minHeight: merged.size,
        ...merged.style,
      }}
    >
      {isStatic ? (
        <StaticPuck
          imageUrl={imageUrl}
          background={puckColor}
          radius={cornerRadius}
          logoScale={logoScale}
          logoColor={logoColor}
        />
      ) : null}
    </div>
  )
}

addPropertyControls(RotatingIcon, {
  imageUrl: { type: ControlType.ResponsiveImage, title: "Logo" },
  logoUrl: { type: ControlType.String, title: "Logo URL", hidden: () => true },
  tintLogo: { type: ControlType.Boolean, title: "Tint Logo", defaultValue: false },
  logoColorLight: {
    type: ControlType.Color,
    title: "Logo Color Light",
    defaultValue: "#111111",
    hidden: (p) => !p.tintLogo,
  },
  logoColorDark: {
    type: ControlType.Color,
    title: "Logo Color Dark",
    defaultValue: "#FFFFFF",
    hidden: (p) => !p.tintLogo,
  },
  puckColorLight: { type: ControlType.Color, title: "Puck Color Light", defaultValue: "#EDEDED" },
  puckColorDark: { type: ControlType.Color, title: "Puck Color Dark", defaultValue: "#2A2A2A" },
  edgeColorLight: { type: ControlType.Color, title: "Edge Color Light", defaultValue: "#F5F5F7" },
  edgeColorDark: { type: ControlType.Color, title: "Edge Color Dark", defaultValue: "#3D3D3D" },
  logoSize: {
    type: ControlType.Number,
    title: "Logo Size",
    min: 20,
    max: 100,
    step: 1,
    defaultValue: 68,
    unit: "%",
  },
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
  },
  dragSensitivity: {
    type: ControlType.Number,
    title: "Drag Sensitivity",
    min: 0.002,
    max: 0.08,
    step: 0.001,
    defaultValue: 0.025,
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
  },
  autoRotate: { type: ControlType.Boolean, title: "Auto Rotate", defaultValue: true },
  autoRotateSpeed: {
    type: ControlType.Number,
    title: "Auto Rotate Speed",
    min: 0,
    max: 2,
    step: 0.05,
    defaultValue: 0.5,
    hidden: (p) => !p.autoRotate,
  },
  introSpinSpeed: {
    type: ControlType.Number,
    title: "Intro Spin",
    min: 0,
    max: 15,
    step: 0.1,
    defaultValue: 6.9,
  },
  introSpinDecay: {
    type: ControlType.Number,
    title: "Intro Spin Decay",
    min: 0.1,
    max: 6,
    step: 0.1,
    defaultValue: 1.6,
  },
})
