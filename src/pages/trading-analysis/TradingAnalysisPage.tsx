import React, { useState, useEffect, useRef } from 'react';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import { unifiedTickData } from '@/services/unified-tick-data.service';
import { derivAPIInitializer } from '@/services/deriv-api-initializer.service';
import {
    LabelPairedCircleCheckMdFillIcon,
    LabelPairedCircleExclamationMdFillIcon,
    LabelPairedCircleInfoMdFillIcon,
    LabelPairedChartLineMdRegularIcon,
    LabelPairedLocationCrosshairsMdRegularIcon,
    LabelPairedBellMdRegularIcon,
    LabelPairedChartMixedMdRegularIcon,
    LabelPairedCircleDollarMdRegularIcon,
    LabelPairedStarMdFillIcon,
    LabelPairedLightbulbMdRegularIcon,
    LabelPairedGearMdRegularIcon,
    LabelPairedCircleStarMdFillIcon,
    LabelPairedHandsHoldingDiamondMdFillIcon,
} from '@deriv/quill-icons/LabelPaired';
import './TradingAnalysisPage.scss';

interface TickData {
    value: number;
    timestamp: number;
    price: number;
}

interface Trade {
    id: string;
    type: string;
    stake: number;
    prediction: string;
    entryPrice: number;
    exitPrice?: number;
    result?: 'win' | 'loss' | 'pending';
    profit?: number;
    timestamp: number;
}

interface Pattern {
    type: string;
    confidence: number;
    description: string;
}

interface Alert {
    id: string;
    message: string;
    type: 'success' | 'warning' | 'info';
    timestamp: number;
}

// Map display names to Deriv API symbols
const MARKET_SYMBOLS: { [key: string]: string } = {
    'Volatility 10 Index': 'R_10',
    'Volatility 10 (1s) Index': '1HZ10V',
    'Volatility 25 Index': 'R_25',
    'Volatility 25 (1s) Index': '1HZ25V',
    'Volatility 50 Index': 'R_50',
    'Volatility 50 (1s) Index': '1HZ50V',
    'Volatility 75 Index': 'R_75',
    'Volatility 75 (1s) Index': '1HZ75V',
    'Volatility 100 Index': 'R_100',
    'Volatility 100 (1s) Index': '1HZ100V',
    'Volatility 150 (1s) Index': '1HZ150V',
    'Volatility 250 (1s) Index': '1HZ250V',
};

