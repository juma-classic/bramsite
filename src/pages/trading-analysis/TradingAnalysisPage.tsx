import React, { useState, useEffect } from 'react';
import './TradingAnalysisPage.scss';

interface TickData {
    value: number;
    timestamp: number;
}

export const TradingAnalysisPage: React.FC = () => {
    const [market, setMarket] = useState('Volatility 10 Index');
    const [tickType, setTickType] = useState('Even/Odd');
    const [numberOfTicks, setNumberOfTicks] = useState(1000);
    const [ticks, setTicks] = useState<TickData[]>([]);
    const [currentPrice, setCurrentPrice] = useState(5402.31);
    const [evenCount, setEvenCount] = useState(60);
    const [oddCount, setOddCount] = useState(40);

    // Generate sample tick data
    useEffect(() => {
        const generateTicks = () => {
            const newTicks: TickData[] = [];
            let price = 5400;
            for (let i = 0; i < 20; i++) {
                price += (Math.random() - 0.5) * 10;
                newTicks.push({
                    value: Math.floor(price * 100) % 10,
                    timestamp: Date.now() - (20 - i) * 1000,
                });
            }
            setTicks(newTicks);
        };
        generateTicks();
    }, []);

    const getTickColor = (digit: number) => {
        const colors = [
            '#4A90E2',
            '#E24A4A',
            '#4AE290',
            '#E2904A',
            '#904AE2',
            '#E2E24A',
            '#4AE2E2',
            '#E24AE2',
            '#90E24A',
            '#4A4AE2',
        ];
        return colors[digit];
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
                    <div className='price-label'>CURRENT PRICE</div>
                    <div className='price-value'>{currentPrice.toFixed(2)}</div>
                    <div className='price-stats'>
                        <div className='stat'>
                            <span className='stat-label'>Even</span>
                            <span className='stat-value'>{evenCount}</span>
                        </div>
                        <div className='stat'>
                            <span className='stat-label'>Odd</span>
                            <span className='stat-value'>{oddCount}</span>
                        </div>
                    </div>
                </div>

                {/* Recent Ticks Pattern - HORIZONTAL */}
                <div className='recent-ticks-section'>
                    <h3>Recent Even/Odd Pattern</h3>
                    <div className='ticks-display-horizontal'>
                        {ticks.map((tick, index) => (
                            <div
                                key={index}
                                className='tick-circle'
                                style={{ backgroundColor: getTickColor(tick.value) }}
                            >
                                {tick.value}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Probability Analysis */}
                <div className='probability-section'>
                    <h3>Probability Analysis</h3>
                    <div className='probability-bars'>
                        <div className='prob-bar even'>
                            <div className='bar-label'>Even</div>
                            <div className='bar-container'>
                                <div className='bar-fill' style={{ width: `${evenCount}%` }}>
                                    {evenCount}%
                                </div>
                            </div>
                        </div>
                        <div className='prob-bar odd'>
                            <div className='bar-label'>Odd</div>
                            <div className='bar-container'>
                                <div className='bar-fill' style={{ width: `${oddCount}%` }}>
                                    {oddCount}%
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
                                    <th>Even/Odd</th>
                                    <th>Over/All</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Winning Streak</td>
                                    <td className='positive'>Above 80%</td>
                                    <td className='positive'>Above 85%</td>
                                </tr>
                                <tr>
                                    <td>Maximum Streak</td>
                                    <td>Up to 15</td>
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
