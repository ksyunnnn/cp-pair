// about: つくったひと・開発の経緯・出典とライセンス。ルームを読まないので、どの画面からでも開ける。
import { useEffect, useState, type ReactNode } from "react";
import { STORY } from "../content/story.ts";
import { aboutEntry, navigate } from "../router.ts";
import { BrandHeader, Button, ScreenHeading, ScreenMain, Section } from "../ui/components.tsx";
import { CpSymbol } from "../ui/symbols.tsx";

const CREATOR_URL = "https://twitter.com/ksyunnnn";

/* 出典とライセンス。事実は src/data/companies.json と node_modules の各パッケージの LICENSE による */
const NOTICES: { label: string; body: string }[] = [
  {
    label: "企業理念",
    body: "100 社の企業理念は、各社のウェブサイトから引いています。社ごとの出典は、結果画面の「企業情報の出典」から開けます。性格診断のコメントと相性は、このゲームのための創作です。",
  },
  {
    label: "書体",
    body: "Zen Kaku Gothic New（© The Zen Project Authors）、Anton（© The Anton Project Authors）、Inter（© The Inter Project Authors）。いずれも SIL Open Font License 1.1 の書体で、Fontsource の配布をアプリに同梱しています。",
  },
  {
    label: "記号",
    body: "結果画面の記号の一部は Phosphor Icons（© 2020 Phosphor Icons、MIT License）です。",
  },
  {
    label: "デザイン",
    body: "画面のデザインは、Framer AI で起こした案をもとにしています。",
  },
];

const paragraphs = (text: string) =>
  text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/* 段落の中の [文字](リンク先) をリンクにする。アプリの中の経路（# で始まる）は同じタブで開く */
const LINK = /\[([^\]]+)\]\(([^)\s]+)\)/g;
function withLinks(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK)) {
    const at = m.index ?? 0;
    out.push(text.slice(last, at));
    const href = m[2];
    const external = !href.startsWith("#");
    out.push(
      <a
        key={at}
        className="cp-link"
        href={href}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {m[1]}
      </a>,
    );
    last = at + m[0].length;
  }
  out.push(text.slice(last));
  return out;
}

export function AboutScreen() {
  // 開いたときの値を持つ（StrictMode の後片付けで fromApp が false に戻っても、表示と戻り先を変えない）
  const [fromApp] = useState(() => aboutEntry.fromApp);
  useEffect(
    () => () => {
      aboutEntry.fromApp = false;
    },
    [],
  );
  // アプリの中から開いたなら、履歴を 1 つ戻して元の画面へ。URL を直に開いたなら、はじめの画面へ
  const back = () => (fromApp ? history.back() : navigate("/"));

  return (
    <div className="cp-page">
      <BrandHeader right="このアプリについて" />
      <ScreenMain className="cp-content">
        <ScreenHeading
          eyebrow="ABOUT CP PAIR"
          icon={<CpSymbol name="Talk" size={17} />}
          title="企業理念は意外とかっこいい"
          lead="企業理念を無理やりこじつけた、ジョークの相性診断です。"
        />

        <Section title="つくったひと">
          <a className="t-body cp-link cp-about__link" href={CREATOR_URL} target="_blank" rel="noopener noreferrer">
            @ksyunnnn
          </a>
        </Section>

        <Section title="開発の経緯">
          {paragraphs(STORY).map((p, i) => (
            <p key={i} className="t-body">
              {withLinks(p)}
            </p>
          ))}
        </Section>

        <Section title="出典とライセンス">
          <div className="cp-stack cp-stack--16">
            {NOTICES.map((n) => (
              <div key={n.label} className="cp-stack cp-stack--8">
                <p className="t-label">{n.label}</p>
                <p className="t-small c-muted">{n.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Button kind="secondary" onClick={back}>
          {fromApp ? "もとの画面に戻る" : "はじめの画面に戻る"}
        </Button>
      </ScreenMain>
    </div>
  );
}
