// session-only счётчик показов (макс. 3)
const KEY = "regNudgeShownCount"

export function canShowRegisterNudge(maxShows = 3) {
  if (typeof window === "undefined") return false
  const n = Number(sessionStorage.getItem(KEY) || "0")
  return n < maxShows
}

export function bumpRegisterNudge() {
  if (typeof window === "undefined") return
  const n = Number(sessionStorage.getItem(KEY) || "0")
  sessionStorage.setItem(KEY, String(n + 1))
}
