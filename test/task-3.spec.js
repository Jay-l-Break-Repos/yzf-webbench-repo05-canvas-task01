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
})

test('should load and display bird image correctly', async ({ page }) => {
  // Set a known DPR value
  await page.evaluate(async () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: function() { return 2; }
    });
    // Trigger resize to apply new DPR
    window.dispatchEvent(new Event('resize'));
  });

  await page.waitForTimeout(100);

  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;

    const centerY = canvasHeight/2;
    const imageData = ctx.getImageData(30 * dpr, centerY * dpr, 50 * dpr, 50 * dpr);
    
    let nonTransparentPixels = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      if (imageData.data[i + 3] > 0) { // check alpha channel
        nonTransparentPixels++;
      }
    }

    return {
      canvasWidth,
      canvasHeight,
      imageDataLength: imageData.data.length,
      nonTransparentPixels,
      dpr: window.devicePixelRatio,
      birdPosition: {
        x: 30,
        y: centerY
      }
    };
  });

  expect(canvasInfo.nonTransparentPixels).toBeGreaterThan(0);
});


test('should maintain bird after resize', async ({ page }) => {
  const getPixelData = async () => {
    return page.evaluate(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const imageData = ctx.getImageData(30, canvas.height/2, 50, 50);
      return imageData.data.some(pixel => pixel !== 0);
    });
  };

  const initialHasContent = await getPixelData();
  expect(initialHasContent).toBeTruthy();

  await page.setViewportSize({ width: 300, height: 400 });
  
  await page.waitForTimeout(200);

  const afterResizeHasContent = await getPixelData();
  expect(afterResizeHasContent).toBeTruthy();
}); 


test('window.store should track floorX', async ({ page }) => {
  await page.click('canvas');
  // Wait for a few animation frames
  await page.waitForTimeout(100);

  // Check if floorX has changed due to animation
  const updatedFloorX = await page.evaluate(() => window.store.floorX);
  expect(updatedFloorX).toBeLessThan(0);
});

test('floor should move left continuously', async ({ page }) => {
  await page.waitForSelector('canvas');
  await page.evaluate(async () => {
    Object.defineProperty(window, 'devicePixelRatio', {
      get: function() { return 2; }
    });
    // Trigger resize to apply new DPR
    window.dispatchEvent(new Event('resize'));
  });
  // startGame
  await page.click('canvas');
  // click should not trigger animation muiltple times
  await page.click('canvas');
  await page.click('canvas');
  // Wait for some frames to pass
  await page.waitForTimeout(100);

  // Get initial floor position
  const initialFloorX = await page.evaluate(() => window.store.floorX);
  
  // Wait for some frames to pass
  await page.waitForTimeout(100);
  
  // Get updated floor position
  const updatedFloorX = await page.evaluate(() => window.store.floorX);
  // Check if floor has moved left
  expect(updatedFloorX).toBeLessThan(initialFloorX);
  
  // Ensure movement is roughly in the expected range
  // In 100ms at 60fps, we expect about 6 frames
  // Each frame moves 4px, so around 24px movement
  // We'll allow a wide range of 16-32px movement to account for timing variations
  const movement = initialFloorX - updatedFloorX;
  expect(movement).toBeGreaterThanOrEqual(16);
  expect(movement).toBeLessThanOrEqual(32);
});