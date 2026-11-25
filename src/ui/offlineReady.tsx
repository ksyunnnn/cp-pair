// Service Worker を登録し、全ファイルの保存が終わったらトーストで知らせる。
// 初めて開いたときの保存には時間がかかり（本番で約 44 秒）、ホストはいつ電波を切ってよいかを画面で知る必要がある。
// 知らせるのは保存が終わった最初の 1 回だけ。新しい版への入れ替えでは出さない（autoUpdate が再読み込みする）
// https://vite-pwa-org.netlify.app/guide/prompt-for-update.html
import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { useToast } from "./toast.tsx";

let registered = false;

export function OfflineReady() {
  const toast = useToast();
  useEffect(() => {
    // StrictMode の開発時の 2 回目の実行で、もう一度登録しない
    if (registered) return;
    registered = true;
    registerSW({
      immediate: true,
      onOfflineReady: () => toast("この端末は、オフラインでも開けるようになりました", "success", 6000),
    });
  }, [toast]);
  return null;
}
