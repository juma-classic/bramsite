import React, { useState, useEffect, useRef } from 'react';
import { derivAPIService } from '@/services/deriv-api.service';
import { api_base } from '@/external/bot-skeleton';
import { useStore } from '@/hooks/useStore';
import './TradingAnalysisPage.scss';

interface TickData {
    value: number;
    timestamp: number;
    price: number;
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
    const subscriptionIdRef = useRef<string | null>(null);
    const tickHistoryRef = useRef<TickData[]>([]);

    // Check if API is ready
    useEffect(() => {
        const checkApiReady = () => {
            if (api_base.api) {
                console.log('✅ Deriv API is ready');
                console.log('👤 Login status:', isLoggedIn ? 'Logged in' : 'Not logged in (using demo data)');
                setIsApiReady(true);
                setErrorMessage('');
            } else {
                console.log('⏳ Waiting for Deriv API...');
                setTimeout(checkApiReady, 500);
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

    // Subscribe to market data when API is ready
    useEffect(() => {
        if (!isApiReady) return;

        const symbol = MARKET_SYMBOLS[market];
        console.log('📊 Subscribing to:', symbol, 'for market:', market);

        const subscribe = async () => {
            try {
                // Unsubscribe from previous if exists
                if (subscriptionIdRef.current) {
                    await derivAPIService.unsubscribe(subscriptionIdRef.current);
                    subscriptionIdRef.current = null;
                }

                // Reset state
                tickHistoryRef.current = [];
                setTicks([]);
                setCurrentPrice(0);
                setIsSubscribed(false);

                // Get tick history
                const historyResponse = await derivAPIService.getTicksHistory({
                    symbol,
                    count: Math.min(numberOfTicks, 1000),
                    end: 'latest',
                    style: 'ticks',
                });

                console.log('📜 Received tick history:', historyResponse);

                if (historyResponse?.history) {
                    const prices = historyResponse.history.prices;
                    const times = historyResponse.history.times;

                    const historyTicks: TickData[] = prices.map((price: number, index: number) => ({
                        value: extractLastDigit(price),
                        timestamp: times[index] * 1000,
                        price,
                    }));

                    tickHistoryRef.current = historyTicks;
                    setTicks(historyTicks.slice(-20));
                    if (prices.length > 0) {
                        setCurrentPrice(prices[prices.length - 1]);
                        console.log('💰 Initial price:', prices[prices.length - 1]);
                    }
                    calculateStatistics(historyTicks);
                    setErrorMessage('');
                } else {
                    console.warn('⚠️ No history data received');
                    setErrorMessage('No historical data available');
                }

                // Subscribe to live ticks
                const subscriptionId = await derivAPIService.subscribeToTicks(symbol, response => {
                    if (response.tick && response.tick.symbol === symbol) {
                        const price = response.tick.quote;
                        const lastDigit = extractLastDigit(price);

                        console.log('🔄 New tick:', price, 'digit:', lastDigit);

                        const newTick: TickData = {
                            value: lastDigit,
                            timestamp: response.tick.epoch * 1000,
                            price,
                        };

                        tickHistoryRef.current = [...tickHistoryRef.current, newTick].slice(-numberOfTicks);
                        setTicks(tickHistoryRef.current.slice(-20));
                        setCurrentPrice(price);
                        calculateStatistics(tickHistoryRef.current);
                    }
                });

                if (subscriptionId) {
                    subscriptionIdRef.current = subscriptionId;
                    setIsSubscribed(true);
                    console.log('✅ Successfully subscribed with ID:', subscriptionId);
                }
            } catch (error) {
                console.error('❌ Failed to subscribe:', error);
                setIsSubscribed(false);
                setErrorMessage(
                    isLoggedIn
                        ? 'Failed to connect to Deriv API. Please check your connection.'
                        : 'Please log in to Deriv to access live market data.'
                );
            }
        };

        subscribe();

        return () => {
            if (subscriptionIdRef.current) {
                console.log('🔌 Unsubscribing from:', symbol);
                derivAPIService.unsubscribe(subscriptionIdRef.current).catch(console.error);
                subscriptionIdRef.current = null;
            }
            setIsSubscribed(false);
        };
    }, [isApiReady, market, numberOfTicks]);

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
                <button className='tab-btn active'>Analysis Tools</button>
                <button className='tab-btn'>Pay Table</button>
                <button className='tab-btn'>Trading View</button>
                <button className='tab-btn'>DFT Apps</button>
                <button className='tab-btn'>Smart Badge</button>
            </div>

            {/* Main Content - Single Column Layout */}
            <div className='analysis-content-wrapper'>
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
            </div>
        </div>
    );
};
