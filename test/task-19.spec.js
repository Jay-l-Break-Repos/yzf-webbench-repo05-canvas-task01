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
    window.store.randomRate = 1;
    window.store.bombs = 1;
  });
  await page.click('canvas');
});


test('should collect Boom item and increase bomb count', async ({ page }) => {
  await page.waitForTimeout(200);

  // Setup pipe with Boom item at bird position
  const result = await page.evaluate(async () => {
    const store = window.store;
    const initialBomb = store.bombs;

    window.store.weather.current = 'Night';
    // Setup heart item
    const pipe =  store.pipes[0];
    pipe.item.type = 'Bomb';
    // Move bird to item position
    store.bird.x = pipe.item.x + 10;
    store.bird.y = pipe.item.y + 10;
   
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newStore = window.store;

    return {
      initialBomb,
      finalBomb: newStore.bombs,
    };
  });
  expect(result.finalBomb).toBe(result.initialBomb + 1);
});

test('should not exceed maximum bomb count', async ({ page }) => {
  // Set initial bomb count to max-1
  await page.evaluate(() => {
    window.store.bombs = 3;
  });

  await page.waitForTimeout(200);

  // Setup pipe with Boom item at bird position
  const result = await page.evaluate(async () => {
    window.store.weather.current = 'Night';
    // Setup heart item
    const pipe =  store.pipes[0];
    pipe.item.type = 'Bomb';
    // Move bird to item position
    store.bird.x = pipe.item.x + 10;
    store.bird.y = pipe.item.y + 10;
   
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newStore = window.store;

    return {
      finalBomb: newStore.bombs,
    };
  });
  expect(result.finalBomb).toBe(3);
});

test('should trigger explosion and clear enemies when using bomb', async ({ page }) => {
  // Setup initial state with enemies and bombs
  await page.evaluate(() => {
    window.store.bombs = 1;
    window.store.enemies = [
      { x: 100, y: 100, width: 30, height: 30 },
      { x: 200, y: 200, width: 30, height: 30 }
    ];
  });

  // Trigger bomb
  await page.keyboard.press('b');
  await page.waitForTimeout(100);

  // Check if enemies were cleared and bomb was used
  const state = await page.evaluate(() => ({
    bombs: window.store.bombs,
    enemyCount: window.store.enemies.length,
  }));

  expect(state.bombs).toBe(0);
  expect(state.enemyCount).toBe(0);
});

test('should damage boss when using bomb', async ({ page }) => {
  // Wait for boss spawn time
  await page.waitForTimeout(10000);
  
  // Check if boss exists and is active
  const bossState = await page.evaluate(() => {
    return window.store.boss;
  });
  
  expect(bossState.lives).toBe(10);

  // Use bomb
  await page.keyboard.press('b');
  await page.waitForTimeout(100);

  // Check boss damage
  const finalBossLives = await page.evaluate(() => window.store.boss.lives);
  expect(finalBossLives).toBe(9);
});