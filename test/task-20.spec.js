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

test('should enter coin space when boss is defeated', async ({ page }) => {
  // Wait for boss spawn time
  await page.waitForTimeout(10000);
  // Set up boss with 1 life
  await page.evaluate(() => {
    window.store.boss = {
      ...window.store.boss,
      lives: 1,
    };
  });

  // Use bomb
  await page.keyboard.press('b');
  await page.waitForTimeout(100);

  // Verify entered coin phase
  const coinPhaseActive = await page.evaluate(() => window.store.coinPhase.active || window.store.coinPhase.isActive);
  expect(coinPhaseActive).toBe(true);

  // Verify initial state
  const store = await page.evaluate(() => window.store);
  expect(store.pipes.length).toBe(0); // No pipes
  expect(store.enemies.length).toBe(0); // No enemies
  expect(store.bossBullets.length).toBe(0); // No boss bullets
});


test('should control bird movement in coin phase', async ({ page }) => {
  // Wait for boss spawn time
  await page.waitForTimeout(10000);
  // Set up boss with 1 life
  await page.evaluate(() => {
    window.store.boss = {
      ...window.store.boss,
      lives: 1,
    };
  });

  // Use bomb
  await page.keyboard.press('b');
  await page.waitForTimeout(100);

  // Test left movement
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(100);
  const leftPosition = await page.evaluate(() => window.store.bird.x);

  // Test right movement
  await page.keyboard.up('ArrowLeft');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(100);
  const rightPosition = await page.evaluate(() => window.store.bird.x);

  expect(rightPosition).toBeGreaterThan(leftPosition);
});
