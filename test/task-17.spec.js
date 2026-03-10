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

test('pressing k creates bullets that can destroy enemies', async ({ page }) => {
  // Wait for enemies to spawn
  await page.waitForTimeout(1100);

  await page.keyboard.press('k');

  const result = await page.evaluate(async () => {
     const enemy =  window.store.enemies[0];
     const bullet =  window.store.bullets[0];
     const enemyNumber = window.store.enemies.length;
     const bulletNumber = window.store.bullets.length;
     bullet.x = enemy.x + 1;
     bullet.y = enemy.y + 1;
    
     await new Promise(resolve => setTimeout(resolve, 100));
     const enemyNumber2 = window.store.enemies.length;
     const bulletNumber2 = window.store.bullets.length;
    return {
      enemyNumber,
      enemyNumber2,
      bulletNumber,
      bulletNumber2
    };
  });

  expect(result.enemyNumber - result.enemyNumber2).toBe(1);
  expect(result.bulletNumber - result.bulletNumber2).toBe(1);
});

test('bullets have a 0.2s firing cooldown', async ({ page }) => {
  await page.keyboard.press('k');
  const bulletCount = await page.evaluate(() => window.store.bullets.length);
  expect(bulletCount).toBe(1);
  await page.waitForTimeout(50);
  await page.keyboard.press('k');
  const bulletCount2 = await page.evaluate(() => window.store.bullets.length);
  expect(bulletCount2).toBe(1);
  await page.waitForTimeout(500);
  await page.keyboard.press('k');
  const bulletCount3 = await page.evaluate(() => window.store.bullets.length);
  expect(bulletCount3).toBe(2);
});
