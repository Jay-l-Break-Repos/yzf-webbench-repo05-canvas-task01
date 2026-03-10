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

test('shield item moves with pipes', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const initialPosition = await page.evaluate(() => {
    const store = window.store;
    const pipe = store.pipes.find(p => p.item);
    return pipe?.item.x;
  });
  
  await page.waitForTimeout(100);
  
  const newPosition = await page.evaluate(() => {
    const store = window.store;
    const pipe = store.pipes.find(p => p.item);
    return pipe?.item.x;
  });
  
  expect(newPosition).toBeLessThan(initialPosition);
});


test('collecting shield activates protection', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const shieldCollected = await page.evaluate(async () => {
    const store = window.store;
    const pipe = store.pipes[0];
    pipe.item.type = 'Shield';

    // Move bird to item position
    store.bird.x = pipe.item.x + 10;
    store.bird.y = pipe.item.y + 10;
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const newStore = window.store;

    return {
      isProtected: newStore.isProtected
    };
  });
  
  expect(shieldCollected.isProtected).toBe(true);
});

test('shield protection prevents death from pipe collision', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const survived = await page.evaluate(async () => {
    const store = window.store;
    // Activate shield
    store.isProtected = true;
    store.shieldEndTime = Date.now() + 5000;
    
    // Simulate pipe collision
    const pipe = store.pipes[0];
    store.bird.x = pipe.x;
    store.bird.y = pipe.topHeight - 10;
    
    // Check collision
    await new Promise(resolve => setTimeout(resolve, 100));
    const newStore = window.store;
    return !newStore.isGameOver;
  });
  
  expect(survived).toBe(true);
});

test('shield effect expires after duration', async ({ page }) => {
  await page.waitForTimeout(200);
  
  // Set short shield duration for testing
  await page.evaluate(() => {
    const store = window.store;
    store.isProtected = true;
    store.shieldEndTime = Date.now() + 100; // 100ms duration
  });
  
  await page.waitForTimeout(200); // Wait for shield to expire
  
  const shieldActive = await page.evaluate(() => {
    return window.store.isProtected;
  });
  
  expect(shieldActive).toBe(false);
});

test('collecting another shield while protected resets duration', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const durationReset = await page.evaluate(async () => {
    const store = window.store;
    // Set initial shield
    store.isProtected = true;
    store.shieldEndTime = Date.now() + 2000;
    
    const initialEndTime = store.shieldEndTime;
    
    const pipe = store.pipes[0];
    pipe.item.type = 'Shield';

    // Move bird to item position
    store.bird.x = pipe.item.x + 10;
    store.bird.y = pipe.item.y + 10;
    
    await new Promise(resolve => setTimeout(resolve, 100));
    const newStore = window.store;
    
    return newStore.shieldEndTime > initialEndTime;
  });
  
  expect(durationReset).toBe(true);
});

test('shield items are properly positioned in pipe gaps', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const properlyPositioned = await page.evaluate(() => {
    const store = window.store;
    const pipe = store.pipes.find(p => p.item);
    if (!pipe?.item) return false;
    
    const itemY = pipe.item.y;
    const gapCenter = pipe.topHeight + (pipe.bottomY - pipe.topHeight) / 2;
    
    // Check if item is roughly in the center of the gap (allowing for small margin)
    return Math.abs(itemY + 10 - gapCenter) < 5; // 10 is half of item height
  });
  
  expect(properlyPositioned).toBe(true);
});