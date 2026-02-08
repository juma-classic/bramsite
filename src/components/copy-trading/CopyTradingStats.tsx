import React from 'react';
import type { CopyTradingStats } from '@/types/copy-trading.types';
import './CopyTradingStats.scss';

// Icon Components
const UsersIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' stroke='currentColor' strokeWidth='2' />
        <circle cx='9' cy='7' r='4' stroke='currentColor' strokeWidth='2' fill='none' />
        <path d='M22 21v-2a4 4 0 0 0-3-3.87' stroke='currentColor' strokeWidth='2' />
        <path d='M16 3.13a4 4 0 0 1 0 7.75' stroke='currentColor' strokeWidth='2' />
    </svg>
);

const ChartIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M3 3v18h18' stroke='currentColor' strokeWidth='2' />
        <path d='M7 14l3-3 3 3 5-7' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' />
    </svg>
);

const TargetIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' fill='none' />
        <circle cx='12' cy='12' r='6' stroke='currentColor' strokeWidth='2' fill='none' />
        <circle cx='12' cy='12' r='2' fill='currentColor' />
    </svg>
);

const MoneyIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' fill='none' />
        <path d='M12 6v12M9 9h3.5a2.5 2.5 0 0 1 0 5H9' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

const BoltIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M13 2L3 14h8l-1 8 10-12h-8l1-8z'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinejoin='round'
            fill='none'
        />
    </svg>
);

const TrophyIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M6 9H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h2M18 9h2a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2h-2'
            stroke='currentColor'
            strokeWidth='2'
        />
        <path d='M6 9a6 6 0 0 0 12 0' stroke='currentColor' strokeWidth='2' />
        <path d='M12 15v4M8 19h8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

const CrownIcon = () => (
    <svg width='16' height='16' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M2 20h20L19 8l-7 5-5-5-3 12z' fill='#ffd700' stroke='#ffd700' strokeWidth='2' strokeLinejoin='round' />
        <circle cx='12' cy='6' r='2' fill='#ffd700' />
    </svg>
);

const TrendUpIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path
            d='M23 6l-9.5 9.5-5-5L1 18'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
        />
        <path d='M17 6h6v6' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' />
    </svg>
);

const ClockIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <circle cx='12' cy='12' r='10' stroke='currentColor' strokeWidth='2' fill='none' />
        <path d='M12 6v6l4 2' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

const NewIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect x='3' y='3' width='18' height='18' rx='2' stroke='currentColor' strokeWidth='2' fill='none' />
        <path d='M12 8v8M8 12h8' stroke='currentColor' strokeWidth='2' strokeLinecap='round' />
    </svg>
);

const DiamondIcon = () => (
    <svg width='20' height='20' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <path d='M12 2L2 9l10 13L22 9 12 2z' stroke='currentColor' strokeWidth='2' strokeLinejoin='round' fill='none' />
        <path d='M2 9h20M12 2v20' stroke='currentColor' strokeWidth='2' />
    </svg>
);

interface CopyTradingStatsProps {
    stats: CopyTradingStats;
}