export const TradingAnalysisPage: React.FC = () => {
    const store = useStore();
    const isLoggedIn = store?.client?.is_logged_in || false;
    const currency = store?.client?.currency || 'USD';
    const balance = store?.client?.balance || 0;

    const [market, setMarket] = useState('Volatility 10 Index');
    const [tickType, setTickType] = useState('Even/Odd');
    const [numberOfTicks, setNumberOfTicks] = useState(1000);
    const [barrier, setBarrier] = useState(5); // For Over/Under
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [stat1Count, setStat1Count] = useState(0);
    const [stat2Count, setStat2Count] = useState(0);
    const [isApiReady, setIsApiReady] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [activeTab, setActiveTab] = useState<'analysis' | 'paytable' | 'tradingview' | 'dftapps' | 'smartbadge'>(
        'analysis'
    );
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const tickHistoryRef = useRef<TickData[]>([]);

    // New state for enhanced features
    const [trades, setTrades] = useState<Trade[]>([]);
    const [stake, setStake] = useState(10);
    const [selectedPrediction, setSelectedPrediction] = useState<string>('');
    const [patterns, setPatterns] = useState<Pattern[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [comparisonMarkets, setComparisonMarkets] = useState<string[]>([]);
    const [showTradePanel, setShowTradePanel] = useState(false);
    const [totalProfit, setTotalProfit] = useState(0);
    const [winRate, setWinRate] = useState(0);
    const [totalTrades, setTotalTrades] = useState(0);

    // Check if API is ready with better error handling
    useEffect(() => {
        let checkCount = 0;
        const maxChecks = 20; // Try for 10 seconds

        const checkApiReady = () => {
            checkCount++;

            if (api_base.api && typeof api_base.api.send === 'function') {
                console.log('✅ Deriv API is ready');
                console.log('👤 Login status:', isLoggedIn ? 'Logged in' : 'Not logged in');
                setIsApiReady(true);
                setErrorMessage('');
            } else if (checkCount < maxChecks) {
                console.log(`⏳ Waiting for Deriv API... (${checkCount}/${maxChecks})`);
                setTimeout(checkApiReady, 500);
            } else {
                console.error('❌ Deriv API failed to initialize after', maxChecks, 'attempts');
                setErrorMessage('Failed to connect to Deriv API. Please refresh the page.');
                setIsApiReady(false);
            }
        };

        checkApiReady();
    }, [isLoggedIn]);

    // Extract last digit from price
    const extractLastDigit = (price: number): number => {
        const priceStr = price.toString();
        const lastChar = priceStr.charAt(priceStr.length - 1);
        return parseInt(lastChar, 10);
    };

    // Subscribe to market data using unified tick data service
    useEffect(() => {
        if (!isApiReady) {
            console.log('⏸️ API not ready yet, waiting...');
            return;
        }

        const symbol = MARKET_SYMBOLS[market];
        console.log('📊 Initializing unified tick stream for:', symbol, '(', market, ')');

        const initializeStream = async () => {
            try {
                // Clean up previous subscription
                if (unsubscribeRef.current) {
                    console.log('🔌 Cleaning up previous subscription');
                    unsubscribeRef.current();
                    unsubscribeRef.current = null;
                }

                // Reset state
                tickHistoryRef.current = [];
                setTicks([]);
                setCurrentPrice(0);
                setIsSubscribed(false);
                setErrorMessage('');

                console.log('⏳ Ensuring Deriv API is ready...');
                await derivAPIInitializer.waitForReady(20000);
                console.log('✅ Deriv API confirmed ready');

                // Initialize unified tick stream with historical data
                const unsubscribe = await unifiedTickData.initializeTickStream(
                    symbol,
                    Math.min(numberOfTicks, 1000), // Load historical ticks
                    tickData => {
                        // Handle live tick updates
                        const price = tickData.quote;
                        const lastDigit = extractLastDigit(price);

                        const newTick: TickData = {
                            value: lastDigit,
                            timestamp: tickData.epoch * 1000,
                            price,
                        };

                        // Update tick history
                        tickHistoryRef.current = [...tickHistoryRef.current, newTick].slice(-numberOfTicks);
                        setTicks(tickHistoryRef.current.slice(-20));
                        setCurrentPrice(price);
                        calculateStatistics(tickHistoryRef.current);
                    }
                );

                // Store unsubscribe function
                unsubscribeRef.current = unsubscribe;
                setIsSubscribed(true);
                setErrorMessage('');
                console.log('✅ Successfully subscribed to unified tick stream');

                // Load historical data into state
                const historicalTicks = unifiedTickData.getHistoricalTicks(symbol);
                if (historicalTicks && historicalTicks.length > 0) {
                    const formattedTicks: TickData[] = historicalTicks.map(tick => ({
                        value: extractLastDigit(tick.quote),
                        timestamp: tick.epoch * 1000,
                        price: tick.quote,
                    }));

                    tickHistoryRef.current = formattedTicks;
                    setTicks(formattedTicks.slice(-20));

                    const latestPrice = historicalTicks[historicalTicks.length - 1].quote;
                    setCurrentPrice(latestPrice);
                    console.log('💰 Loaded', historicalTicks.length, 'historical ticks. Current price:', latestPrice);

                    calculateStatistics(formattedTicks);
                }
            } catch (error) {
                console.error('❌ Failed to initialize tick stream:', error);
                setIsSubscribed(false);
                setErrorMessage(
                    isLoggedIn
                        ? 'Failed to connect to market data. Please try refreshing the page.'
                        : 'Please log in to Deriv to access live market data.'
                );
            }
        };

        initializeStream();

        return () => {
            if (unsubscribeRef.current) {
                console.log('🔌 Cleaning up subscription on unmount');
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            setIsSubscribed(false);
        };
    }, [isApiReady, market, numberOfTicks, isLoggedIn]);

    // Get labels based on tick type
    const getLabels = () => {
        switch (tickType) {
            case 'Even/Odd':
                return { label1: 'Even', label2: 'Odd', pattern: 'Even/Odd Pattern' };
            case 'Rise/Fall':
                return { label1: 'Rise', label2: 'Fall', pattern: 'Rise/Fall Pattern' };
            case 'Over/Under':
                return {
                    label1: `Over ${barrier}`,
                    label2: `Under ${barrier}`,
                    pattern: `Over/Under ${barrier} Pattern`,
                };
            case 'Matches/Differs':
                return { label1: 'Matches', label2: 'Differs', pattern: 'Matches/Differs Pattern' };
            default:
                return { label1: 'Even', label2: 'Odd', pattern: 'Even/Odd Pattern' };
        }
    };

    const labels = getLabels();

    // Update ticks display when tickHistory changes
    useEffect(() => {
        if (tickHistoryRef.current.length > 0) {
            calculateStatistics(tickHistoryRef.current);
        }
    }, [tickType, barrier]);

    // Calculate statistics based on tick type
    const calculateStatistics = (tickData: any[]) => {
        let count1 = 0;
        let count2 = 0;

        switch (tickType) {
            case 'Even/Odd':
                tickData.forEach(tick => {
                    const digit = tick.lastDigit !== undefined ? tick.lastDigit : tick.value;
                    if (digit % 2 === 0) count1++;
                    else count2++;
                });
                break;
            case 'Rise/Fall':
                for (let i = 1; i < tickData.length; i++) {
                    const digit1 = tickData[i].lastDigit !== undefined ? tickData[i].lastDigit : tickData[i].value;
                    const digit2 =
                        tickData[i - 1].lastDigit !== undefined ? tickData[i - 1].lastDigit : tickData[i - 1].value;
                    if (digit1 > digit2) count1++;
                    else count2++;
                }
                break;
            case 'Over/Under':
                tickData.forEach(tick => {
                    const digit = tick.lastDigit !== undefined ? tick.lastDigit : tick.value;
                    if (digit > barrier)
                        count1++; // Over barrier
                    else if (digit < barrier) count2++; // Under barrier
                });
                break;
            case 'Matches/Differs':
                const targetDigit = 5;
                tickData.forEach(tick => {
                    const digit = tick.lastDigit !== undefined ? tick.lastDigit : tick.value;
                    if (digit === targetDigit) count1++;
                    else count2++;
                });
                break;
        }

        const total = count1 + count2;
        if (total > 0) {
            setStat1Count(Math.round((count1 / total) * 100));
            setStat2Count(Math.round((count2 / total) * 100));
        }
    };

    // Pattern Recognition - Detect repeating patterns
    const detectPatterns = (tickData: TickData[]) => {
        const detectedPatterns: Pattern[] = [];
        const recentTicks = tickData.slice(-20);

        // Detect streaks
        let currentStreak = 1;
        for (let i = 1; i < recentTicks.length; i++) {
            const current = getTickDisplay(recentTicks[i], i);
            const previous = getTickDisplay(recentTicks[i - 1], i - 1);
            if (current === previous) {
                currentStreak++;
            } else {
                if (currentStreak >= 5) {
                    detectedPatterns.push({
                        type: 'Streak',
                        confidence: Math.min(currentStreak * 10, 95),
                        description: `${currentStreak} consecutive ${previous} detected`,
                    });
                }
                currentStreak = 1;
            }
        }

        // Detect alternating pattern
        let alternating = true;
        for (let i = 2; i < Math.min(recentTicks.length, 10); i++) {
            const curr = getTickDisplay(recentTicks[i], i);
            const prev = getTickDisplay(recentTicks[i - 1], i - 1);
            const prevPrev = getTickDisplay(recentTicks[i - 2], i - 2);
            if (curr === prevPrev) {
                alternating = false;
                break;
            }
        }
        if (alternating && recentTicks.length >= 6) {
            detectedPatterns.push({
                type: 'Alternating',
                confidence: 75,
                description: 'Alternating pattern detected in last 6+ ticks',
            });
        }

        setPatterns(detectedPatterns);
        return detectedPatterns;
    };

    // AI Strategy Recommendations
    const getStrategyRecommendation = () => {
        const diff = Math.abs(stat1Count - stat2Count);
        const { label1, label2 } = getLabels();

        if (diff > 20) {
            return {
                recommendation: `Strong bias towards ${stat1Count > stat2Count ? label1 : label2}`,
                confidence: 'High',
                action: `Consider trading ${stat1Count > stat2Count ? label1 : label2}`,
                color: '#10b981',
            };
        } else if (diff > 10) {
            return {
                recommendation: `Moderate bias towards ${stat1Count > stat2Count ? label1 : label2}`,
                confidence: 'Medium',
                action: `Cautiously trade ${stat1Count > stat2Count ? label1 : label2}`,
                color: '#f59e0b',
            };
        } else {
            return {
                recommendation: 'Balanced distribution',
                confidence: 'Low',
                action: 'Wait for clearer pattern or use other indicators',
                color: '#94a3b8',
            };
        }
    };

    // Add Alert
    const addAlert = (message: string, type: 'success' | 'warning' | 'info') => {
        const newAlert: Alert = {
            id: Date.now().toString(),
            message,
            type,
            timestamp: Date.now(),
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 5)); // Keep last 5 alerts

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setAlerts(prev => prev.filter(a => a.id !== newAlert.id));
        }, 5000);
    };

    // Monitor for pattern alerts
    useEffect(() => {
        if (ticks.length >= 10) {
            const detectedPatterns = detectPatterns(tickHistoryRef.current);
            if (detectedPatterns.length > 0) {
                detectedPatterns.forEach(pattern => {
                    if (pattern.confidence >= 75) {
                        addAlert(`${pattern.description}`, 'info');
                    }
                });
            }

            // Alert on extreme bias
            const diff = Math.abs(stat1Count - stat2Count);
            if (diff > 25) {
                const { label1, label2 } = getLabels();
                addAlert(
                    `⚠️ Extreme bias: ${stat1Count > stat2Count ? label1 : label2} at ${Math.max(stat1Count, stat2Count)}%`,
                    'warning'
                );
            }
        }
    }, [stat1Count, stat2Count]);

    // Place Trade Function
    const placeTrade = async () => {
        if (!isLoggedIn) {
            addAlert('Please log in to place trades', 'warning');
            return;
        }

        if (!selectedPrediction) {
            addAlert('Please select a prediction', 'warning');
            return;
        }

        const newTrade: Trade = {
            id: Date.now().toString(),
            type: tickType,
            stake,
            prediction: selectedPrediction,
            entryPrice: currentPrice,
            result: 'pending',
            timestamp: Date.now(),
        };

        setTrades(prev => [newTrade, ...prev]);
        setTotalTrades(prev => prev + 1);
        addAlert(`Trade placed: ${selectedPrediction} with stake ${stake} ${currency}`, 'success');
        setShowTradePanel(false);
        setSelectedPrediction('');

        // Simulate trade result after 10 seconds (in real app, this would be from Deriv API)
        setTimeout(() => {
            const isWin = Math.random() > 0.5; // Simplified - real logic would check actual outcome
            const profit = isWin ? stake * 0.95 : -stake;

            setTrades(prev =>
                prev.map(t =>
                    t.id === newTrade.id
                        ? {
                              ...t,
                              result: isWin ? 'win' : 'loss',
                              exitPrice: currentPrice,
                              profit,
                          }
                        : t
                )
            );

            setTotalProfit(prev => prev + profit);
            const wins = trades.filter(t => t.result === 'win').length + (isWin ? 1 : 0);
            setWinRate(Math.round((wins / (totalTrades + 1)) * 100));

            addAlert(
                isWin
                    ? `Trade won! Profit: +${profit.toFixed(2)} ${currency}`
                    : `Trade lost: ${profit.toFixed(2)} ${currency}`,
                isWin ? 'success' : 'warning'
            );
        }, 10000);
    };

    const getTickDisplay = (tick: TickData, index: number) => {
        switch (tickType) {
            case 'Even/Odd':
                return tick.value % 2 === 0 ? 'E' : 'O';
            case 'Rise/Fall':
                if (index === 0) return '-';
                return tick.value > ticks[index - 1].value ? '↑' : '↓';
            case 'Over/Under':
                if (tick.value > barrier) return 'O';
                if (tick.value < barrier) return 'U';
                return '='; // Equal to barrier
            case 'Matches/Differs':
                return tick.value === 5 ? 'M' : 'D';
            default:
                return tick.value.toString();
        }
    };

    const getTickColorByType = (tick: TickData, index: number) => {
        switch (tickType) {
            case 'Even/Odd':
                return tick.value % 2 === 0 ? '#10b981' : '#ef4444';
            case 'Rise/Fall':
                if (index === 0) return '#94a3b8';
                return tick.value > ticks[index - 1].value ? '#10b981' : '#ef4444';
            case 'Over/Under':
                if (tick.value > barrier) return '#10b981'; // Over - green
                if (tick.value < barrier) return '#ef4444'; // Under - red
                return '#94a3b8'; // Equal to barrier - gray
            case 'Matches/Differs':
                return tick.value === 5 ? '#10b981' : '#ef4444';
            default:
                return '#4A90E2';
        }
    };

    return (
        <div className='trading-analysis-page'>
            {/* Header Tabs */}
            <div className='analysis-tabs'>
                <button
                    className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    Analysis Tools
                </button>
                <button
                    className={`tab-btn ${activeTab === 'paytable' ? 'active' : ''}`}
                    onClick={() => setActiveTab('paytable')}
                >
                    Pay Table
                </button>
                <button
                    className={`tab-btn ${activeTab === 'tradingview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tradingview')}
                >
                    Trading View
                </button>
                <button
                    className={`tab-btn ${activeTab === 'dftapps' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dftapps')}
                >
                    DFT Apps
                </button>
                <button
                    className={`tab-btn ${activeTab === 'smartbadge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('smartbadge')}
                >
                    Smart Badge
                </button>
            </div>

            {/* Main Content - Single Column Layout */}
            <div className='analysis-content-wrapper'>
                {/* Analysis Tools Tab */}
                {activeTab === 'analysis' && (
                    <>
                        {/* Configuration Section - Horizontal */}
                        <div className='config-section-horizontal'>
                            <div className='config-field'>
                                <label>Underlying Market</label>
                                <select value={market} onChange={e => setMarket(e.target.value)}>
                                    <option>Volatility 10 Index</option>
                                    <option>Volatility 10 (1s) Index</option>
                                    <option>Volatility 25 Index</option>
                                    <option>Volatility 25 (1s) Index</option>
                                    <option>Volatility 50 Index</option>
                                    <option>Volatility 50 (1s) Index</option>
                                    <option>Volatility 75 Index</option>
                                    <option>Volatility 75 (1s) Index</option>
                                    <option>Volatility 100 Index</option>
                                    <option>Volatility 100 (1s) Index</option>
                                    <option>Volatility 150 (1s) Index</option>
                                    <option>Volatility 250 (1s) Index</option>
                                </select>
                            </div>
                            <div className='config-field'>
                                <label>Tick Type</label>
                                <select value={tickType} onChange={e => setTickType(e.target.value)}>
                                    <option>Even/Odd</option>
                                    <option>Rise/Fall</option>
                                    <option>Over/Under</option>
                                    <option>Matches/Differs</option>
                                </select>
                            </div>
                            {tickType === 'Over/Under' && (
                                <div className='config-field'>
                                    <label>Barrier (Last Digit)</label>
                                    <select value={barrier} onChange={e => setBarrier(Number(e.target.value))}>
                                        <option value={0}>0</option>
                                        <option value={1}>1</option>
                                        <option value={2}>2</option>
                                        <option value={3}>3</option>
                                        <option value={4}>4</option>
                                        <option value={5}>5</option>
                                        <option value={6}>6</option>
                                        <option value={7}>7</option>
                                        <option value={8}>8</option>
                                        <option value={9}>9</option>
                                    </select>
                                </div>
                            )}
                            <div className='config-field'>
                                <label>Number of Ticks to Analyze</label>
                                <input
                                    type='number'
                                    value={numberOfTicks}
                                    onChange={e => setNumberOfTicks(Number(e.target.value))}
                                    min='10'
                                    max='10000'
                                />
                            </div>
                        </div>

                        {/* Current Price Display */}
                        <div className='price-display'>
                            <div className='connection-status'>
                                <span
                                    className={`status-indicator ${isApiReady && isSubscribed ? 'connected' : 'disconnected'}`}
                                ></span>
                                <span className='status-text'>
                                    {!isApiReady
                                        ? 'Initializing API...'
                                        : isSubscribed
                                          ? 'Live Data'
                                          : errorMessage || 'Connecting...'}
                                </span>
                            </div>
                            <div className='market-name'>{market}</div>
                            <div className='price-label'>CURRENT PRICE</div>
                            <div className='price-value'>{currentPrice > 0 ? currentPrice.toFixed(2) : '---'}</div>
                            {!isLoggedIn && (
                                <div className='login-notice'>
                                    💡 Tip: Log in to Deriv for full access to all markets and features
                                </div>
                            )}
                            <div className='price-stats'>
                                <div className='stat'>
                                    <span className='stat-label'>{labels.label1}</span>
                                    <span className='stat-value'>{stat1Count}</span>
                                </div>
                                <div className='stat'>
                                    <span className='stat-label'>{labels.label2}</span>
                                    <span className='stat-value'>{stat2Count}</span>
                                </div>
                            </div>
                        </div>

                        {/* Recent Ticks Pattern - HORIZONTAL */}
                        <div className='recent-ticks-section'>
                            <h3>Recent {labels.pattern}</h3>
                            <div className='ticks-display-horizontal'>
                                {ticks.map((tick, index) => (
                                    <div
                                        key={index}
                                        className='tick-circle'
                                        style={{ backgroundColor: getTickColorByType(tick, index) }}
                                        title={`Tick ${index + 1}: ${tick.value}`}
                                    >
                                        {getTickDisplay(tick, index)}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Alerts Display */}
                        {alerts.length > 0 && (
                            <div className='alerts-section'>
                                {alerts.map(alert => (
                                    <div key={alert.id} className={`alert alert-${alert.type}`}>
                                        {alert.type === 'success' && (
                                            <LabelPairedCircleCheckMdFillIcon className='alert-icon' />
                                        )}
                                        {alert.type === 'warning' && (
                                            <LabelPairedCircleExclamationMdFillIcon className='alert-icon' />
                                        )}
                                        {alert.type === 'info' && (
                                            <LabelPairedCircleInfoMdFillIcon className='alert-icon' />
                                        )}
                                        <span>{alert.message}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Statistics Dashboard */}
                        <div className='statistics-dashboard'>
                            <div className='stat-card'>
                                <div className='stat-label'>Balance</div>
                                <div className='stat-value'>
                                    {Number(balance || 0).toFixed(2)} {currency}
                                </div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Total Profit</div>
                                <div className={`stat-value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>
                                    {totalProfit >= 0 ? '+' : ''}
                                    {totalProfit.toFixed(2)} {currency}
                                </div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Win Rate</div>
                                <div className='stat-value'>{winRate}%</div>
                            </div>
                            <div className='stat-card'>
                                <div className='stat-label'>Total Trades</div>
                                <div className='stat-value'>{totalTrades}</div>
                            </div>
                        </div>

                        {/* AI Strategy Recommendations */}
                        {ticks.length >= 10 && (
                            <div className='strategy-section'>
                                <h3>AI Strategy Recommendation</h3>
                                <div
                                    className='strategy-card'
                                    style={{ borderLeftColor: getStrategyRecommendation().color }}
                                >
                                    <div className='strategy-header'>
                                        <span className='strategy-confidence'>
                                            {getStrategyRecommendation().confidence} Confidence
                                        </span>
                                    </div>
                                    <div className='strategy-recommendation'>
                                        {getStrategyRecommendation().recommendation}
                                    </div>
                                    <div className='strategy-action'>
                                        <LabelPairedLightbulbMdRegularIcon className='strategy-icon' />
                                        {getStrategyRecommendation().action}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pattern Recognition */}
                        {patterns.length > 0 && (
                            <div className='patterns-section'>
                                <h3>Detected Patterns</h3>
                                <div className='patterns-grid'>
                                    {patterns.map((pattern, index) => (
                                        <div key={index} className='pattern-card'>
                                            <div className='pattern-type'>{pattern.type}</div>
                                            <div className='pattern-confidence'>{pattern.confidence}% confidence</div>
                                            <div className='pattern-description'>{pattern.description}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Trade Execution Panel */}
                        <div className='trade-execution-section'>
                            <button className='toggle-trade-btn' onClick={() => setShowTradePanel(!showTradePanel)}>
                                {showTradePanel ? 'Hide' : 'Show'} Trade Panel
                            </button>

                            {showTradePanel && (
                                <div className='trade-panel'>
                                    <h3>Place Trade</h3>
                                    <div className='trade-controls'>
                                        <div className='trade-field'>
                                            <label>Stake Amount ({currency})</label>
                                            <input
                                                type='number'
                                                value={stake}
                                                onChange={e => setStake(Number(e.target.value))}
                                                min='1'
                                                max={balance}
                                            />
                                        </div>
                                        <div className='trade-field'>
                                            <label>Prediction</label>
                                            <div className='prediction-buttons'>
                                                <button
                                                    className={`prediction-btn ${selectedPrediction === labels.label1 ? 'active' : ''}`}
                                                    onClick={() => setSelectedPrediction(labels.label1)}
                                                >
                                                    {labels.label1}
                                                </button>
                                                <button
                                                    className={`prediction-btn ${selectedPrediction === labels.label2 ? 'active' : ''}`}
                                                    onClick={() => setSelectedPrediction(labels.label2)}
                                                >
                                                    {labels.label2}
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            className='place-trade-btn'
                                            onClick={placeTrade}
                                            disabled={!isLoggedIn || !selectedPrediction}
                                        >
                                            Place Trade
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Trade History */}
                        {trades.length > 0 && (
                            <div className='trade-history-section'>
                                <h3>Trade History</h3>
                                <div className='trade-history-table'>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Time</th>
                                                <th>Type</th>
                                                <th>Prediction</th>
                                                <th>Stake</th>
                                                <th>Entry</th>
                                                <th>Exit</th>
                                                <th>Result</th>
                                                <th>Profit/Loss</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {trades.slice(0, 10).map(trade => (
                                                <tr key={trade.id}>
                                                    <td>{new Date(trade.timestamp).toLocaleTimeString()}</td>
                                                    <td>{trade.type}</td>
                                                    <td>{trade.prediction}</td>
                                                    <td>
                                                        {trade.stake} {currency}
                                                    </td>
                                                    <td>{trade.entryPrice.toFixed(2)}</td>
                                                    <td>{trade.exitPrice ? trade.exitPrice.toFixed(2) : '-'}</td>
                                                    <td>
                                                        <span className={`result-badge ${trade.result}`}>
                                                            {trade.result === 'pending' ? (
                                                                <LabelPairedCircleInfoMdFillIcon />
                                                            ) : trade.result === 'win' ? (
                                                                <LabelPairedCircleCheckMdFillIcon />
                                                            ) : (
                                                                <LabelPairedCircleExclamationMdFillIcon />
                                                            )}
                                                        </span>
                                                    </td>
                                                    <td
                                                        className={
                                                            trade.profit && trade.profit >= 0 ? 'positive' : 'negative'
                                                        }
                                                    >
                                                        {trade.profit
                                                            ? `${trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}`
                                                            : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Probability Analysis */}
                        <div className='probability-section'>
                            <h3>Probability Analysis</h3>
                            <div className='probability-bars'>
                                <div className='prob-bar even'>
                                    <div className='bar-label'>{labels.label1}</div>
                                    <div className='bar-container'>
                                        <div className='bar-fill' style={{ width: `${stat1Count}%` }}>
                                            {stat1Count}%
                                        </div>
                                    </div>
                                </div>
                                <div className='prob-bar odd'>
                                    <div className='bar-label'>{labels.label2}</div>
                                    <div className='bar-container'>
                                        <div className='bar-fill' style={{ width: `${stat2Count}%` }}>
                                            {stat2Count}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section - Horizontal Layout */}
                        <div className='bottom-section'>
                            {/* Trading Probability Guide */}
                            <div className='probability-guide'>
                                <h3>Trading Probability Guide</h3>
                                <div className='guide-table'>
                                    <h4>Over Probabilities</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Over 0</th>
                                                <th>Over 1</th>
                                                <th>Over 2</th>
                                                <th>Over 3</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>90%</td>
                                                <td>80%</td>
                                                <td>70%</td>
                                                <td>60%</td>
                                            </tr>
                                            <tr>
                                                <td>Over 4</td>
                                                <td>Over 5</td>
                                                <td>Over 6</td>
                                                <td>Over 7</td>
                                            </tr>
                                            <tr>
                                                <td>50%</td>
                                                <td>40%</td>
                                                <td>30%</td>
                                                <td>20%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <div className='guide-table'>
                                    <h4>Under Probabilities</h4>
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Under 9</th>
                                                <th>Under 8</th>
                                                <th>Under 7</th>
                                                <th>Under 6</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>90%</td>
                                                <td>80%</td>
                                                <td>70%</td>
                                                <td>60%</td>
                                            </tr>
                                            <tr>
                                                <td>Under 5</td>
                                                <td>Under 4</td>
                                                <td>Under 3</td>
                                                <td>Under 2</td>
                                            </tr>
                                            <tr>
                                                <td>50%</td>
                                                <td>40%</td>
                                                <td>30%</td>
                                                <td>20%</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Win/Loss Stats */}
                            <div className='win-loss-section'>
                                <h3>Win/Loss Streak Stats</h3>
                                <table className='stats-table'>
                                    <thead>
                                        <tr>
                                            <th>Statistic</th>
                                            <th>{tickType}</th>
                                            <th>Overall</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Winning Streak</td>
                                            <td className='positive'>Above {stat1Count > 70 ? '85' : '80'}%</td>
                                            <td className='positive'>Above 85%</td>
                                        </tr>
                                        <tr>
                                            <td>Maximum Streak</td>
                                            <td>Up to {Math.floor(stat1Count / 5)}</td>
                                            <td>Up to 12</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Trading View Tab */}
                {activeTab === 'tradingview' && (
                    <div className='chart-section'>
                        <h3>Live Market Chart - {market}</h3>
                        <div className='chart-container'>
                            <iframe
                                src={`https://charts.deriv.com/?symbol=${MARKET_SYMBOLS[market]}&interval=1t&theme=dark`}
                                title={`${market} Chart`}
                                className='deriv-chart-iframe'
                                allow='fullscreen'
                            />
                        </div>
                    </div>
                )}

                {/* Pay Table Tab */}
                {activeTab === 'paytable' && (
                    <div className='paytable-section'>
                        <h3>Payout Information</h3>
                        <div className='payout-grid'>
                            <div className='payout-card'>
                                <h4>Even/Odd</h4>
                                <div className='payout-info'>
                                    <div className='payout-row'>
                                        <span>Payout:</span>
                                        <span className='payout-value'>1.95x</span>
                                    </div>
                                    <div className='payout-row'>
                                        <span>Win Probability:</span>
                                        <span>50%</span>
                                    </div>
                                    <div className='payout-description'>
                                        Predict if the last digit will be even (0,2,4,6,8) or odd (1,3,5,7,9)
                                    </div>
                                </div>
                            </div>
                            <div className='payout-card'>
                                <h4>Rise/Fall</h4>
                                <div className='payout-info'>
                                    <div className='payout-row'>
                                        <span>Payout:</span>
                                        <span className='payout-value'>1.95x</span>
                                    </div>
                                    <div className='payout-row'>
                                        <span>Win Probability:</span>
                                        <span>~50%</span>
                                    </div>
                                    <div className='payout-description'>
                                        Predict if the next tick will be higher or lower than the current tick
                                    </div>
                                </div>
                            </div>
                            <div className='payout-card'>
                                <h4>Over/Under</h4>
                                <div className='payout-info'>
                                    <div className='payout-row'>
                                        <span>Payout:</span>
                                        <span className='payout-value'>Variable</span>
                                    </div>
                                    <div className='payout-row'>
                                        <span>Win Probability:</span>
                                        <span>Depends on barrier</span>
                                    </div>
                                    <div className='payout-description'>
                                        Predict if the last digit will be over or under a specific barrier (0-9)
                                    </div>
                                </div>
                            </div>
                            <div className='payout-card'>
                                <h4>Matches/Differs</h4>
                                <div className='payout-info'>
                                    <div className='payout-row'>
                                        <span>Payout:</span>
                                        <span className='payout-value'>9.5x</span>
                                    </div>
                                    <div className='payout-row'>
                                        <span>Win Probability:</span>
                                        <span>10%</span>
                                    </div>
                                    <div className='payout-description'>
                                        Predict if the last digit matches a specific number (higher risk, higher reward)
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className='payout-notes'>
                            <h4>Important Notes</h4>
                            <ul>
                                <li>Payouts are subject to market conditions and may vary</li>
                                <li>All trades are subject to Deriv's terms and conditions</li>
                                <li>Past performance does not guarantee future results</li>
                                <li>Trade responsibly and within your means</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* DFT Apps Tab */}
                {activeTab === 'dftapps' && (
                    <div className='dftapps-section'>
                        <h3>Digit Frequency Tools</h3>
                        <div className='apps-grid'>
                            <div className='app-card'>
                                <div className='app-icon'>
                                    <LabelPairedChartMixedMdRegularIcon />
                                </div>
                                <h4>Frequency Analyzer</h4>
                                <p>Analyze digit frequency patterns across multiple markets simultaneously</p>
                                <button
                                    className='app-btn'
                                    onClick={() => (window.location.href = '#/digit-frequency')}
                                >
                                    Open Tool
                                </button>
                            </div>
                            <div className='app-card'>
                                <div className='app-icon'>
                                    <LabelPairedTargetMdRegularIcon />
                                </div>
                                <h4>Pattern Scanner</h4>
                                <p>Scan for repeating patterns and streaks in real-time market data</p>
                                <button
                                    className='app-btn'
                                    onClick={() => addAlert('Pattern Scanner coming soon!', 'info')}
                                >
                                    Coming Soon
                                </button>
                            </div>
                            <div className='app-card'>
                                <div className='app-icon'>
                                    <LabelPairedChartLineUpMdRegularIcon />
                                </div>
                                <h4>Trend Predictor</h4>
                                <p>AI-powered trend prediction based on historical data analysis</p>
                                <button
                                    className='app-btn'
                                    onClick={() => addAlert('Trend Predictor coming soon!', 'info')}
                                >
                                    Coming Soon
                                </button>
                            </div>
                            <div className='app-card'>
                                <div className='app-icon'>
                                    <LabelPairedBellMdRegularIcon />
                                </div>
                                <h4>Alert Manager</h4>
                                <p>Set custom alerts for specific patterns, streaks, or probability thresholds</p>
                                <button
                                    className='app-btn'
                                    onClick={() => addAlert('Alert Manager coming soon!', 'info')}
                                >
                                    Coming Soon
                                </button>
                            </div>
                            <div className='app-card'>
                                <div className='app-icon'>
                                    <LabelPairedCalculatorMdRegularIcon />
                                </div>
                                <h4>Risk Calculator</h4>
                                <p>Calculate optimal stake sizes and risk management strategies</p>
                                <button
                                    className='app-btn'
                                    onClick={() => addAlert('Risk Calculator coming soon!', 'info')}
                                >
                                    Coming Soon
                                </button>
                            </div>
                            <div className='app-card'>
                                <div className='app-icon'>
                                    <LabelPairedRobotMdRegularIcon />
                                </div>
                                <h4>Bot Builder</h4>
                                <p>Create automated trading bots based on your analysis strategies</p>
                                <button className='app-btn' onClick={() => (window.location.href = '#/bot-builder')}>
                                    Open Tool
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Smart Badge Tab */}
                {activeTab === 'smartbadge' && (
                    <div className='smartbadge-section'>
                        <h3>Smart Trading Badge</h3>
                        <div className='badge-container'>
                            <div className='badge-display'>
                                <div className='badge-icon'>
                                    <LabelPairedTrophyMdFillIcon />
                                </div>
                                <div className='badge-level'>Level {Math.floor(totalTrades / 10) + 1}</div>
                                <div className='badge-title'>
                                    {totalTrades === 0
                                        ? 'Beginner Trader'
                                        : totalTrades < 10
                                          ? 'Novice Trader'
                                          : totalTrades < 50
                                            ? 'Intermediate Trader'
                                            : totalTrades < 100
                                              ? 'Advanced Trader'
                                              : totalTrades < 500
                                                ? 'Expert Trader'
                                                : 'Master Trader'}
                                </div>
                                <div className='badge-progress'>
                                    <div className='progress-bar'>
                                        <div
                                            className='progress-fill'
                                            style={{ width: `${(totalTrades % 10) * 10}%` }}
                                        ></div>
                                    </div>
                                    <div className='progress-text'>{totalTrades % 10}/10 trades to next level</div>
                                </div>
                            </div>
                            <div className='badge-stats'>
                                <h4>Your Statistics</h4>
                                <div className='stat-grid'>
                                    <div className='stat-item'>
                                        <div className='stat-icon'>
                                            <LabelPairedChartMixedMdRegularIcon />
                                        </div>
                                        <div className='stat-details'>
                                            <div className='stat-label'>Total Trades</div>
                                            <div className='stat-number'>{totalTrades}</div>
                                        </div>
                                    </div>
                                    <div className='stat-item'>
                                        <div className='stat-icon'>
                                            <LabelPairedTargetMdRegularIcon />
                                        </div>
                                        <div className='stat-details'>
                                            <div className='stat-label'>Win Rate</div>
                                            <div className='stat-number'>{winRate}%</div>
                                        </div>
                                    </div>
                                    <div className='stat-item'>
                                        <div className='stat-icon'>
                                            <LabelPairedCircleDollarMdRegularIcon />
                                        </div>
                                        <div className='stat-details'>
                                            <div className='stat-label'>Total Profit</div>
                                            <div
                                                className={`stat-number ${totalProfit >= 0 ? 'positive' : 'negative'}`}
                                            >
                                                {totalProfit >= 0 ? '+' : ''}
                                                {totalProfit.toFixed(2)} {currency}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='stat-item'>
                                        <div className='stat-icon'>
                                            <LabelPairedFireMdFillIcon />
                                        </div>
                                        <div className='stat-details'>
                                            <div className='stat-label'>Best Streak</div>
                                            <div className='stat-number'>
                                                {trades.filter(t => t.result === 'win').length > 0
                                                    ? Math.max(
                                                          ...trades
                                                              .filter(t => t.result === 'win')
                                                              .map((_, i, arr) => {
                                                                  let streak = 1;
                                                                  for (
                                                                      let j = i + 1;
                                                                      j < arr.length && arr[j].result === 'win';
                                                                      j++
                                                                  )
                                                                      streak++;
                                                                  return streak;
                                                              })
                                                      )
                                                    : 0}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='badge-achievements'>
                                <h4>Achievements</h4>
                                <div className='achievements-grid'>
                                    <div className={`achievement ${totalTrades >= 1 ? 'unlocked' : 'locked'}`}>
                                        <div className='achievement-icon'>
                                            <LabelPairedTargetMdRegularIcon />
                                        </div>
                                        <div className='achievement-name'>First Trade</div>
                                    </div>
                                    <div className={`achievement ${totalTrades >= 10 ? 'unlocked' : 'locked'}`}>
                                        <div className='achievement-icon'>
                                            <LabelPairedChartLineUpMdRegularIcon />
                                        </div>
                                        <div className='achievement-name'>10 Trades</div>
                                    </div>
                                    <div className={`achievement ${winRate >= 60 ? 'unlocked' : 'locked'}`}>
                                        <div className='achievement-icon'>
                                            <LabelPairedTrophyMdFillIcon />
                                        </div>
                                        <div className='achievement-name'>60% Win Rate</div>
                                    </div>
                                    <div className={`achievement ${totalProfit >= 100 ? 'unlocked' : 'locked'}`}>
                                        <div className='achievement-icon'>
                                            <LabelPairedGemMdFillIcon />
                                        </div>
                                        <div className='achievement-name'>100+ Profit</div>
                                    </div>
                                    <div className={`achievement ${totalTrades >= 50 ? 'unlocked' : 'locked'}`}>
                                        <div className='achievement-icon'>
                                            <LabelPairedStarMdFillIcon />
                                        </div>
                                        <div className='achievement-name'>50 Trades</div>
                                    </div>
                                    <div className={`achievement ${totalTrades >= 100 ? 'unlocked' : 'locked'}`}>
                                        <div className='achievement-icon'>
                                            <LabelPairedStarMdFillIcon />
                                        </div>
                                        <div className='achievement-name'>Century</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
