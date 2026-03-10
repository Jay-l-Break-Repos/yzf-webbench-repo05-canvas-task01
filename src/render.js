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

import { updateStore, activateShield } from './store.js';
import { generatePipe } from './util.js';
import { PIPE_SPEED, PIPE_SPAWN_DISTANCE, ITEM_SIZE, COIN_SCORE, WIND_SPEED_MULTIPLIER, BOSS_SIZE } from './constants.js';

export function drawScore(ctx) {
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.textAlign = 'left';
    ctx.lineWidth = 2;
    const text = `Score: ${window.store.score}`;
    const metrics = ctx.measureText(text);
    const padding = 5;
    ctx.strokeRect(10, 10, metrics.width + padding * 2, 24);
    ctx.fillText(text, 15, 27);
}

export function drawLives(ctx, canvas) {
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    const text = `❤ x ${window.store.lives}`;
    ctx.fillText(text, canvas.width / window.store.dpr - 10, 27);
}

export function drawBird(ctx) {
    ctx.save();
    ctx.translate(window.store.bird.x + window.store.assets.birdImg.width / 2, window.store.bird.y + window.store.assets.birdImg.height / 2);
    ctx.rotate(window.store.bird.rotation * Math.PI / 180);
    ctx.drawImage(window.store.assets.birdImg, -window.store.assets.birdImg.width / 2, -window.store.assets.birdImg.height / 2);
    ctx.restore();

    if (window.store.isProtected) {
        const currentTime = Date.now();
        const remainingTime = window.store.shieldEndTime - currentTime;
        const isFlashing = remainingTime <= 1000 && Math.floor(remainingTime / 100) % 2 === 0;

        if (!isFlashing) {
            ctx.save();
            ctx.translate(window.store.bird.x + window.store.assets.birdImg.width / 2, window.store.bird.y + window.store.assets.birdImg.height / 2);
            ctx.beginPath();
            const radius = 1.5 * window.store.assets.birdImg.width;
            for (let i = 0; i < 8; i++) {
                const angle = i * Math.PI / 4;
                ctx.lineTo(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius
                );
                ctx.lineTo(
                    Math.cos(angle + Math.PI / 8) * (radius * 0.6),
                    Math.sin(angle + Math.PI / 8) * (radius * 0.6)
                );
            }
            ctx.closePath();
            ctx.strokeStyle = 'lime';
            ctx.lineWidth = 5;
            ctx.stroke();
            ctx.restore();
        }

        if (remainingTime <= 0) {
            updateStore({ isProtected: false });
        }
    }
}

export function drawFloor(ctx, canvas) {
    const floorY = canvas.height / window.store.dpr - window.store.floorHeight;
    for (let i = 0; i * window.store.assets.floorImg.width < canvas.width / window.store.dpr + window.store.assets.floorImg.width; i++) {
        ctx.drawImage(window.store.assets.floorImg, i * window.store.assets.floorImg.width + window.store.floorX, floorY);
    }
    if (window.store.isAnimating) {
        const speedMultiplier = (window.store.weather.current === 'Wind' ? WIND_SPEED_MULTIPLIER : 1) * (window.store.speedUp ? 2 : 1);
        const newFloorX = window.store.floorX - PIPE_SPEED * window.store.frameAdjustedRate * speedMultiplier;
        updateStore({
            floorX: newFloorX <= -window.store.assets.floorImg.width ? 0 : newFloorX
        });
    }
}

