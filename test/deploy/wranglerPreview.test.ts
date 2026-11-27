import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { beforeAll, describe, expect, it } from 'vitest'

// Workers Builds の Preview コマンド（npm run preview:branch = wrangler preview）が、
// wrangler.jsonc の設定の検査で止まらないかを確かめる。
// 無効なトークンと架空のアカウント ID を渡すので、Cloudflare には何も作られない。
// --ignore-base-config は、検査の前にある Preview の基本設定の取得（API 呼び出し）を飛ばすために付ける。
// 検査を通ったあと、無効なトークンが api.cloudflare.com に拒まれるところまで進むので、ネットワークが要る。
// https://developers.cloudflare.com/workers/previews/configuration/#wrangler-configuration-file
describe('wrangler preview', () => {
  beforeAll(() => {
    // wrangler は assets.directory（./dist）が無いと、previews の検査の前に止まる。
    // 中身は検査に関係しないので、ビルドしていない手元でも空のフォルダーで足りる
    mkdirSync('dist', { recursive: true })
  })

  it('wrangler.jsonc に previews のブロックがあり、設定の検査を通る', () => {
    const result = spawnSync('npx', ['wrangler', 'preview', '--ignore-base-config'], {
      encoding: 'utf8',
      env: {
        ...process.env,
        CLOUDFLARE_API_TOKEN: 'invalid-token-for-test',
        CLOUDFLARE_ACCOUNT_ID: '00000000000000000000000000000000',
        NO_COLOR: '1',
        FORCE_COLOR: '0',
        CI: '1',
      },
    })
    expect(result.error, 'npx wrangler を起動できなかった').toBeUndefined()
    const output = `${result.stdout}${result.stderr}`

    // 主な確かめ: 検査を通ったなら、Preview を作る API まで進み、無効なトークンで拒まれる
    expect(output, output).toMatch(/workers\/cppair\/previews\//)
    // 補助: wrangler のエラーの文面に頼るので、文面が変わると何も確かめなくなる
    expect(output).not.toContain('missing a `previews` block')
  }, 60_000)
})
