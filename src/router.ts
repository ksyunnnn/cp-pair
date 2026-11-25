import { useEffect, useState } from "react";

export type Route =
  | { name: "hostStart" }
  | { name: "rules" }
  | { name: "about" }
  | { name: "host"; roomId: string }
  | { name: "hostPick"; roomId: string; participantId: string }
  | { name: "hostResult"; roomId: string; participantId: string }
  | { name: "participant"; roomId: string };

export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
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

export function navigate(path: string) {
  if (location.hash !== `#${path}`) location.hash = path;
  window.scrollTo(0, 0);
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(location.hash));
  useEffect(() => {
    const onChange = () => {
      setRoute(parseHash(location.hash));
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

/* about をアプリの中のリンクから開いたか。開いたなら「戻る」は履歴を 1 つ戻す。URL を直に開いたときは false */
export const aboutEntry = { fromApp: false };

export const isDevMode = () => new URLSearchParams(location.search).has("dev");
