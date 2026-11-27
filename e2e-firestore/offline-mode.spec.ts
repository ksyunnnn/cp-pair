import { expect, test, type Browser, type Page } from '@playwright/test'

// オフラインモード（ホストの端末 1 台で進める状態）への自動の切り替えと、ホストによる解除を確かめる。
// 各自の端末は、別のブラウザコンテキスト（別の localStorage と別の匿名認証の uid）で再現する

const LABEL = 'ホストの端末 · この端末だけで進行中'
const RELEASE = '各自の端末での参加に戻す'

function roomIdOf(page: Page): string {
  const match = new URL(page.url()).hash.match(/#\/host\/([0-9A-Z]{5})/)
  if (!match) throw new Error(`ルームの ID が URL にありません: ${page.url()}`)
  return match[1]
}

async function createRoom(page: Page) {
  await page.getByRole('button', { name: /^お題 01/ }).click()
  await page.getByRole('button', { name: 'このお題でルームを作る' }).click()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
}

async function openDevice(browser: Browser, roomId: string) {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL })
  const page = await context.newPage()
  await page.goto(`/#/r/${roomId}`)
  return page
}

async function joinOnDevice(page: Page, name: string, gender: '男性' | '女性') {
  await expect(page.getByRole('heading', { name: 'ゲームに参加する' })).toBeVisible()
  await page.getByRole('textbox', { name: 'ニックネーム' }).fill(name)
  await page.getByRole('radio', { name: gender }).check()
  await page.getByRole('button', { name: '参加する' }).click()
}

/** 理念選びで、except のどれとも違う最初の理念を選び、その文を返す */
async function pickOther(page: Page, except: string | null | string[]): Promise<string> {
  const skip = Array.isArray(except) ? except : [except]
  const cards = page.getByRole('button', { name: /^企業理念 / })
  await expect(cards.first()).toBeVisible()
  const labels = await cards.locator('.cp-choice__label').allTextContents()
  const index = labels.findIndex((label) => !skip.includes(label))
  await cards.nth(index).click()
  await page.getByRole('button', { name: 'これにする' }).click()
  return labels[index]
}

async function addManual(page: Page, name: string, gender: '男性' | '女性') {
  await page.getByRole('button', { name: '参加者を手動で追加' }).click()
  await page.getByRole('textbox', { name: 'ニックネーム' }).fill(name)
  await page.getByRole('radio', { name: gender }).check()
  await page.getByRole('button', { name: '登録する' }).click()
  await expect(page.getByRole('button', { name: `${name}さんを削除` })).toBeVisible()
}

async function pickOnHost(page: Page, name: string, action: string, except: string | null = null) {
  await page.locator('.cp-row', { hasText: name }).getByRole('button', { name: action }).click()
  await page.getByRole('button', { name: `私は${name}です` }).click()
  const phrase = await pickOther(page, except)
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  return phrase
}

