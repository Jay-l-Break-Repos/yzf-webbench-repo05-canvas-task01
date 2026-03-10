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
    window.store.mode = 'debug';
    window.store.randomRate = 1;
    window.store.fieldRandomRate = 1; // Always generate field for testing
  });
  await page.click('canvas');
});

test('should generate field with correct properties', async ({ page }) => {
  // Wait for field generation (5 seconds)
  await page.waitForTimeout(5100);
  
  const field = await page.evaluate(() => window.store.field);
  
  expect(field).toBeTruthy();
  expect(field.type).toBe('Zero');
  expect(field.height).toBe(40);
  
  // Check width is 3 times pipe spacing
  expect(field.width).toBe(600);
});

test('field should move left with game speed', async ({ page }) => {
  await page.waitForTimeout(5100);
  
  const initialX = await page.evaluate(() => window.store.field.x);
  await page.waitForTimeout(100);
  const laterX = await page.evaluate(() => window.store.field.x);
  
  expect(laterX).toBeLessThan(initialX);
});

test('bird should not fall in zero gravity field', async ({ page }) => {
  await page.waitForTimeout(5100);
  
  // Position bird in field
  await page.evaluate(() => {
    const field = window.store.field;
    window.store.bird.x = field.x + field.width / 2;
    window.store.bird.velocity = 1; // Set positive velocity
  });
  
  await page.waitForTimeout(100);
  
  const velocity = await page.evaluate(() => window.store.bird.velocity);
  expect(velocity).toBe(0);
});

test('field should have correct y position at ground level', async ({ page }) => {
  await page.waitForTimeout(5100);
  
  const fieldY = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const field = window.store.field;
    console.log('Field Y:', field.y);
    console.log('Canvas Height:', canvas.height);
    console.log('Field Height:', field.height);
    return field.y === canvas.height - 80; // 80 is FLOOR_HEIGHT
  });
  
  expect(fieldY).toBeTruthy();
});
