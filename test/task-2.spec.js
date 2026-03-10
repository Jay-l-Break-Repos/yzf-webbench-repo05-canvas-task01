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

const { test, expect } = require('@playwright/test')

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.waitForTimeout(100);
})

test('canvas should resize when viewport changes', async ({ page }) => {

  async function getSize() {
    return await page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      return {
        width: canvas.width,
        height: canvas.height
      };
    }
  )};

  // Resize viewport
  await page.setViewportSize({ width: 600, height: 800 });
  
  // Wait for potential resize handlers
  await page.waitForTimeout(100);

  // Get new canvas dimensions
  const newSize = await getSize();

  // Canvas should resize with viewport
  expect(newSize.width).toBe(600);
  expect(newSize.height).toBe(800);

  await page.setViewportSize({ width: 300, height: 400 });
  await page.waitForTimeout(100);
  const newSize2 = await getSize();

  // Canvas should resize with viewport
  expect(newSize2.width).toBe(300);
  expect(newSize2.height).toBe(400);
});

test('score text should be rendered with correct DPR scaling', async ({ page }) => {
  // Set a known DPR value
  await page.evaluate(async () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: function() { return 2; }
    });
    // Trigger resize to apply new DPR
    window.dispatchEvent(new Event('resize'));
  });

  await page.waitForTimeout(100);

  // Check if the score text is rendered with correct scaling
  const textProperties = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Get the actual pixel values from the canvas
    const imageData = ctx.getImageData(10 * dpr, 10 * dpr, 50 * dpr, 20 * dpr);
    
    // Check if there are white pixels (text) in the expected area
    const hasText = Array.from(imageData.data).some(
      (value, index) => index % 4 === 3 && value > 0
    );
    return {
      hasText,
      canvasWidth: canvas.width,
      canvasClientWidth: canvas.clientWidth,
      styleWidth: parseFloat(canvas.style.width),
      dpr
    };
  });

  // Verify that text exists in the expected area
  expect(textProperties.hasText).toBe(true);
  
  // Verify that canvas dimensions are properly scaled for DPR
  expect(textProperties.canvasWidth).toBe(textProperties.styleWidth * textProperties.dpr);
  expect(textProperties.canvasWidth).toBe(textProperties.canvasClientWidth * textProperties.dpr);
});

test('window.store.score should be 0', async ({ page }) => {
  const score = await page.evaluate(() => window.store.score);
  expect(score).toBe(0);
})