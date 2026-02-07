import React, { useState, useEffect } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './DerivAnalysisPage.scss';

export const DerivAnalysisPage: React.FC = () => {
    const store = useStore();
    const isLoggedIn = store?.client?.is_logged_in || false;
    const balanceValue = store?.client?.balance || 0;
    const balance = typeof balanceValue === 'string' ? parseFloat(balanceValue) : balanceValue;

    const [market, setMarket] = useState('R_100');
    const [stake, setStake] = useState(10);
    const [selectedDigit, setSelectedDigit] = useState<number | null>(null);
    const [tradeType, setTradeType] = useState<'over' | 'under'>('over');
    const [payout, setPayout] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [lastDigit, setLastDigit] = useState(0);

    // Subscribe to live ticks
    useEffect(() => {
        let subscriptionId: string | null = null;

        const subscribe = async () => {
            try {
                subscriptionId = await derivAPIService.subscribeToTicks(market, response => {
                    if (response.tick) {
                        setCurrentPrice(response.tick.quote);
                        const digit = Math.floor(response.tick.quote * 100) % 10;
                        setLastDigit(digit);
                    }
                });
            } catch (error) {
                console.error('Failed to subscribe:', error);
            }
        };

        if (api_base.api) {
            subscribe();
        }

        return () => {
            if (subscriptionId) {
                derivAPIService.unsubscribe(subscriptionId);
            }
        };
    }, [market]);

    // Calculate payout when stake or digit changes
    useEffect(() => {
        if (selectedDigit !== null) {
            // Over/Under payout calculation (simplified)
            const multiplier = tradeType === 'over' ? 1.9 : 1.9;
            setPayout(stake * multiplier);
        }
    }, [stake, selectedDigit, tradeType]);

    const handleTrade = async () => {
        if (!isLoggedIn) {
            alert('Please log in to place trades');
            return;
        }

        if (selectedDigit === null) {
            alert('Please select a digit prediction');
            return;
        }

        setIsLoading(true);

        try {
            // Get proposal first
            const contractType = tradeType === 'over' ? 'DIGITOVER' : 'DIGITUNDER';

            // Note: You'll need to implement the full proposal and buy flow
            // This is a simplified example
            alert(`Trade placed: ${contractType} ${selectedDigit} on ${market} with stake ${stake}`);
        } catch (error) {
            console.error('Trade failed:', error);
            alert('Trade failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className='deriv-analysis-page'>
            <div className='deriv-analysis-header'>
                <h1>📊 Deriv Analysis - Over/Under Trading</h1>
                <p>Trade directly on your site - All commissions go to you!</p>
                {isLoggedIn && <div className='balance-display'>Balance: ${balance.toFixed(2)}</div>}
            </div>

            <div className='trading-interface'>
                {/* Left Panel - Chart */}
                <div className='chart-panel'>
                    <h3>Live Chart - {market}</h3>
                    <div className='chart-container'>
                        <iframe
                            src={`https://charts.deriv.com/?symbol=${market}&interval=1t&theme=dark`}
                            title={`${market} Chart`}
                            className='deriv-chart-iframe'
                            allow='fullscreen'
                        />
                    </div>
                    <div className='current-price-display'>
                        <div className='price-label'>Current Price</div>
                        <div className='price-value'>{currentPrice > 0 ? currentPrice.toFixed(2) : '---'}</div>
                        <div className='last-digit-display'>
                            Last Digit: <span className='digit-value'>{lastDigit}</span>
                        </div>
                    </div>
                </div>

                {/* Right Panel - Trading Controls */}
                <div className='trading-panel'>
                    <h3>Over/Under Trading</h3>

                    {!isLoggedIn && <div className='login-warning'>⚠️ Please log in to start trading</div>}

                    {/* Market Selection */}
                    <div className='control-group'>
                        <label>Market</label>
                        <select value={market} onChange={e => setMarket(e.target.value)}>
                            <option value='R_10'>Volatility 10 Index</option>
                            <option value='R_25'>Volatility 25 Index</option>
                            <option value='R_50'>Volatility 50 Index</option>
                            <option value='R_75'>Volatility 75 Index</option>
                            <option value='R_100'>Volatility 100 Index</option>
                        </select>
                    </div>

                    {/* Stake Input */}
                    <div className='control-group'>
                        <label>Stake (USD)</label>
                        <input
                            type='number'
                            value={stake}
                            onChange={e => setStake(Number(e.target.value))}
                            min='1'
                            max='10000'
                        />
                    </div>

                    {/* Trade Type Selection */}
                    <div className='control-group'>
                        <label>Trade Type</label>
                        <div className='trade-type-buttons'>
                            <button
                                className={`trade-type-btn ${tradeType === 'over' ? 'active over' : ''}`}
                                onClick={() => setTradeType('over')}
                            >
                                Over
                            </button>
                            <button
                                className={`trade-type-btn ${tradeType === 'under' ? 'active under' : ''}`}
                                onClick={() => setTradeType('under')}
                            >
                                Under
                            </button>
                        </div>
                    </div>

                    {/* Digit Selection */}
                    <div className='control-group'>
                        <label>Last Digit Prediction</label>
                        <div className='digit-grid'>
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(digit => (
                                <button
                                    key={digit}
                                    className={`digit-btn ${selectedDigit === digit ? 'selected' : ''}`}
                                    onClick={() => setSelectedDigit(digit)}
                                >
                                    {digit}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Payout Display */}
                    {selectedDigit !== null && (
                        <div className='payout-display'>
                            <div className='payout-label'>Potential Payout</div>
                            <div className='payout-value'>${payout.toFixed(2)}</div>
                            <div className='payout-profit'>
                                Profit: ${(payout - stake).toFixed(2)} ({(((payout - stake) / stake) * 100).toFixed(1)}
                                %)
                            </div>
                        </div>
                    )}

                    {/* Trade Button */}
                    <button
                        className='trade-button'
                        onClick={handleTrade}
                        disabled={!isLoggedIn || selectedDigit === null || isLoading}
                    >
                        {isLoading ? 'Placing Trade...' : `Buy ${tradeType.toUpperCase()} ${selectedDigit ?? ''}`}
                    </button>

                    {/* Info */}
                    <div className='trading-info'>
                        <p>
                            💡 <strong>How it works:</strong> Predict if the last digit will be {tradeType}{' '}
                            {selectedDigit ?? 'X'}
                        </p>
                        <p>
                            ✅ <strong>Your Commission:</strong> All trades earn you affiliate commission!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
