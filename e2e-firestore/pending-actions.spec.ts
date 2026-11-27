import { expect, test, type Page } from '@playwright/test'

// 押した後に Firestore の応答を待つ操作で、続けて押したときと失敗したときの扱いを確かめる（#37）

async function createRoom(page: Page): Promise<string> {
  await page.goto('/')
  await page.getByRole('button', { name: /^お題 01/ }).click()
  await page.getByRole('button', { name: 'このお題でルームを作る' }).click()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  const match = new URL(page.url()).pathname.match(/^\/host\/([0-9A-Z]{5})/)
  if (!match) throw new Error(`ルームの ID が URL にありません: ${page.url()}`)
  return match[1]
}

test('回線が遅いときに「登録する」を続けて押しても、1人だけ登録する', async ({ page }) => {
  await createRoom(page)

  // 応答が返る前に 2 回目を押せるよう、回線に遅れを足す（Chromium の CDP）
  // https://chromedevtools.github.io/devtools-protocol/tot/Network/#method-emulateNetworkConditions
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Network.enable')
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 1500, downloadThroughput: -1, uploadThroughput: -1 })

  await page.getByRole('button', { name: '参加者を手動で追加' }).click()
  await page.getByRole('textbox', { name: 'ニックネーム' }).fill('ハルト')
  await page.getByRole('radio', { name: '男性' }).check()
  const submit = page.getByRole('button', { name: '登録する' })
  await submit.click()
  // 押せなくなっていれば、2 回目は押せずに時間切れになる
  await submit.click({ timeout: 1000 }).catch(() => {})
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })

  const rows = page.getByRole('button', { name: 'ハルトさんを削除' })
  await expect(rows.first()).toBeVisible({ timeout: 15_000 })
  // 2 回目の書き込みがあれば、1 回目とほぼ同時に届く。届く余地を残してから数える
  await page.waitForTimeout(1000)
  await expect(rows).toHaveCount(1)
})

test('「参加する」が失敗したら知らせて、もう一度押せるようにする', async ({ page, browser }) => {
  const roomId = await createRoom(page)

  const context = await browser.newContext({ baseURL: test.info().project.use.baseURL })
  const device = await context.newPage()
  await device.goto(`/r/${roomId}`)
  await expect(device.getByRole('heading', { name: 'ゲームに参加する' })).toBeVisible()
  const input = device.getByRole('textbox', { name: 'ニックネーム' })
  // 13 文字の名前は firestore.rules が拒むので、書き込みが失敗する。画面の入力の上限（12 文字）を外して入れる
  await input.evaluate((el) => el.removeAttribute('maxlength'))
  await input.fill('アイウエオカキクケコサシス')
  await device.getByRole('radio', { name: '男性' }).check()
  const join = device.getByRole('button', { name: '参加する' })
  await join.click()

  await expect(device.getByText('参加できませんでした。つながりを確かめて、もう一度押してください')).toBeVisible()
  await expect(join).toBeEnabled()
  await context.close()
})
