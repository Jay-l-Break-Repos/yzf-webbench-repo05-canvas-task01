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
  // wait for img loading
  await page.waitForTimeout(100);
  await page.click('canvas');
  // store.mode = 'debug';
  await page.evaluate(() => {
    window.store.mode = 'debug';
  });
});


test('bird should fall with gravity', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  const initialY = await page.evaluate(() => window.store.bird.y);
  await page.waitForTimeout(1000);
  const laterY = await page.evaluate(() => window.store.bird.y);
  
  expect(laterY).toBeGreaterThan(initialY);
});

test('bird should respond to flap controls', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Test mouse click
  await page.waitForTimeout(200); // Wait for initial fall
  const preClickY = await page.evaluate(() => window.store.bird.y);
  await page.click('canvas');
  await page.waitForTimeout(100);
  const postClickY = await page.evaluate(() => window.store.bird.y);
  expect(postClickY).toBeLessThan(preClickY);

  await page.waitForTimeout(300);
  const preClickY2 = await page.evaluate(() => window.store.bird.y);
  await page.click('canvas');
  await page.waitForTimeout(100);
  const postClickY2 = await page.evaluate(() => window.store.bird.y);
  expect(postClickY2).toBeLessThan(preClickY2);
  
  // Test Enter key
  await page.waitForTimeout(200);
  const preKeyY = await page.evaluate(() => window.store.bird.y);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(100);
  const postKeyY = await page.evaluate(() => window.store.bird.y);
  expect(postKeyY).toBeLessThan(preKeyY);
});

test('bird velocity should be capped', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Wait for bird to fall for a while
  await page.waitForTimeout(2000);
  
  const velocity = await page.evaluate(() => window.store.bird.velocity);
  expect(velocity).toBeLessThanOrEqual(6);
});

test('bird rotation should follow velocity', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Test rotation during fall
  await page.waitForTimeout(500);
  const fallingRotation = await page.evaluate(() => window.store.bird.rotation);
  expect(fallingRotation).toBeGreaterThan(0);
  
  // Test rotation during rise
  await page.click('canvas');
  await page.waitForTimeout(120);
  const risingRotation = await page.evaluate(() => window.store.bird.rotation);
  expect(risingRotation).toBeLessThan(0);
  // Verify rotation bounds
  expect(risingRotation).toBeGreaterThanOrEqual(-35);
  expect(fallingRotation).toBeLessThanOrEqual(35);
});