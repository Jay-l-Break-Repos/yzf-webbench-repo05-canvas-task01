// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const { test, expect, defineConfig } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    window.store.mode = 'debug';
  });
  await page.click('canvas');
});

test('arrow down key increases falling speed', async ({ page }) => {
  await page.waitForTimeout(300);

  const a = await page.evaluate(() => window.store.bird.y);
  await page.waitForTimeout(200);
  const b = await page.evaluate(() => window.store.bird.y);

  await page.keyboard.down('ArrowDown');

  const c = await page.evaluate(() => window.store.bird.y);
  await page.waitForTimeout(200);
  const d = await page.evaluate(() => window.store.bird.y);

  expect(b-a).toBeLessThan(d-c);

});

test('arrow right key activates speed-up mode', async ({ page }) => {
  await page.waitForTimeout(200);

  const a = await page.evaluate(() => window.store.pipes[0].x);
  await page.waitForTimeout(100);
  const b = await page.evaluate(() => window.store.pipes[0].x);

  await page.keyboard.down('ArrowRight');

  const c = await page.evaluate(() => window.store.pipes[0].x);
  await page.waitForTimeout(100);
  const d = await page.evaluate(() => window.store.pipes[0].x);

  expect(b-a).toBeGreaterThan(d-c);
});

test('space and arrow up keys trigger jump', async ({ page }) => {
  // Test space key
  const initialY = await page.evaluate(() => window.store.bird.y);
  await page.keyboard.press('Space');
  await page.waitForTimeout(50);
  const afterSpaceY = await page.evaluate(() => window.store.bird.y);
  expect(afterSpaceY).toBeLessThan(initialY);

  // Wait for bird to fall
  await page.waitForTimeout(200);

  // Test arrow up key
  const beforeArrowY = await page.evaluate(() => window.store.bird.y);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(50);
  const afterArrowY = await page.evaluate(() => window.store.bird.y);
  expect(afterArrowY).toBeLessThan(beforeArrowY);
});
