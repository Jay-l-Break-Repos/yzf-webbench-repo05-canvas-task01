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

import { updateStore, enterCoinPhase } from './store.js';
import { BIRD_INITIAL_X, BIRD_JUMP_VELOCITY, LIFE_SHIELD_DURATION, RAIN_JUMP_MULTIPLIER, BULLET_SIZE, BULLET_SPEED, BULLET_FIRING_INTERVAL, BOMB_ANIMATION_DURATION, BOMB_BOSS_DAMAGE } from './constants.js';
import { activateShield } from './store.js';
import { drawBombExplosion } from './render.js';

export function startAnimation() {
    if (!window.store.isAnimating && !window.store.isGameOver) {
        updateStore({ isAnimating: true });
    }
}

export function jump() {
    if (window.store.isAnimating) {
        const jumpMultiplier = window.store.weather.current === 'Rain' ? RAIN_JUMP_MULTIPLIER : 1;
        updateStore({
            bird: { ...window.store.bird, velocity: BIRD_JUMP_VELOCITY * jumpMultiplier }
        });
    }
}

export function loseLife() {
    const newLives = window.store.lives - 1;
    if (newLives <= 0) {
        endGame(document.getElementById('myCanvas'));
    } else {
        updateStore({ lives: newLives });
        activateShield(LIFE_SHIELD_DURATION);
    }
}

export function endGame(canvas) {
    updateStore({ isGameOver: true, isAnimating: false });
    setTimeout(() => {
        canvas.addEventListener('click', restartGame);
        window.addEventListener('keydown', handleKeydown);
    }, 500);
}

export function restartGame() {
    const canvas = document.getElementById('myCanvas')
    updateStore({
        isGameOver: false,
        isAnimating: true,
        score: 0,
        lives: 1,
        bombs: 3,
        bird: { x: BIRD_INITIAL_X, y: canvas.height / (2 * window.store.dpr) - window.store.assets.birdImg.height / 2, velocity: 0, rotation: 0 },
        pipes: [],
        field: null,
        enemies: [],
        bullets: [],
        boss: null,
        bossBullets: [],
        lastBossBulletFiredTime: 0,
        bossSpawnTime: Date.now(),
        bombs: 3,
        isExploding: false,
        explodProgress: 0,
    });
    canvas.removeEventListener('click', restartGame);
    window.removeEventListener('keydown', handleKeydown);
}

function handleKeydown(e) {
    if (e.key === 'Enter') {
        restartGame();
    }
}

export function fireBullet() {
    const currentTime = Date.now();
    if (currentTime - window.store.lastBulletFiredTime >= BULLET_FIRING_INTERVAL) {
        const newBullet = {
            x: window.store.bird.x + window.store.assets.birdImg.width,
            y: window.store.bird.y + window.store.assets.birdImg.height / 2 - BULLET_SIZE / 2,
            width: BULLET_SIZE,
            height: BULLET_SIZE,
            speed: BULLET_SPEED
        };
        updateStore({
            bullets: [...window.store.bullets, newBullet],
            lastBulletFiredTime: currentTime
        });
    }
}

export function useBomb() {
    const canvas = document.getElementById('myCanvas')
    if (window.store.bombs > 0 && window.store.isAnimating && !window.store.isExploding) {
        updateStore({ 
            bombs: window.store.bombs - 1,
            enemies: [],
            bossBullets: [],
            isExploding: true
        });

        // Handle boss damage
        if (window.store.boss) {
            const updatedBoss = {
                ...window.store.boss,
                lives: Math.max(0, window.store.boss.lives - BOMB_BOSS_DAMAGE)
            };
            updateStore({ boss: updatedBoss.lives > 0 ? updatedBoss : null });
            if (updatedBoss.lives<=0) {
                enterCoinPhase(canvas);
            }
        }

        // Start explosion animation
        let startTime = Date.now();
        function animateExplosion() {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / BOMB_ANIMATION_DURATION, 1);
            
            if (progress < 1) {
                updateStore({ explodProgress: progress });
                requestAnimationFrame(animateExplosion);
            } else {
                updateStore({ isExploding: false });
            }
        }
        animateExplosion();
    }
}