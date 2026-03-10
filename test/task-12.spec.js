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
  await page.evaluate(() => {
    window.store.randomRate = 1;
  });
  await page.click('canvas');
});

test('collecting coin increases score count', async ({ page }) => {
  await page.waitForTimeout(200);

  const result = await page.evaluate(async () => {
    const store = window.store;
    const initialScore = store.score;

    window.store.weather.current = 'Night';
    // Setup heart item
    const pipe =  store.pipes[0];
    pipe.item.type = 'Coin';
    // Move bird to item position
    store.bird.x = pipe.item.x;
    store.bird.y = pipe.item.y;
   
    await new Promise(resolve => setTimeout(resolve, 200));
    const newStore = window.store;

    return {
      initialScore,
      finalScore: newStore.score,
    };
  });
  expect(result.finalScore).toBe(result.initialScore + 11);
});