export const CopyTradingStats: React.FC<CopyTradingStatsProps> = ({ stats }) => {
    const winRate = stats.totalCopyTrades > 0 ? (stats.successfulCopyTrades / stats.totalCopyTrades) * 100 : 0;

    const topTraders = Object.entries(stats.traderStats)
        .sort(([, a], [, b]) => b.totalProfit - a.totalProfit)
        .slice(0, 5);

    return (
        <div className='copy-trading-stats'>
            {/* Overview Stats */}
            <div className='stats-overview'>
                <div className='stats-grid'>
                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>
                                <UsersIcon />
                            </span>
                            <span className='stat-title'>Total Traders</span>
                        </div>
                        <div className='stat-value'>{stats.totalCopyTraders}</div>
                        <div className='stat-subtitle'>{stats.activeCopyTraders} active</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>
                                <ChartIcon />
                            </span>
                            <span className='stat-title'>Total Trades</span>
                        </div>
                        <div className='stat-value'>{stats.totalCopyTrades}</div>
                        <div className='stat-subtitle'>{stats.successfulCopyTrades} successful</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>
                                <TargetIcon />
                            </span>
                            <span className='stat-title'>Win Rate</span>
                        </div>
                        <div className='stat-value'>{winRate.toFixed(1)}%</div>
                        <div className='stat-subtitle'>Overall performance</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>
                                <MoneyIcon />
                            </span>
                            <span className='stat-title'>Total Profit</span>
                        </div>
                        <div className={`stat-value ${stats.totalCopyProfit >= 0 ? 'positive' : 'negative'}`}>
                            ${stats.totalCopyProfit.toFixed(2)}
                        </div>
                        <div className='stat-subtitle'>Combined profit</div>
                    </div>

                    <div className='stat-card'>
                        <div className='stat-header'>
                            <span className='stat-icon'>
                                <BoltIcon />
                            </span>
                            <span className='stat-title'>Avg Execution</span>
                        </div>
                        <div className='stat-value'>{stats.averageExecutionTime.toFixed(0)}ms</div>
                        <div className='stat-subtitle'>Execution time</div>
                    </div>
                </div>
            </div>

            {/* Top Performers */}
            {topTraders.length > 0 && (
                <div className='top-performers'>
                    <h3>
                        <TrophyIcon /> Top Performing Traders
                    </h3>
                    <div className='performers-list'>
                        {topTraders.map(([traderId, traderStats], index) => (
                            <div key={traderId} className='performer-card'>
                                <div className='performer-rank'>
                                    <span className='rank-number'>#{index + 1}</span>
                                    {index === 0 && (
                                        <span className='crown'>
                                            <CrownIcon />
                                        </span>
                                    )}
                                </div>

                                <div className='performer-info'>
                                    <div className='performer-id'>Trader {traderId.slice(-6)}</div>
                                    <div className='performer-stats'>
                                        <span className='trades'>{traderStats.totalTrades} trades</span>
                                        <span className='win-rate'>{traderStats.winRate.toFixed(1)}% win rate</span>
                                    </div>
                                </div>

                                <div className='performer-profit'>
                                    <div
                                        className={`profit-value ${traderStats.totalProfit >= 0 ? 'positive' : 'negative'}`}
                                    >
                                        ${traderStats.totalProfit.toFixed(2)}
                                    </div>
                                    <div className='avg-stake'>Avg: ${traderStats.averageStake.toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Performance Chart Placeholder */}
            <div className='performance-chart'>
                <h3>
                    <TrendUpIcon /> Performance Overview
                </h3>
                <div className='chart-placeholder'>
                    <div className='chart-info'>
                        <span className='chart-icon'>
                            <ChartIcon />
                        </span>
                        <div className='chart-text'>
                            <h4>Performance Chart</h4>
                            <p>Detailed performance charts will be available in future updates</p>
                        </div>
                    </div>

                    {/* Simple performance indicators */}
                    <div className='performance-indicators'>
                        <div className='indicator'>
                            <span className='indicator-label'>Success Rate</span>
                            <div className='indicator-bar'>
                                <div className='indicator-fill success' style={{ width: `${winRate}%` }}></div>
                            </div>
                            <span className='indicator-value'>{winRate.toFixed(1)}%</span>
                        </div>

                        <div className='indicator'>
                            <span className='indicator-label'>Active Traders</span>
                            <div className='indicator-bar'>
                                <div
                                    className='indicator-fill active'
                                    style={{
                                        width: `${stats.totalCopyTraders > 0 ? (stats.activeCopyTraders / stats.totalCopyTraders) * 100 : 0}%`,
                                    }}
                                ></div>
                            </div>
                            <span className='indicator-value'>
                                {stats.totalCopyTraders > 0
                                    ? ((stats.activeCopyTraders / stats.totalCopyTraders) * 100).toFixed(1)
                                    : 0}
                                %
                            </span>
                        </div>

                        <div className='indicator'>
                            <span className='indicator-label'>Profitability</span>
                            <div className='indicator-bar'>
                                <div
                                    className={`indicator-fill ${stats.totalCopyProfit >= 0 ? 'profit' : 'loss'}`}
                                    style={{ width: '75%' }}
                                ></div>
                            </div>
                            <span className='indicator-value'>
                                {stats.totalCopyProfit >= 0 ? 'Profitable' : 'Loss'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className='recent-activity'>
                <h3>
                    <ClockIcon /> Recent Activity Summary
                </h3>
                <div className='activity-grid'>
                    <div className='activity-item'>
                        <span className='activity-icon'>
                            <NewIcon />
                        </span>
                        <div className='activity-content'>
                            <div className='activity-title'>New Traders</div>
                            <div className='activity-value'>
                                {
                                    Object.values(stats.traderStats).filter(
                                        s => Date.now() - s.lastTradeTime < 24 * 60 * 60 * 1000
                                    ).length
                                }
                            </div>
                            <div className='activity-subtitle'>Last 24 hours</div>
                        </div>
                    </div>

                    <div className='activity-item'>
                        <span className='activity-icon'>
                            <TrendUpIcon />
                        </span>
                        <div className='activity-content'>
                            <div className='activity-title'>Recent Trades</div>
                            <div className='activity-value'>
                                {Object.values(stats.traderStats).reduce(
                                    (sum, s) =>
                                        sum + (Date.now() - s.lastTradeTime < 24 * 60 * 60 * 1000 ? s.totalTrades : 0),
                                    0
                                )}
                            </div>
                            <div className='activity-subtitle'>Last 24 hours</div>
                        </div>
                    </div>

                    <div className='activity-item'>
                        <span className='activity-icon'>
                            <DiamondIcon />
                        </span>
                        <div className='activity-content'>
                            <div className='activity-title'>Best Performer</div>
                            <div className='activity-value'>
                                {topTraders.length > 0 ? `${topTraders[0][1].winRate.toFixed(1)}%` : 'N/A'}
                            </div>
                            <div className='activity-subtitle'>Win rate</div>
                        </div>
                    </div>

                    <div className='activity-item'>
                        <span className='activity-icon'>
                            <BoltIcon />
                        </span>
                        <div className='activity-content'>
                            <div className='activity-title'>Execution Speed</div>
                            <div className='activity-value'>
                                {stats.averageExecutionTime < 1000
                                    ? 'Fast'
                                    : stats.averageExecutionTime < 3000
                                      ? 'Good'
                                      : 'Slow'}
                            </div>
                            <div className='activity-subtitle'>{stats.averageExecutionTime.toFixed(0)}ms avg</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
