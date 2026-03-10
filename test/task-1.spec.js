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
  await page.goto('/index.html')
})

test('background image should load correctly', async ({ page }) => {
  // Check if background image is set in CSS
  const hasBackground = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const computedStyle = window.getComputedStyle(canvas);
    const backgroundImage = computedStyle.backgroundImage;
    
    // Check if background-image is set and not 'none'
    return backgroundImage !== 'none' && backgroundImage !== '';
  });

  expect(hasBackground).toBe(true);

  // Verify background image URL
  const backgroundUrl = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const computedStyle = window.getComputedStyle(canvas);
    return computedStyle.backgroundImage;
  });

  // Should contain the correct image path
  expect(backgroundUrl).toContain('bg.png');
});

test('canvas should be centered on the page', async ({ page }) => {
  // Check if canvas position is actually in center
  const isPositionedCenter = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const rect = canvas.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const expectedLeft = (windowWidth - rect.width) / 2;
    // Allow 10px difference for rounding
    return Math.abs(rect.left - expectedLeft) <= 10;
  });

  expect(isPositionedCenter).toBe(true);
});