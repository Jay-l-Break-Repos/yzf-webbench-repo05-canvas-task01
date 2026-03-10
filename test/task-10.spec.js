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

test('collecting heart increases lives count', async ({ page }) => {
  await page.waitForTimeout(200);

  const result = await page.evaluate(async () => {
    const store = window.store;
    const initialLives = store.lives;
    
    // Setup heart item
    const pipe =  store.pipes[0];
    pipe.item.type = 'Heart';
    // Move bird to item position
    store.bird.x = pipe.item.x + 10;
    store.bird.y = pipe.item.y + 10;
   
    await new Promise(resolve => setTimeout(resolve, 300));
    const newStore = window.store;

    return {
      initialLives,
      finalLives: newStore.lives,
    };
  });
  
  expect(result.finalLives).toBe(result.initialLives + 1);
});

test('lives cannot exceed maximum', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const result = await page.evaluate(async () => {
    const store = window.store;
    store.lives = store.maxLives; // Set to max lives
    
     // Setup heart item
     const pipe =  store.pipes[0];
     pipe.item.type = 'Heart';
     // Move bird to item position
     store.bird.x = pipe.item.x + 10;
     store.bird.y = pipe.item.y + 10;
    
     await new Promise(resolve => setTimeout(resolve, 100));
     const newStore = window.store;
    
    return {
      lives: newStore.lives,
      maxLives: newStore.maxLives
    };
  });
  
  expect(result.lives).toBe(result.maxLives);
});

test('losing a life provides temporary immunity', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const result = await page.evaluate(async () => {
    const store = window.store;
    store.lives = 2;
    
    // Simulate pipe collision
    const pipe = store.pipes[0];
    store.bird.x = pipe.x;
    store.bird.y = pipe.topHeight - 10;
    
    // Check collision
    await new Promise(resolve => setTimeout(resolve, 100));
    const newStore = window.store;
    
    return {
      lives: newStore.lives,
      isProtected: newStore.isProtected,
      shieldDuration: newStore.shieldEndTime - Date.now()
    };
  });
  
  expect(result.lives).toBe(1);
  expect(result.isProtected).toBe(true);
  expect(result.shieldDuration).toBeGreaterThan(0);
  expect(result.shieldDuration).toBeLessThan(1000);
});

test('game over only occurs at zero lives', async ({ page }) => {
  await page.waitForTimeout(200);
  
  const result = await page.evaluate(async () => {
    const store = window.store;
    store.lives = 1;
    
    // Simulate pipe collision
    const pipe = store.pipes[0];
    store.bird.x = pipe.x;
    store.bird.y = pipe.topHeight - 10;
    
    // Check collision
    await new Promise(resolve => setTimeout(resolve, 100));
    const newStore = window.store;
    
    return {
      isGameOver: newStore.isGameOver
    };
  });
  
  expect(result.isGameOver).toBe(true);
});

test('lives counter is displayed correctly', async ({ page }) => {
  await page.waitForTimeout(200);
  
   // Check if the score text is rendered with correct scaling
   const scoreText = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    // Get the actual pixel values from the canvas
    const imageData = ctx.getImageData(canvas.clientWidth-50, 1, 50, 20);
    
    // Check if there are white pixels (text) in the expected area
    const hasText = Array.from(imageData.data).some(
      (value, index) => index % 4 === 3 && value > 0
    );

    return {
      hasText,
    };
  });

  // Verify that text exists in the expected area
  expect(scoreText.hasText).toBe(true);
  
});