export function drawPipes(ctx) {
    window.store.pipes.forEach(pipe => {
        ctx.drawImage(window.store.assets.pipeUpImg, pipe.x, pipe.topHeight - window.store.assets.pipeUpImg.height);
        ctx.drawImage(window.store.assets.pipeDownImg, pipe.x, pipe.bottomY);

        if (pipe.item && !pipe.item.collected) {
            ctx.save();
            ctx.translate(pipe.item.x + ITEM_SIZE / 2, pipe.item.y + ITEM_SIZE / 2);
            if (pipe.item.type === 'Shield') {
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = 'green';
                ctx.fillRect(-ITEM_SIZE / 2, -ITEM_SIZE / 2, ITEM_SIZE, ITEM_SIZE);
            } else if (pipe.item.type === 'Heart') {
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.moveTo(0, ITEM_SIZE / 4);
                ctx.bezierCurveTo(ITEM_SIZE / 4, 0, ITEM_SIZE / 2, ITEM_SIZE / 4, ITEM_SIZE / 2, ITEM_SIZE / 2);
                ctx.bezierCurveTo(ITEM_SIZE / 2, ITEM_SIZE * 3 / 4, ITEM_SIZE / 4, ITEM_SIZE, 0, ITEM_SIZE * 3 / 4);
                ctx.bezierCurveTo(-ITEM_SIZE / 4, ITEM_SIZE, -ITEM_SIZE / 2, ITEM_SIZE * 3 / 4, -ITEM_SIZE / 2, ITEM_SIZE / 2);
                ctx.bezierCurveTo(-ITEM_SIZE / 2, ITEM_SIZE / 4, -ITEM_SIZE / 4, 0, 0, ITEM_SIZE / 4);
                ctx.fill();
            } else if (pipe.item.type === 'Coin') {
                ctx.fillStyle = 'yellow';
                ctx.beginPath();
                ctx.arc(0, 0, ITEM_SIZE / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'orange';
                ctx.beginPath();
                ctx.arc(0, 0, ITEM_SIZE / 3, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.restore();
        }
    });
}

export function updatePipes(canvas) {
    if (window.store.isAnimating) {
        const speedMultiplier = (window.store.weather.current === 'Wind' ? WIND_SPEED_MULTIPLIER : 1) * (window.store.speedUp ? 2 : 1);
        const updatedPipes = window.store.pipes.map(pipe => {
            const updatedX = pipe.x - PIPE_SPEED * window.store.frameAdjustedRate * speedMultiplier;
            if (!pipe.passed && updatedX + pipe.width < window.store.bird.x) {
                updateStore({ score: window.store.score + 1 });
                return { ...pipe, x: updatedX, passed: true };
            }
            if (pipe.item) {
                pipe.item.x = updatedX + pipe.width / 2 - ITEM_SIZE / 2;
            }
            return { ...pipe, x: updatedX };
        }).filter(pipe => pipe.x + pipe.width > 0);

        if (updatedPipes.length === 0 || updatedPipes[updatedPipes.length - 1].x <= canvas.width / window.store.dpr - PIPE_SPAWN_DISTANCE) {
            updatedPipes.push(generatePipe(canvas.width, canvas.height));
        }

        updateStore({ pipes: updatedPipes });
    }
}

export function drawStartText(ctx, canvas) {
    if (!window.store.isAnimating && !window.store.isGameOver) {
        ctx.font = '20px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Click to Start', canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr));
    }
}

export function drawGameOver(ctx, canvas) {
    if (window.store.isGameOver) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '30px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr) - 40);
        
        ctx.font = '20px Arial';
        ctx.fillText(`Score: ${window.store.score}`, canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr));
        
        ctx.font = '16px Arial';
        ctx.fillText('Click to Play Again', canvas.width / (2 * window.store.dpr), canvas.height / (2 * window.store.dpr) + 40);
    }
}

export function drawWeather(ctx, canvas) {
    const { current, particles } = window.store.weather;

    switch (current) {
        case 'Rain':
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'rgba(200, 200, 255, 0.8)';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            particles.forEach(particle => {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x + particle.length * Math.sin(Math.PI / 12), particle.y + particle.length);
                ctx.stroke();
            });
            break;
        case 'Wind':
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1;
            particles.forEach(particle => {
                ctx.beginPath();
                ctx.moveTo(particle.x, particle.y);
                ctx.lineTo(particle.x + particle.length, particle.y);
                ctx.stroke();
            });
            break;
        case 'Night':
            const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            gradient.addColorStop(0, 'rgba(0, 0, 20, 0.7)');
            gradient.addColorStop(1, 'rgba(0, 0, 40, 0.7)');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            particles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fill();
            });
            break;
    }
}

export function drawField(ctx) {
    if (!window.store.field) return;

    const { x, y, width, height } = window.store.field;
    const gradient = ctx.createRadialGradient(x + width / 2, y, 0, x + width / 2, y, width / 2);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
    gradient.addColorStop(1, 'rgba(0, 0, 255, 0.3)');
    
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x + width / 2, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.restore();
}

