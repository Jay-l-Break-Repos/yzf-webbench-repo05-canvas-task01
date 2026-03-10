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
  await page.click('canvas');
});

test('weather system initialization', async ({ page }) => {
  const weatherState = await page.evaluate(() => window.store.weather);
  expect(weatherState).toBeTruthy();
  expect(weatherState.current).toBe('Normal');
});

test('weather changes after 5 seconds', async ({ page }) => {
  await page.evaluate(() => {
    window.store.mode = 'debug';
  });
  const initialWeather = await page.evaluate(() => window.store.weather.current);
  
  await page.waitForTimeout(6000);
  
  const newWeather = await page.evaluate(() => window.store.weather.current);
  expect(newWeather).not.toBe(initialWeather);
  expect(['Rain', 'Wind', 'Night']).toContain(newWeather);
});

test('weather system updates with animation frame', async ({ page }) => {
  const particlesMoved = await page.evaluate(async () => {
    window.store.weather.current = 'Rain';

    const getParticlePositions = () => 
      window.store.weather.particles.map(p => ({ x: p.x, y: p.y }));
    
    const initialPositions = getParticlePositions();
    await new Promise(resolve => setTimeout(resolve, 100));
    const newPositions = getParticlePositions();
    
    return initialPositions.some((pos, i) => 
      pos.x !== newPositions[i].x || pos.y !== newPositions[i].y
    );
  });
  
  expect(particlesMoved).toBe(true);
});
