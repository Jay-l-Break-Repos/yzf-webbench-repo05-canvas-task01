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


test('game should end when bird hits the ground', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Wait for bird to fall to ground
  await page.waitForTimeout(3000);
  
  const isGameOver = await page.evaluate(() => window.store.isGameOver);
  const isAnimating = await page.evaluate(() => window.store.isAnimating);
  
  expect(isGameOver).toBe(true);
  expect(isAnimating).toBe(false);
});


test('game should restart correctly after game over', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Wait for game over
  await page.waitForTimeout(3000);
  
  // Verify game over state
  let isGameOver = await page.evaluate(() => window.store.isGameOver);
  expect(isGameOver).toBe(true);
  
  // Click to restart
  await page.waitForTimeout(200);
  await page.click('canvas');
  await page.waitForTimeout(100);
  
  // Verify game has restarted
  const newGameState = await page.evaluate(() => ({
    isGameOver: window.store.isGameOver,
    isAnimating: window.store.isAnimating,
    score: window.store.score,
    birdY: window.store.bird.y,
    pipes: window.store.pipes.length
  }));
  
  expect(newGameState.isGameOver).toBe(false);
  expect(newGameState.isAnimating).toBe(true);
  expect(newGameState.score).toBe(0);
});

test('game should restart with Enter key after game over', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Wait for game over
  await page.waitForTimeout(3000);
  
  // Verify game over state
  let isGameOver = await page.evaluate(() => window.store.isGameOver);
  expect(isGameOver).toBe(true);
  
  // Press Enter to restart
  await page.waitForTimeout(200);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  
  // Verify game has restarted
  const newGameState = await page.evaluate(() => ({
    isGameOver: window.store.isGameOver,
    isAnimating: window.store.isAnimating,
    score: window.store.score
  }));
  
  expect(newGameState.isGameOver).toBe(false);
  expect(newGameState.isAnimating).toBe(true);
  expect(newGameState.score).toBe(0);
});

test('should have input cooldown after game over', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Wait and check for game over
  const gameOverPromise = page.waitForFunction(() => window.store.isGameOver === true);
  await gameOverPromise;
  
  // Try to restart immediately
  await page.click('canvas');
  await page.waitForTimeout(100);
  
  // Verify game has not restarted (still in game over state)
  const immediateState = await page.evaluate(() => ({
    isGameOver: window.store.isGameOver,
    isAnimating: window.store.isAnimating
  }));
  
  expect(immediateState.isGameOver).toBe(true);
  expect(immediateState.isAnimating).toBe(false);
  
  // Wait for cooldown to end and try again
  await page.waitForTimeout(500);
  await page.click('canvas');
  await page.waitForTimeout(100);
  
  // Verify game has restarted after cooldown
  const afterCooldownState = await page.evaluate(() => ({
    isGameOver: window.store.isGameOver,
    isAnimating: window.store.isAnimating
  }));
  
  expect(afterCooldownState.isGameOver).toBe(false);
  expect(afterCooldownState.isAnimating).toBe(true);
});