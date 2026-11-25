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

async function openDevice(browser: Browser, roomId: string, options: { clock?: boolean } = {}) {
  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL })
  const page = await context.newPage()
  // ホストの生存の印が途絶えるまで（90 秒）を待たずに進めるため、この端末の時計を進められるようにする
  if (options.clock) await page.clock.install()
  await page.goto(`/#/r/${roomId}`)
  return page
}

async function joinOnDevice(page: Page, name: string, gender: '男性' | '女性') {
  await expect(page.getByRole('heading', { name: 'ゲームに参加する' })).toBeVisible()
  await page.getByRole('textbox', { name: 'ニックネーム' }).fill(name)
  await page.getByRole('radio', { name: gender }).check()
  await page.getByRole('button', { name: '参加する' }).click()
}

/** 理念選びで、except と違う最初の理念を選び、その文を返す */
async function pickOther(page: Page, except: string | null): Promise<string> {
  const cards = page.getByRole('button', { name: /^企業理念 / })
  await expect(cards.first()).toBeVisible()
  const labels = await cards.locator('.cp-choice__label').allTextContents()
  const index = labels.findIndex((label) => label !== except)
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

test('ルームの途中で切れたら、自分の端末で参加していた人はホストの端末で選び直し、本人の端末では選べず、解除すると本人の端末に戻る', async ({ page, context, browser }) => {
  await page.goto('/')
  await createRoom(page)
  await expect(page.getByText('QR コードか URL を共有')).toBeVisible()
  const roomId = roomIdOf(page)

  const aoi = await openDevice(browser, roomId, { clock: true })
  await joinOnDevice(aoi, 'アオイ', '女性')
  const first = await pickOther(aoi, null)
  await expect(aoi.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeVisible()
  await expect(page.getByText('1人中、1人が選び終えた')).toBeVisible()
  // ホストの端末が、切れる前に届いたルームを手元に写すまで待つ
  await page.waitForFunction((id) => localStorage.getItem(`cp-pair:mirror:${id}`)?.includes('アオイ'), roomId)

  await context.setOffline(true)
  await expect(page.getByText('つながらなくなったため、この端末だけで進めます')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeVisible()
  await expect(page.getByText('QR コードか URL を共有')).toBeHidden()
  // 切れる前に届いていた選択は残る
  await expect(page.getByText('1人中、1人が選び終えた')).toBeVisible()

  // ホストの端末で、アオイさんが選び直す
  const onHost = await pickOnHost(page, 'アオイ', '選び直す', first)
  await addManual(page, 'ハルト', '男性')
  await pickOnHost(page, 'ハルト', 'この端末で選ぶ')

  // 本人の端末はつながっているが、ホストの生存の印が途絶えたので選べない
  await aoi.clock.fastForward(100_000)
  await expect(aoi.getByRole('heading', { name: 'ホストの端末で選んでください' })).toBeVisible()
  await expect(aoi.getByRole('button', { name: '選び直す' })).toBeHidden()

  await context.setOffline(false)
  await page.getByRole('button', { name: RELEASE }).click()
  await expect(page.getByText('各自の端末での参加に戻しました')).toBeVisible()
  await expect(page.getByText(LABEL)).toBeHidden()

  // 解除するとホストの端末が印を書き、本人の端末は選べる状態に戻る。ホストの端末の選択が出る
  await expect(aoi.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeVisible()
  await expect(aoi.locator('.r-you__phrase')).toHaveText(onHost)
  await expect(aoi.getByRole('button', { name: '選び直す' })).toBeVisible()

  await page.getByRole('button', { name: '登録完了を宣言' }).click()
  await expect(page.getByRole('heading', { name: '結果を発表しました' })).toBeVisible()
  await expect(aoi.getByRole('heading', { name: 'ホストの発表を待っています' })).toBeHidden()
  await aoi.context().close()
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