test('ルームを作るときにつながらなければ、この端末だけで進め、解除すると各自の端末で参加できる', async ({ page, context, browser }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今夜のお題を選ぶ' })).toBeVisible()
  await context.setOffline(true)
  await createRoom(page)

  await expect(page.getByText('つながらないため、この端末だけで進めます')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeVisible()
  await expect(page.getByText('QR コードか URL を共有')).toBeHidden()

  await addManual(page, 'ハルト', '男性')
  await addManual(page, 'アオイ', '女性')
  await pickOnHost(page, 'ハルト', 'この端末で選ぶ')
  await pickOnHost(page, 'アオイ', 'この端末で選ぶ')

  // つながっていないうちは解除しない
  await page.getByRole('button', { name: RELEASE }).click()
  await expect(page.getByText('まだつながっていません')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeVisible()

  await context.setOffline(false)
  await page.getByRole('button', { name: RELEASE }).click()
  await expect(page.getByText('各自の端末での参加に戻しました')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeHidden()
  await expect(page.getByText('QR コードか URL を共有')).toBeVisible()
  await expect(page.getByText('2人中、2人が選び終えた')).toBeVisible()

  // 解除した後は、招待の URL から各自の端末で参加できる
  const roomId = roomIdOf(page)
  const mei = await openDevice(browser, roomId)
  await joinOnDevice(mei, 'メイ', '女性')
  await expect(mei.getByRole('button', { name: /^企業理念 / }).first()).toBeVisible()
  await expect(page.getByText('3人中、2人が選び終えた')).toBeVisible()
  await mei.context().close()
})

test('つながらないまま宣言した後に解除しても、「ルームが見つかりません」を出さない', async ({ page, context }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '今夜のお題を選ぶ' })).toBeVisible()
  await context.setOffline(true)
  await createRoom(page)
  await addManual(page, 'ハルト', '男性')
  await addManual(page, 'アオイ', '女性')
  await pickOnHost(page, 'ハルト', 'この端末で選ぶ')
  await pickOnHost(page, 'アオイ', 'この端末で選ぶ')
  await page.getByRole('button', { name: '登録完了を宣言' }).click()
  await expect(page.getByRole('heading', { name: '結果を発表しました' })).toBeVisible()

  // 解除した直後の見出しを、一瞬のものも含めてすべて記録する
  await page.evaluate(() => {
    const seen: string[] = []
    ;(window as unknown as { __headings: string[] }).__headings = seen
    const record = () => {
      const heading = document.querySelector('h1')?.textContent?.trim()
      if (heading && seen[seen.length - 1] !== heading) seen.push(heading)
    }
    new MutationObserver(record).observe(document.body, { subtree: true, childList: true, characterData: true })
  })
  await context.setOffline(false)
  await page.getByRole('button', { name: RELEASE }).click()
  await expect(page.getByText('各自の端末での参加に戻しました')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeHidden()
  await expect(page.getByRole('heading', { name: '結果を発表しました' })).toBeVisible()

  const headings = await page.evaluate(() => (window as unknown as { __headings: string[] }).__headings)
  expect(headings).not.toContain('ルームが見つかりません')
  expect(headings).not.toContain('この端末は、このルームのホストではありません')
})

test('ルームの途中で切れたら、ホストの端末で選び直した人だけホストの選択で上書きし、ほかの人は本人の端末の選択を残す', async ({ page, context, browser }) => {
  await page.goto('/')
  await createRoom(page)
  await expect(page.getByText('QR コードか URL を共有')).toBeVisible()
  const roomId = roomIdOf(page)

  const aoi = await openDevice(browser, roomId)
  await joinOnDevice(aoi, 'アオイ', '女性')
  const aoiFirst = await pickOther(aoi, null)
  await expect(aoi.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeVisible()
  const ren = await openDevice(browser, roomId)
  await joinOnDevice(ren, 'レン', '男性')
  const renFirst = await pickOther(ren, null)
  await expect(ren.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeVisible()
  await expect(page.getByText('2人中、2人が選び終えた')).toBeVisible()
  // ホストの端末が、切れる前に届いたルームを手元に写すまで待つ
  await page.waitForFunction(
    (id) => /アオイ.*レン|レン.*アオイ/.test(localStorage.getItem(`cp-pair:mirror:${id}`) ?? ''),
    roomId,
  )

  await context.setOffline(true)
  await expect(page.getByText('つながらなくなったため、この端末だけで進めます')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeVisible()
  await expect(page.getByText('QR コードか URL を共有')).toBeHidden()
  // 切れる前に届いていた選択は残る
  await expect(page.getByText('2人中、2人が選び終えた')).toBeVisible()

  // アオイさんはホストの端末で選び直す。レンさんは、つながっている本人の端末で選び直す（ホストが切れても止まらない）
  const aoiOnHost = await pickOnHost(page, 'アオイ', '選び直す', aoiFirst)
  await ren.getByRole('button', { name: '選び直す' }).click()
  const renOwn = await pickOther(ren, [renFirst, aoiOnHost])
  await expect(ren.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeVisible()

  await context.setOffline(false)
  await page.getByRole('button', { name: RELEASE }).click()
  await expect(page.getByText('各自の端末での参加に戻しました')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeHidden()

  await expect(aoi.locator('.r-you__phrase')).toHaveText(aoiOnHost)
  await expect(ren.locator('.r-you__phrase')).toHaveText(renOwn)

  await page.getByRole('button', { name: '登録完了を宣言' }).click()
  await expect(page.getByRole('heading', { name: '結果を発表しました' })).toBeVisible()
  await expect(aoi.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeHidden()
  await aoi.context().close()
  await ren.context().close()
})

test('参加者の端末が切れたら選べず、つながると戻る', async ({ page, browser }) => {
  await page.goto('/')
  await createRoom(page)
  const roomId = roomIdOf(page)
  const mei = await openDevice(browser, roomId)
  await joinOnDevice(mei, 'メイ', '女性')
  await expect(mei.getByRole('button', { name: /^企業理念 / }).first()).toBeVisible()

  await mei.context().setOffline(true)
  await expect(mei.getByRole('heading', { name: 'ホストの端末で選んでください' })).toBeVisible()
  await expect(mei.getByText('この端末がつながっていません')).toBeVisible()
  await expect(mei.getByRole('button', { name: 'これにする' })).toBeHidden()

  await mei.context().setOffline(false)
  await expect(mei.getByRole('button', { name: /^企業理念 / }).first()).toBeVisible()
  // ホストはつながったままなので、オフラインモードに入らない
  await expect(page.getByText(LABEL)).toBeHidden()
  await mei.context().close()
})
