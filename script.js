        const symbols = ['🍒', '🍋', '🍊', '🔔', '💎', '⭐', '🍇', '👑', '🎁'];
        const payouts = {
            '🍒🍒🍒': 25000,
            '🍋🍋🍋': 37500,
            '🍊🍊🍊': 50000,
            '🍇🍇🍇': 75000,
            '🔔🔔🔔': 100000,
            '💎💎💎': 250000,
            '⭐⭐⭐': 500000,
            '👑👑👑': 1000000
        };

        let credits = 1000000;
        let isSpinning = false;
        let currentBetMultiplier = 1;
        let baseBet = 5000;
        let isAutoSpinning = false;
        let autoSpinInterval = null;
        let autoSpinCount = 0;
        let totalWinnings = 0;
        let freeSpinsRemaining = 0;
        let isFreeSpin = false;
        let isTurboMode = false;
        
        // Admin system variables
        let symbolWeights = {
            '🍒': 25,
            '🍋': 20,
            '🍊': 15,
            '🔔': 10,
            '💎': 8,
            '⭐': 5,
            '👑': 2,
            '🎁': 3,
            '🍇': 12
        };
        
        let gameStats = {
            totalSpins: 0,
            totalWins: 0,
            jackpotHits: 0
        };
        
        let spinHistory = [];
        
        function setBet(multiplier) {
            if (isAutoSpinning) {
                showNotification('Tidak bisa ganti bet saat auto spin aktif!', 'error');
                return;
            }
            
            currentBetMultiplier = multiplier;
            
            document.querySelectorAll('.bet-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.querySelector(`[data-bet="${multiplier}"]`).classList.add('active');
            
            document.getElementById('currentBetDisplay').textContent = `${multiplier}x (Rp ${formatRupiah(baseBet * multiplier)})`;
            document.getElementById('spinCost').textContent = formatRupiah(baseBet * multiplier);
            
            updateButtonStatus();
        }
        
        function updateCredits() {
            document.getElementById('credits').textContent = formatRupiah(credits);
            updateButtonStatus();
            updateBetButtonsAvailability();
        }

        function updateButtonStatus() {
            const spinButton = document.getElementById('spinButton');
            const autoSpinButton = document.getElementById('autoSpinButton');
            const currentBetCost = baseBet * currentBetMultiplier;
            
            const canSpin = freeSpinsRemaining > 0 || credits >= currentBetCost;
            
            if (!canSpin) {
                spinButton.classList.add('disabled');
                autoSpinButton.classList.add('disabled');
                document.querySelector('.spin-text').textContent = 'SALDO HABIS!';
                document.querySelector('.cost-text').textContent = 'Deposit untuk bermain';
                
                if (isAutoSpinning) {
                    stopAutoSpin();
                    showNotification('Auto spin dihentikan - saldo tidak cukup!', 'error');
                }
            } else {
                spinButton.classList.remove('disabled');
                autoSpinButton.classList.remove('disabled');
                updateSpinButtonForFreeSpin();
            }
        }

        function updateBetButtonsAvailability() {
            if (isAutoSpinning) return;
            
            document.querySelectorAll('.bet-btn').forEach(btn => {
                const betMultiplier = parseInt(btn.dataset.bet);
                const betCost = baseBet * betMultiplier;
                
                btn.style.pointerEvents = '';
                btn.style.cursor = '';
                
                if (credits < betCost) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                } else {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            });
        }

        function toggleAutoSpin() {
            if (isAutoSpinning) {
                stopAutoSpin();
            } else {
                startAutoSpin();
            }
        }

        function startAutoSpin() {
            const currentBetCost = baseBet * currentBetMultiplier;
            const autoSpinButton = document.getElementById('autoSpinButton');
            const autoSpinInfo = document.getElementById('autoSpinInfo');
            
            if (credits < currentBetCost || isSpinning) return;
            
            isAutoSpinning = true;
            autoSpinCount = 0;
            totalWinnings = 0;
            
            autoSpinButton.classList.add('active');
            document.querySelector('.auto-text').textContent = 'STOP AUTO';
            document.querySelector('.auto-status').textContent = 'Sedang Berjalan...';
            
            autoSpinInfo.style.display = 'block';
            updateAutoSpinInfo();
            
            const spinButton = document.getElementById('spinButton');
            spinButton.style.display = 'none';
            
            document.querySelectorAll('.bet-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                btn.style.cursor = 'not-allowed';
            });
            
            document.querySelectorAll('.credit-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.pointerEvents = 'none';
                btn.style.cursor = 'not-allowed';
            });
            
            autoSpinInterval = setInterval(() => {
                const canSpin = freeSpinsRemaining > 0 || credits >= (baseBet * currentBetMultiplier);
                
                if (!isSpinning && canSpin) {
                    spin(true);
                } else if (freeSpinsRemaining === 0 && credits < (baseBet * currentBetMultiplier)) {
                    stopAutoSpin();
                    showNotification('Auto spin dihentikan - saldo tidak cukup!', 'error');
                }
            }, isTurboMode ? 600 : 3500);
        }

        function stopAutoSpin() {
            const autoSpinButton = document.getElementById('autoSpinButton');
            const autoSpinInfo = document.getElementById('autoSpinInfo');
            
            isAutoSpinning = false;
            
            if (autoSpinInterval) {
                clearInterval(autoSpinInterval);
                autoSpinInterval = null;
            }
            
            autoSpinButton.classList.remove('active');
            document.querySelector('.auto-text').textContent = 'AUTO SPIN';
            document.querySelector('.auto-status').textContent = 'Mulai Otomatis';
                        
            const spinButton = document.getElementById('spinButton');
            spinButton.style.display = 'block';
            
            document.querySelectorAll('.credit-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.pointerEvents = '';
                btn.style.cursor = '';
            });
            
            document.querySelectorAll('.bet-btn').forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '';
                btn.style.pointerEvents = '';
                btn.style.cursor = '';
                
                const betMultiplier = parseInt(btn.dataset.bet);
                const betCost = baseBet * betMultiplier;
                if (credits < betCost) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                } else {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            });
            
            updateCredits();
            
            if (autoSpinCount > 0) {
                const netResult = totalWinnings - (autoSpinCount * baseBet * currentBetMultiplier);
                if (netResult >= 0) {
                    const resultText = `Auto spin selesai! ${autoSpinCount} putaran, profit Rp ${formatRupiah(netResult)}`;
                    showNotification(resultText, 'success');
                }
            }
        }

        function updateAutoSpinInfo() {
            document.getElementById('autoSpinCount').textContent = autoSpinCount;
            document.getElementById('totalWinnings').textContent = formatRupiah(totalWinnings);
        }

        function toggleTurboMode() {
            const turboButton = document.getElementById('turboButton');
            const turboStatus = document.getElementById('turboStatus');
            
            isTurboMode = !isTurboMode;
            
            if (isTurboMode) {
                turboButton.classList.add('active');
                turboStatus.style.display = 'inline';
                showNotification('Mode TURBO aktif! Auto spin 6x lebih cepat 🚀', 'success');
            } else {
                turboButton.classList.remove('active');
                turboStatus.style.display = 'none';
                showNotification('Mode TURBO dimatikan', 'success');
            }
            
            if (isAutoSpinning) {
                if (autoSpinInterval) {
                    clearInterval(autoSpinInterval);
                }
                
                autoSpinInterval = setInterval(() => {
                    const canSpin = freeSpinsRemaining > 0 || credits >= (baseBet * currentBetMultiplier);
                    
                    if (!isSpinning && canSpin) {
                        spin(true);
                    } else if (freeSpinsRemaining === 0 && credits < (baseBet * currentBetMultiplier)) {
                        stopAutoSpin();
                        showNotification('Auto spin dihentikan - saldo tidak cukup!', 'error');
                    }
                }, isTurboMode ? 600 : 3500);
            }
        }

        function updateTurboButtonStatus() {
            const turboButton = document.getElementById('turboButton');
            
            if (isAutoSpinning) {
                turboButton.classList.remove('disabled');
            } else {
                turboButton.classList.remove('disabled');
            }
        }
        
        function getRandomSymbol() {
            const weightedSymbols = [];
            
            for (const [symbol, weight] of Object.entries(symbolWeights)) {
                for (let i = 0; i < weight; i++) {
                    weightedSymbols.push(symbol);
                }
            }
            
            return weightedSymbols[Math.floor(Math.random() * weightedSymbols.length)];
        }

        function checkFreeSpins(symbols) {
            const freeSpinCount = symbols.filter(symbol => symbol === '🎁').length;
            if (freeSpinCount === 1) {
                return 1;
            } else if (freeSpinCount === 2) {
                return 3;
            } else if (freeSpinCount === 3) {
                return 5;
            }
            return 0;
        }

        function createScreenFlash() {
            const flash = document.createElement('div');
            flash.className = 'screen-flash';
            document.body.appendChild(flash);
            
            setTimeout(() => {
                document.body.removeChild(flash);
            }, 500);
        }

        function createCoinRain() {
            const coinRain = document.createElement('div');
            coinRain.className = 'coin-rain';
            
            for (let i = 0; i < 15; i++) {
                const coin = document.createElement('div');
                coin.className = 'coin';
                coin.style.left = Math.random() * 100 + '%';
                coin.style.animationDelay = Math.random() * 2 + 's';
                coin.style.animationDuration = (2 + Math.random() * 2) + 's';
                coinRain.appendChild(coin);
            }
            
            return coinRain;
        }

        function createFireworks() {
            const fireworks = document.createElement('div');
            fireworks.className = 'jackpot-fireworks';
            
            for (let i = 1; i <= 4; i++) {
                const firework = document.createElement('div');
                firework.className = `firework firework-${i}`;
                fireworks.appendChild(firework);
            }
            
            return fireworks;
        }

        function createWinRays() {
            const rays = document.createElement('div');
            rays.className = 'win-rays';
            
            for (let i = 1; i <= 8; i++) {
                const ray = document.createElement('div');
                ray.className = 'ray';
                rays.appendChild(ray);
            }
            
            return rays;
        }

        function createReelExplosion(reelElement) {
            const explosion = document.createElement('div');
            explosion.className = 'reel-explosion';
            
            for (let i = 1; i <= 6; i++) {
                const particle = document.createElement('div');
                particle.className = `explosion-particle particle-${i}`;
                explosion.appendChild(particle);
            }
            
            reelElement.appendChild(explosion);
            
            setTimeout(() => {
                if (explosion.parentNode) {
                    explosion.parentNode.removeChild(explosion);
                }
            }, 1500);
        }

        function createFreeSpinParticles() {
            const particles = document.createElement('div');
            particles.className = 'free-spin-particles';
            
            const gifts = ['🎁', '🎉', '✨', '🌟', '💫'];
            
            for (let i = 0; i < 8; i++) {
                const particle = document.createElement('div');
                particle.className = 'gift-particle';
                particle.textContent = gifts[Math.floor(Math.random() * gifts.length)];
                particle.style.left = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 2 + 's';
                particles.appendChild(particle);
            }
            
            return particles;
        }

        function addWinningEffects(reels, isJackpot = false) {
            if (isJackpot) {
                createScreenFlash();
            }
            
            reels.forEach((reel, index) => {
                setTimeout(() => {
                    reel.classList.add('winning');
                    reel.querySelector('.reel-symbol').classList.add('symbol-glow');
                    
                    createReelExplosion(reel.parentElement);
                    
                    setTimeout(() => {
                        reel.classList.remove('winning');
                        reel.querySelector('.reel-symbol').classList.remove('symbol-glow');
                    }, 3000);
                }, index * 200);
            });
        }

        function updateFreeSpinDisplay() {
            const freeSpinDisplay = document.getElementById('freeSpinDisplay');
            const freeSpinCount = document.getElementById('freeSpinCount');
            
            if (freeSpinsRemaining > 0) {
                freeSpinDisplay.style.display = 'block';
                freeSpinCount.textContent = freeSpinsRemaining;
                
                const particles = createFreeSpinParticles();
                freeSpinDisplay.appendChild(particles);
                
                setTimeout(() => {
                    if (particles.parentNode) {
                        particles.parentNode.removeChild(particles);
                    }
                }, 3000);
            } else {
                freeSpinDisplay.style.display = 'none';
            }
        }

        function updateSpinButtonForFreeSpin() {
            const spinButton = document.getElementById('spinButton');
            const spinText = document.querySelector('.spin-text');
            const costText = document.querySelector('.cost-text');
            
            if (freeSpinsRemaining > 0) {
                spinText.textContent = 'FREE SPIN';
                costText.textContent = `(${freeSpinsRemaining} tersisa)`;
                spinButton.classList.remove('disabled');
            } else {
                spinText.textContent = 'SPIN';
                costText.textContent = `(${formatRupiah(baseBet * currentBetMultiplier)} Rupiah)`;
            }
        }

        function spin(isAutoSpin = false) {
            const currentBetCost = baseBet * currentBetMultiplier;
            
            if (freeSpinsRemaining === 0 && credits < currentBetCost) {
                showNotification('Saldo tidak cukup untuk spin!', 'error');
                return;
            }
            
            if (isSpinning) return;
            
            isSpinning = true;
            const spinButton = document.getElementById('spinButton');
            const reels = [
                document.getElementById('reel1'),
                document.getElementById('reel2'),
                document.getElementById('reel3')
            ];
            
            spinButton.classList.add('spinning');
            
            if (freeSpinsRemaining > 0) {
                freeSpinsRemaining--;
                isFreeSpin = true;
                updateFreeSpinDisplay();
                updateSpinButtonForFreeSpin();
            } else {
                credits -= currentBetCost;
                isFreeSpin = false;
                updateCredits();
            }
            
            if (isAutoSpin) {
                autoSpinCount++;
                updateAutoSpinInfo();
            }
            
            const results = [];
            for (let i = 0; i < 3; i++) {
                results.push(getRandomSymbol());
            }
            
            const spinIntervals = [];
            reels.forEach((reel, index) => {
                reel.classList.add('spinning');
                if (isTurboMode) {
                    reel.classList.add('turbo');
                }
                
                const symbolElement = reel.querySelector('.reel-symbol');
                const spinInterval = setInterval(() => {
                    symbolElement.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                }, isTurboMode ? 30 : 80);
                spinIntervals.push(spinInterval);
            });
            
            const spinDuration = isTurboMode ? 400 : 2000;
            
            const stopDelays = isTurboMode ? [0, 100, 200] : [0, 300, 600];
            
            reels.forEach((reel, index) => {
                setTimeout(() => {
                    clearInterval(spinIntervals[index]);
                    reel.classList.remove('spinning');
                    reel.classList.remove('turbo');
                    reel.querySelector('.reel-symbol').textContent = results[index];
                    reel.style.boxShadow = '0 0 20px rgba(255,215,0,0.8)';
                    setTimeout(() => {
                        reel.style.boxShadow = '';
                    }, 300);
                }, spinDuration + stopDelays[index]);
            });
            
            setTimeout(() => {
                const resultKey = results.join('');
                let winAmount = 0;
                let resultMessage = '';
                let resultClass = '';
                let isWinning = false;
                let animationDuration = 0;
                
                const newFreeSpins = checkFreeSpins(results);
                if (newFreeSpins > 0) {
                    freeSpinsRemaining += newFreeSpins;
                    updateFreeSpinDisplay();
                    updateSpinButtonForFreeSpin();
                    
                    if (newFreeSpins === 1) {
                        resultMessage = '🎁 FREE SPIN! +1 Putaran Gratis!';
                        resultClass = 'free';
                    } else if (newFreeSpins === 3) {
                        resultMessage = '🎁🎁 BONUS! +3 Putaran Gratis!';
                        resultClass = 'free';
                    } else if (newFreeSpins === 5) {
                        resultMessage = '🎁🎁🎁 MEGA BONUS! +5 Putaran Gratis!';
                        resultClass = 'free';
                    }
                    isWinning = true;
                    animationDuration = isTurboMode ? 500 : 2500;
                }
                
                if (payouts[resultKey]) {
                    winAmount = payouts[resultKey] * currentBetMultiplier;
                    credits += winAmount;
                    
                    if (isAutoSpin) {
                        totalWinnings += winAmount;
                        updateAutoSpinInfo();
                    }
                    
                    if (resultKey === '👑👑👑') {
                        resultMessage = `🎰 JACKPOT! Menang Rp ${formatRupiah(winAmount)}! 🎰`;
                        resultClass = 'jackpot';
                        gameStats.jackpotHits++;
                        isWinning = true;
                        animationDuration = isTurboMode ? 800 : 4000;
                        const resultDisplay = document.getElementById('result');
                        const fireworks = createFireworks();
                        const coinRain = createCoinRain();
                        const winRays = createWinRays();
                        
                        resultDisplay.appendChild(fireworks);
                        resultDisplay.appendChild(coinRain);
                        resultDisplay.appendChild(winRays);
                        
                        setTimeout(() => {
                            if (fireworks.parentNode) fireworks.parentNode.removeChild(fireworks);
                            if (coinRain.parentNode) coinRain.parentNode.removeChild(coinRain);
                            if (winRays.parentNode) winRays.parentNode.removeChild(winRays);
                        }, animationDuration);
                        
                    } else {
                        if (newFreeSpins > 0) {
                            resultMessage += ` + Menang Rp ${formatRupiah(winAmount)}!`;
                            animationDuration = Math.max(animationDuration, isTurboMode ? 600 : 3000);
                        } else {
                            resultMessage = `🎉 Menang Rp ${formatRupiah(winAmount)}! 🎉`;
                            animationDuration = isTurboMode ? 600 : 3000;
                        }
                        resultClass = 'win';
                        gameStats.totalWins++;
                        isWinning = true;
                    }
                    
                    addWinningEffects(reels, resultKey === '👑👑👑');
                    
                } else if (!newFreeSpins) {
                    resultMessage = 'Coba lagi!';
                    resultClass = 'lose';
                    animationDuration = isTurboMode ? 100 : 500;
                }
                
                gameStats.totalSpins++;
                
                const spinRecord = {
                    timestamp: new Date().toLocaleString('id-ID'),
                    symbols: results.join(''),
                    bet: formatRupiah(isFreeSpin ? 0 : currentBetCost),
                    result: resultClass,
                    winAmount: winAmount,
                    freeSpins: newFreeSpins,
                    isFreeSpin: isFreeSpin
                };
                spinHistory.unshift(spinRecord);
                
                if (spinHistory.length > 100) {
                    spinHistory = spinHistory.slice(0, 100);
                }
                
                const resultDisplay = document.getElementById('result');
                resultDisplay.textContent = resultMessage;
                resultDisplay.className = `result-display ${resultClass}`;
                resultDisplay.classList.add('active');
                
                if (winAmount > 0) {
                    const sparkles = document.createElement('div');
                    sparkles.className = 'result-sparkles';
                    
                    for (let i = 0; i < 10; i++) {
                        const sparkle = document.createElement('div');
                        sparkle.className = 'sparkle';
                        sparkle.style.left = Math.random() * 100 + '%';
                        sparkle.style.animationDelay = Math.random() * 2 + 's';
                        sparkles.appendChild(sparkle);
                    }
                    
                    resultDisplay.appendChild(sparkles);
                    
                    setTimeout(() => {
                        if (sparkles.parentNode) {
                            sparkles.parentNode.removeChild(sparkles);
                        }
                    }, animationDuration);
                }
                
                updateCredits();
                
                setTimeout(() => {
                    isSpinning = false;
                    spinButton.classList.remove('spinning');
                }, animationDuration);
                
            }, spinDuration + 900);
        }

        function showDepositModal() {
            document.getElementById('depositModal').classList.add('active');
            document.getElementById('depositAmount').focus();
        }

        function closeDepositModal() {
            document.getElementById('depositModal').classList.remove('active');
            document.getElementById('depositAmount').value = '';
        }

        function setDepositAmount(amount) {
            document.getElementById('depositAmount').value = formatRupiah(amount);
        }

        function confirmDeposit() {
            const input = document.getElementById('depositAmount');
            let amount = input.value.replace(/[^\d]/g, '');
            amount = parseInt(amount);
            
            if (isNaN(amount) || amount < 1000) {
                showNotification('Minimal deposit Rp 1.000!', 'error');
                return;
            }
            
            if (amount % 1000 !== 0) {
                showNotification('Deposit harus kelipatan Rp 1.000!', 'error');
                return;
            }
            
            credits += amount;
            updateCredits();
            closeDepositModal();
            showNotification(`Berhasil deposit Rp ${formatRupiah(amount)}!`, 'success');
        }

        function withdraw() {
            if (credits < 1000) {
                showNotification('Minimal withdraw Rp 1.000!', 'error');
                return;
            }
            
            const withdrawAmount = Math.floor(credits / 1000) * 1000;
            credits = credits % 1000;
            updateCredits();
            showNotification(`Berhasil withdraw Rp ${formatRupiah(withdrawAmount)}!`, 'success');
        }

        function formatRupiah(amount) {
            return new Intl.NumberFormat('id-ID').format(amount);
        }

        function showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 10px;
                color: white;
                font-weight: bold;
                z-index: 10000;
                max-width: 300px;
                word-wrap: break-word;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                animation: slideInRight 0.3s ease-out;
            `;
            
            switch(type) {
                case 'success':
                    notification.style.background = 'linear-gradient(145deg, #2ed573, #1ea85f)';
                    break;
                case 'error':
                    notification.style.background = 'linear-gradient(145deg, #ff6b6b, #e55656)';
                    break;
                default:
                    notification.style.background = 'linear-gradient(145deg, #6c5ce7, #5f3dc4)';
            }
            
            notification.textContent = message;
            document.body.appendChild(notification);
            
            const style = document.createElement('style');
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
            
            setTimeout(() => {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                    if (style.parentNode) {
                        document.head.removeChild(style);
                    }
                }, 300);
            }, 3000);
        }

        // Admin System Functions
        function toggleAdminMenu() {
            document.getElementById('adminModal').classList.add('active');
        }

        function closeAdminModal() {
            document.getElementById('adminModal').classList.remove('active');
        }

        function updateSymbolWeight(symbol, weight) {
            symbolWeights[symbol] = parseInt(weight);
            
            const symbolId = {
                '🍒': 'cherry',
                '🍋': 'lemon', 
                '🍊': 'orange',
                '🔔': 'bell',
                '💎': 'diamond',
                '⭐': 'star',
                '👑': 'crown',
                '🎁': 'gift',
                '🍇': 'grape'
            }[symbol];
            
            document.getElementById(`${symbolId}-percent`).textContent = `${weight}%`;
        }

        function setPreset(mode) {
            let presets;
            
            switch(mode) {
                case 'easy':
                    presets = {
                        '🍒': 30, '🍋': 25, '🍊': 20, '🔔': 15, 
                        '💎': 12, '⭐': 8, '👑': 5, '🎁': 5, '🍇': 15
                    };
                    showNotification('Mode MUDAH aktif - peluang menang lebih tinggi!', 'success');
                    break;
                case 'normal':
                    presets = {
                        '🍒': 25, '🍋': 20, '🍊': 15, '🔔': 10, 
                        '💎': 8, '⭐': 5, '👑': 2, '🎁': 3, '🍇': 12
                    };
                    showNotification('Mode NORMAL aktif - peluang seimbang', 'success');
                    break;
                case 'hard':
                    presets = {
                        '🍒': 20, '🍋': 15, '🍊': 12, '🔔': 8, 
                        '💎': 5, '⭐': 3, '👑': 1, '🎁': 2, '🍇': 8
                    };
                    showNotification('Mode SULIT aktif - tantangan lebih besar!', 'error');
                    break;
            }
            
            for (const [symbol, weight] of Object.entries(presets)) {
                symbolWeights[symbol] = weight;
                
                const symbolId = {
                    '🍒': 'cherry', '🍋': 'lemon', '🍊': 'orange', '🔔': 'bell',
                    '💎': 'diamond', '⭐': 'star', '👑': 'crown', '🎁': 'gift', '🍇': 'grape'
                }[symbol];
                
                document.getElementById(`${symbolId}-range`).value = weight;
                document.getElementById(`${symbolId}-percent`).textContent = `${weight}%`;
            }
        }

        function resetToDefault() {
            setPreset('normal');
            showNotification('Pengaturan direset ke default', 'success');
        }

        function showSpinHistory() {
            updateHistoryDisplay();
            document.getElementById('historyModal').classList.add('active');
        }

        function closeHistoryModal() {
            document.getElementById('historyModal').classList.remove('active');
        }

        function updateHistoryDisplay() {
            const historyContent = document.getElementById('historyContent');
            const historySummary = document.getElementById('historySummary');
            
            if (spinHistory.length === 0) {
                historyContent.innerHTML = '<div class="no-history">Belum ada riwayat spin</div>';
                historySummary.innerHTML = '<div class="no-history">Belum ada data</div>';
                return;
            }
            
            const totalSpins = spinHistory.length;
            const totalWins = spinHistory.filter(spin => spin.result === 'win' || spin.result === 'jackpot').length;
            const totalJackpots = spinHistory.filter(spin => spin.result === 'jackpot').length;
            const totalFreeSpins = spinHistory.filter(spin => spin.freeSpins > 0).length;
            const winRate = ((totalWins / totalSpins) * 100).toFixed(1);
            
            historySummary.innerHTML = `
                <div class="summary-item">
                    <span class="summary-label">Total Spin</span>
                    <span class="summary-value">${totalSpins}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Total Menang</span>
                    <span class="summary-value">${totalWins}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Jackpot</span>
                    <span class="summary-value">${totalJackpots}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Free Spin</span>
                    <span class="summary-value">${totalFreeSpins}</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">Win Rate</span>
                    <span class="summary-value">${winRate}%</span>
                </div>
            `;
            
            let tableHTML = `
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Simbol</th>
                            <th>Bet</th>
                            <th>Hasil</th>
                            <th>Menang</th>
                        </tr>
                    </thead>
                    <tbody>
            `;
            
            spinHistory.forEach(spin => {
                const resultClass = `result-${spin.result}`;
                const winAmount = spin.winAmount > 0 ? `Rp ${formatRupiah(spin.winAmount)}` : '-';
                const resultText = spin.result === 'jackpot' ? 'JACKPOT!' : 
                                 spin.result === 'win' ? 'MENANG' :
                                 spin.result === 'free' ? 'FREE SPIN' : 'KALAH';
                
                tableHTML += `
                    <tr>
                        <td>${spin.timestamp}</td>
                        <td>${spin.symbols}</td>
                        <td>${spin.isFreeSpin ? 'FREE' : spin.bet}</td>
                        <td class="${resultClass}">${resultText}</td>
                        <td class="${resultClass}">${winAmount}</td>
                    </tr>
                `;
            });
            
            tableHTML += '</tbody></table>';
            historyContent.innerHTML = tableHTML;
        }

        function clearSpinHistory() {
            if (spinHistory.length === 0) {
                showNotification('Riwayat sudah kosong!', 'error');
                return;
            }
            
            spinHistory = [];
            gameStats = {
                totalSpins: 0,
                totalWins: 0,
                jackpotHits: 0
            };
            
            updateHistoryDisplay();
            showNotification('Riwayat spin berhasil dihapus!', 'success');
        }



        document.getElementById('depositAmount').addEventListener('input', function(e) {
            let value = e.target.value.replace(/[^\d]/g, '');
            if (value) {
                e.target.value = formatRupiah(parseInt(value));
            }
        });

        document.getElementById('depositAmount').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                confirmDeposit();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeDepositModal();
                closeAdminModal();
                closeHistoryModal();
            }
        });

        updateCredits();
        updateSpinButtonForFreeSpin();
        
        setTimeout(() => {
            showNotification('Selamat datang di Slot Casino!', 'success');
        }, 500);