export function drawEnemies(ctx) {
    window.store.enemies.forEach(enemy => {
        ctx.save();
        ctx.translate(enemy.x + window.store.assets.enemyImg.width / 2, enemy.y + window.store.assets.enemyImg.height / 2);
        ctx.drawImage(window.store.assets.enemyImg, -window.store.assets.enemyImg.width / 2, -window.store.assets.enemyImg.height / 2);
        ctx.restore();
    });
}

export function drawBullets(ctx) {
    ctx.fillStyle = 'yellow';
    window.store.bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

export function drawBoss(ctx) {
    if (window.store.boss) {
        ctx.save();
        ctx.translate(window.store.boss.x + BOSS_SIZE / 2, window.store.boss.y + BOSS_SIZE / 2);
        ctx.drawImage(window.store.assets.enemyImg, -BOSS_SIZE / 2, -BOSS_SIZE / 2, BOSS_SIZE, BOSS_SIZE);
        ctx.restore();

        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(`HP: ${window.store.boss.lives}`, window.store.boss.x + BOSS_SIZE / 2, window.store.boss.y - 10);
    }
}

export function drawBossBullets(ctx) {
    ctx.fillStyle = 'red';
    window.store.bossBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

export function drawBombs(ctx, canvas) {
    const bombSize = 20;
    const padding = 10;
    const startY = 50; // Position below health points
    ctx.font = '14px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'right';
    ctx.fillText(`Bombs: ${window.store.bombs}`, canvas.width / window.store.dpr - 10, startY);
    
    for (let i = 0; i < window.store.bombs; i++) {
        const x = canvas.width / window.store.dpr - 80 + i * (bombSize + padding);
        const y = startY + 10;
        drawBombSymbol(ctx, x, y, bombSize);
    }
}

export function drawBombSymbol(ctx, x, y, size) {
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw radiation symbol
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(x + size/2, y + size/2);
        ctx.rotate(i * Math.PI * 2/3);
        ctx.moveTo(0, -size/4);
        ctx.lineTo(0, -size/3);
        ctx.restore();
    }
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();
}

export function drawBombExplosion(ctx, canvas) {
    const progress = window.store.explodProgress
    const pattern = createNuclearPattern(ctx);
    ctx.save();
    
    // Shake effect
    const shakeIntensity = (1 - progress) * 10;
    const shakeX = (Math.random() - 0.5) * shakeIntensity;
    const shakeY = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(shakeX, shakeY);
    
    // Overlay with nuclear pattern
    ctx.globalAlpha = (1 - progress) * 0.5;
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width / window.store.dpr, canvas.height / window.store.dpr);
    
    ctx.restore();
}

export function createNuclearPattern(ctx) {
    const patternCanvas = document.createElement('canvas');
    const patternCtx = patternCanvas.getContext('2d');
    patternCanvas.width = 50;
    patternCanvas.height = 50;
    
    // Draw nuclear symbol on pattern canvas
    drawBombSymbol(patternCtx, 5, 5, 40);
    
    return ctx.createPattern(patternCanvas, 'repeat');
}

export function drawCoinPhase(ctx, canvas) {
    if (!window.store.coinPhase.isActive) return;

    // Draw background effect
    ctx.fillStyle = 'rgba(0, 0, 100, 0.3)';
    ctx.fillRect(0, 0, canvas.width / window.store.dpr, canvas.height / window.store.dpr);

    // Draw coins
    window.store.coinPhase.coins.forEach(coin => {
        if (!coin.collected) {
            drawCoin(ctx, coin.x, coin.y, coin.size);
        }
    });

    // Draw remaining time
    const remainingTime = Math.max(0, Math.ceil(
        (window.store.coinPhase.lastPhaseEndTime - Date.now()) / 1000
    ));
    
    ctx.fillStyle = '#fff';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
        `Special Phase: ${remainingTime}s`, 
        canvas.width / (2 * window.store.dpr), 
        50
    );
}

function drawCoin(ctx, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd700';
    ctx.fill();
    ctx.strokeStyle = '#daa520';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add coin symbol
    ctx.fillStyle = '#daa520';
    ctx.font = `${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('¢', x + size/2, y + size/2);
    ctx.restore();
}