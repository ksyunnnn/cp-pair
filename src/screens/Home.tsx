// トップ（/）。ルームの外に立つ場所（#34）。アプリの説明と、この端末が関わった最近のルームを出し、
// 新しいルームは /new（お題選び）で作る。記録が空のときは一覧を出さないだけで、無いことは告げない
import { navigate } from "../router.ts";
import { BrandHeader, Button, FloatingBar, ScreenHeading, ScreenMain, Section } from "../ui/components.tsx";
import { CpSymbol } from "../ui/symbols.tsx";
import { RecentRooms } from "./host/RecentRooms.tsx";

const HOW_TO_PLAY = [
  { title: "お題を選ぶ", body: "ホストがお題を選び、ルームを作ります。" },
  { title: "理念を選ぶ", body: "参加者は QR コードから参加し、企業名を伏せた理念からひとつ選びます。" },
  { title: "発表する", body: "ホストが締め切ると、選んだ理念どうしの相性で、ペアを発表します。" },
];

export function Home() {
  return (
    <div className="cp-page">
      <BrandHeader aboutLink />
      <ScreenMain className="cp-content has-floating">
        <RecentRooms />
        <ScreenHeading
          eyebrow="CORPORATE PHILOSOPHY PAIR"
          icon={<CpSymbol name="Pair" size={17} />}
          title="企業理念で、ペアを決める"
          lead="あなたが好きな企業理念はなんですか？各自が好きな企業理念をひとつ選び、理念どうしのこじつけ相性診断でペアを発表するジョークアプリです。"
        />
        <Section title="遊び方">
          <ol className="h-howto">
            {HOW_TO_PLAY.map((step, i) => (
              <li key={step.title} className="h-howto__step">
                <span className="cp-steps__num t-label" aria-hidden="true">
                  {i + 1}
                </span>
                <span className="cp-stack cp-stack--8">
                  <span className="t-strong">{step.title}</span>
                  <span className="t-body c-muted">{step.body}</span>
                </span>
              </li>
            ))}
          </ol>
        </Section>
      </ScreenMain>
      <FloatingBar note="参加する人は、ホストの QR コードから開きます">
        <Button onClick={() => navigate("/new")}>ルームを作る</Button>
      </FloatingBar>
    </div>
  );
}
