import React from 'react';
import { Localize } from '@deriv-com/translations';
import { FreeBotCard } from './FreeBotCard';
import './FreeBotsSection.scss';

interface Bot {
    title: string;
    image: string;
    filePath: string;
    xmlContent: string;
}

interface FreeBotsSectionProps {
    bots: Bot[];
    onBotClick: (bot: Bot) => void;
}

export const FreeBotsSection: React.FC<FreeBotsSectionProps> = ({ bots, onBotClick }) => {
    return (
        <div className='free-bots-container'>
            {/* Header Section */}
            <div className='free-bots-header'>
                <div className='header-title-row'>
                    <h1 className='header-title'>
                        <span className='header-emoji'>🤖</span>
                        Bot Collection
                    </h1>
                    <div className='bots-count-badge'>
                        <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                            <path d='M9 12l2 2 4-4' stroke='#FFD700' strokeWidth='2' strokeLinecap='round' />
                            <circle cx='12' cy='12' r='10' stroke='#FFD700' strokeWidth='2' />
                        </svg>
                        {bots.length} Bots Available
                    </div>
                </div>
                <p className='header-subtitle'>Manage your automated trading strategies</p>
            </div>

            {/* Bots Grid */}
            <div className='free-bots-grid'>
                {bots.length === 0 ? (
                    <div className='empty-state'>
                        <div className='empty-icon'>🤖</div>
                        <h3 className='empty-title'>No Bots Available</h3>
                        <p className='empty-text'>Check back later for new trading bots</p>
                    </div>
                ) : (
                    bots.map((bot, index) => (
                        <FreeBotCard key={index} bot={bot} index={index} onClick={() => onBotClick(bot)} />
                    ))
                )}
            </div>
        </div>
    );
};
