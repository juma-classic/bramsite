import React, { useState } from 'react';
import { useTickPointer } from '@/hooks/useTickPointer';
import './SimpleAnalysisTool.scss';

export const SimpleAnalysisTool: React.FC = () => {
    const [selectedMarket, setSelectedMarket] = useState('R_50');

    // Using the existing hook for data
    const { currentTick, digitStats, getHotDigits, getColdDigits } = useTickPointer(selectedMarket, true);

    const markets = [
        { value: 'R_10', label: 'Volatility 10' },
        { value: 'R_25', label: 'Volatility 25' },
        { value: 'R_50', label: 'Volatility 50' },
        { value: 'R_75', label: 'Volatility 75' },
        { value: 'R_100', label: 'Volatility 100' },
        { value: '1HZ10V', label: 'Volatility 10 (1s)' },
        { value: '1HZ25V', label: 'Volatility 25 (1s)' },
        { value: '1HZ50V', label: 'Volatility 50 (1s)' },
        { value: '1HZ75V', label: 'Volatility 75 (1s)' },
        { value: '1HZ100V', label: 'Volatility 100 (1s)' },
    ];

    const hotDigits = getHotDigits(3);
    const coldDigits = getColdDigits(3);
    const lastDigit = currentTick ? currentTick.toString().slice(-1) : '-';

    return (
        <div className='simple-analysis-tool'>
            <div className='tool-header'>
                <h2>Simple Analysis Tool</h2>
                <div className='market-selector'>
                    <select value={selectedMarket} onChange={e => setSelectedMarket(e.target.value)}>
                        {markets.map(m => (
                            <option key={m.value} value={m.value}>
                                {m.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className='tool-content'>
                <div className='stat-card'>
                    <h3>Current Price</h3>
                    <div className='value price'>{currentTick?.toFixed(4) || 'Loading...'}</div>
                </div>

                <div className='stat-card'>
                    <h3>Last Digit</h3>
                    <div className='value digit'>{lastDigit}</div>
                </div>

                <div className='stat-card'>
                    <h3>Hot Digits</h3>
                    <div className='value' style={{ color: '#ef4444', fontSize: '1.5rem' }}>
                        {hotDigits.join(', ')}
                    </div>
                </div>

                <div className='stat-card'>
                    <h3>Cold Digits</h3>
                    <div className='value' style={{ color: '#3b82f6', fontSize: '1.5rem' }}>
                        {coldDigits.join(', ')}
                    </div>
                </div>

                <div className='digit-stats-grid'>
                    <h3>Digit Statistics (Last 1000 Ticks)</h3>
                    <div className='stats-bars'>
                        {digitStats.map((stat, index) => (
                            <div key={index} className='stat-bar'>
                                <div
                                    className={`bar-fill ${hotDigits.includes(index) ? 'hot' : ''} ${coldDigits.includes(index) ? 'cold' : ''}`}
                                    style={{ height: `${stat.percentage * 2}%` }}
                                ></div>
                                <span className='digit-label'>{index}</span>
                                <span className='percentage'>{stat.percentage.toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SimpleAnalysisTool;
