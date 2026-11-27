import { useEffect, useState } from "react";

export type Route =
  | { name: "hostStart" }
  | { name: "rules" }
  | { name: "about" }
  | { name: "host"; roomId: string }
  | { name: "hostPick"; roomId: string; participantId: string }
  | { name: "hostResult"; roomId: string; participantId: string }
  | { name: "participant"; roomId: string };

/* 画面は URL のパスで決める（例 /host/DE40C）。見つからない経路は、Cloudflare（wrangler.jsonc の not_found_handling）と
   Service Worker（vite.config.ts の navigateFallback）が index.html を返す */
export function parsePath(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] === "host" && parts[1]) {
    if (parts[2] === "pick" && parts[3]) return { name: "hostPick", roomId: parts[1], participantId: parts[3] };
    if (parts[2] === "result" && parts[3]) return { name: "hostResult", roomId: parts[1], participantId: parts[3] };
    return { name: "host", roomId: parts[1] };
  }
  if (parts[0] === "rules") return { name: "rules" };
  if (parts[0] === "about") return { name: "about" };
  if (parts[0] === "r" && parts[1]) return { name: "participant", roomId: parts[1].toUpperCase() };
  return { name: "hostStart" };
}

/* # の後ろに画面のパスを書いた URL（例 /#/host/DE40C）は、履歴を増やさずにそのパスの URL（/host/DE40C）へ置き換える */
function replaceHashPath() {
  if (!location.hash.startsWith("#/")) return;
  history.replaceState(null, "", location.hash.slice(1).replace(/^\/?/, "/") + location.search);
}
replaceHashPath();

const listeners = new Set<() => void>();

/* ?dev などのクエリは、画面を移っても残す */
export function navigate(path: string) {
  if (location.pathname !== path) {
    history.pushState(null, "", path + location.search);
    listeners.forEach((l) => l());
  }
  window.scrollTo(0, 0);
}

/* アプリの中の <a href="/..."> を押したときに、ページを読み直さずに画面を移す */
function onLinkClick(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const a = (e.target as Element | null)?.closest?.("a");
  if (!a || a.target || a.hasAttribute("download")) return;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return;
  e.preventDefault();
  navigate(url.pathname);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parsePath(location.pathname));
  useEffect(() => {
    const onChange = () => setRoute(parsePath(location.pathname));
    const onPop = () => {
      onChange();
      window.scrollTo(0, 0);
    };
    listeners.add(onChange);
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onLinkClick);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onLinkClick);
    };
  }, []);
  return route;
}

/* about をアプリの中のリンクから開いたか。開いたなら「戻る」は履歴を 1 つ戻す。URL を直に開いたときは false */
export const aboutEntry = { fromApp: false };

export const isDevMode = () => new URLSearchParams(location.search).has("dev");
