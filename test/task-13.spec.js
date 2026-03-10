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

const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForTimeout(200);
  await page.click('canvas');
  await page.evaluate(() => {
    window.store.mode = 'debug';
  });
});

test('Rain weather affects bird physics', async ({ page }) => {
  await page.waitForTimeout(200);

  const result = await page.evaluate(async () => {
    const getBirdY = () => 
      window.store.bird.y;

    const initialBirdY = getBirdY();
    await new Promise(resolve => setTimeout(resolve, 100));
    const newBirdY = getBirdY();

    window.store.weather.current = 'Rain';
    const newBirdY1 = getBirdY();
    await new Promise(resolve => setTimeout(resolve, 100));
    const newBirdY2 = getBirdY();

    return {
      gap1: newBirdY - initialBirdY,
      gap2: newBirdY2 - newBirdY1,
    };
  });

  expect(result.gap2).toBeGreaterThan(result.gap1);
});

test('Wind weather affects game speed', async ({ page }) => {
  await page.waitForTimeout(200);

  const result = await page.evaluate(async () => {
    const getPipeX = () => 
      window.store.pipes[0].x;

    const a = getPipeX();
    await new Promise(resolve => setTimeout(resolve, 100));
    const b = getPipeX();

    window.store.weather.current = 'Wind';
    const c = getPipeX();
    await new Promise(resolve => setTimeout(resolve, 100));
    const d = getPipeX();
    
    return {
      gap1: b - a,
      gap2: d - c,
    };
  });

  expect(result.gap1).toBeGreaterThan(result.gap2);
});