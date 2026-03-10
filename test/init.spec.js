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
const { getOffset, expectTolerance } = require('@web-bench/test-util')

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html')
})


test('should create canvas element with correct dimensions', async ({ page }) => {
  // Check if canvas element exists
  const canvas = page.locator('canvas')
  await expect(canvas).toBeVisible()

  // Check canvas dimensions
  const width = await canvas.evaluate((el) => el.width)
  const height = await canvas.evaluate((el) => el.height)
  
  expect(width/height).toBe(0.75) 
})