import { expect, test, type Page } from '@playwright/test'

const people = [
  { name: 'ハルト', gender: '男性' },
  { name: 'リク', gender: '男性' },
  { name: 'アオイ', gender: '女性' },
  { name: 'メイ', gender: '女性' },
]

// ホストの端末だけで、ルームを作ってから結果を見るまでを進める
async function playHostOnly(page: Page) {
  await page.getByRole('button', { name: /^お題 01/ }).click()
  await page.getByRole('button', { name: 'このお題でルームを作る' }).click()
  await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()

  for (const person of people) {
    await page.getByRole('button', { name: '参加者を手動で追加' }).click()
    await page.getByRole('textbox', { name: 'ニックネーム' }).fill(person.name)
    await page.getByRole('radio', { name: person.gender }).check()
    await page.getByRole('button', { name: '登録する' }).click()
    await expect(page.getByRole('button', { name: `${person.name}さんを削除` })).toBeVisible()
  }

  for (const [i, person] of people.entries()) {
    await page.getByRole('button', { name: 'この端末で選ぶ' }).first().click()
    await page.getByRole('button', { name: `私は${person.name}です` }).click()
    await page.getByRole('button', { name: /^企業理念 / }).nth(i).click()
    await page.getByRole('button', { name: 'これにする' }).click()
    await expect(page.getByRole('heading', { name: '参加者を集める' })).toBeVisible()
  }

  await page.getByRole('button', { name: '登録完了を宣言' }).click()
  await expect(page.getByRole('heading', { name: '結果を発表しました' })).toBeVisible()
  await expect(page.getByRole('heading', { name: '全員の結果' })).toBeVisible()
}

test('ホストの端末だけで、4人を登録して選び、結果を発表できる', async ({ page }) => {
  await page.goto('/')
  await playHostOnly(page)
})

test('一度開いた後は、オフラインで開き直しても遊べる', async ({ page, context }) => {
  await page.goto('/')
  // 全ファイルの保存が終わると、トーストで知らせる
  await expect(page.getByText('この端末は、オフラインでも開けるようになりました')).toBeVisible({ timeout: 30_000 })
  // Service Worker が全ファイルを保存し、このページを受け持つまで待つ
  await page.waitForFunction(async () => {
    await navigator.serviceWorker.ready
    return navigator.serviceWorker.controller !== null
  })

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: '今夜のお題を選ぶ' })).toBeVisible()
  await playHostOnly(page)
})
