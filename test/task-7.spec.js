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
  await page.waitForTimeout(100);
  await page.click('canvas');
});

test('game should end when bird collides with pipe', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Set up a collision scenario with a pipe
  await page.evaluate(() => {
    window.store.pipes = [{
      x: window.store.bird.x,  // Same x position as bird
      topHeight: 0,            // Top pipe height
      bottomY: window.store.bird.y,  // Bottom pipe starting at bird's position
      width: 50,
      passed: false
    }];
  });
  
  // Wait for collision detection
  await page.waitForTimeout(100);
  
  // Verify game over state
  const gameState = await page.evaluate(() => ({
    isGameOver: window.store.isGameOver,
    isAnimating: window.store.isAnimating
  }));
  
  expect(gameState.isGameOver).toBe(true);
  expect(gameState.isAnimating).toBe(false);
});

test('score should increase when passing through pipes', async ({ page }) => {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(200);

  // Set up a pipe that's about to be passed
  await page.evaluate(() => {
    window.store.pipes = [{
      x: window.store.bird.x - 51,  // Need behind the bird, the pipe with is 50.
      topHeight: 100,
      bottomY: 300,
      width: 50,
      passed: false
    }];
    window.store.score = 0;
  });
  
  // Wait for score update
  await page.waitForTimeout(500);
  
  // Verify score increased
  const score = await page.evaluate(() => window.store.score);

  expect(score).toBe(1);
});

test('score should only increase once per pipe', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Set up a pipe that's already been passed
  await page.evaluate(() => {
    window.store.pipes = [{
      x: window.store.bird.x - 51, // need to be behind bird
      topHeight: 100,
      bottomY: 300,
      width: 50,
      passed: true  // Already passed
    }];
    window.store.score = 1;
  });
  
  // Wait some time
  await page.waitForTimeout(100);
  
  // Verify score hasn't changed
  const score = await page.evaluate(() => window.store.score);
  expect(score).toBe(1);
});
