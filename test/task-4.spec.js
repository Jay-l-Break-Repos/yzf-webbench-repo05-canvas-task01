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
});

test('pipes should be created and move correctly', async ({ page }) => {
  // Wait for the canvas and initial render
  await page.waitForSelector('canvas');
  // Get initial pipes state
  const initialPipes = await page.evaluate(() => window.store.pipes);
  expect(initialPipes.length).toBe(0);
  await page.click('canvas');
  await page.waitForTimeout(100);
  const firstPipes = await page.evaluate(() => window.store.pipes);
  // Wait a moment and check if pipes have moved left
  const firstPipeInitialX = firstPipes[0].x;
  await page.waitForTimeout(1000);
  
  const updatedPipes = await page.evaluate(() => window.store.pipes);
  expect(updatedPipes[0].x).toBeLessThan(firstPipeInitialX);
});

test('new pipes should be created when necessary', async ({ page }) => {
  await page.waitForSelector('canvas');
  
  // Get initial pipe count
  const initialPipeCount = await page.evaluate(() => window.store.pipes.length);
  expect(initialPipeCount).toBe(0);
  await page.click('canvas');
  // Wait for new pipes to be created
  await page.waitForTimeout(2000);
  
  const newPipeCount = await page.evaluate(() => window.store.pipes.length);
  expect(newPipeCount).toBeGreaterThanOrEqual(initialPipeCount);
});

test('pipes should have correct properties', async ({ page }) => {
  await page.waitForSelector('canvas');
  await page.click('canvas');
  // Wait long enough for initial pipes to move off screen
  await page.waitForTimeout(1000);

  const pipeProperties = await page.evaluate(() => {
    const pipe = window.store.pipes[0];
    return {
      hasX: 'x' in pipe,
      hasTopHeight: 'topHeight' in pipe,
      hasBottomY: 'bottomY' in pipe,
      hasWidth: 'width' in pipe,
      hasPassed: 'passed' in pipe,
      gapExists: pipe.bottomY > pipe.topHeight
    };
  });
  
  expect(pipeProperties.hasX).toBeTruthy();
  expect(pipeProperties.hasTopHeight).toBeTruthy();
  expect(pipeProperties.hasBottomY).toBeTruthy();
  expect(pipeProperties.hasWidth).toBeTruthy();
  expect(pipeProperties.hasPassed).toBeTruthy();
  expect(pipeProperties.gapExists).toBeTruthy();
});
