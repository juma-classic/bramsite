import React from 'react';

interface FreeBotCardProps {
    bot: {
        title: string;
        image: string;
        filePath: string;
        xmlContent: string;
    };
    index: number;
    onClick: () => void;
}

export const FreeBotCard: React.FC<FreeBotCardProps> = ({ bot, index, onClick }) => {
    const isPremium = index % 3 === 0;
    const botEmojis = ['🎯', '⚡', '🚀', '💎', '🔥', '⭐', '🎲', '🎰', '💰', '🏆'];
    const botEmoji = botEmojis[index % botEmojis.length];
    const successRate = 75 + Math.floor(Math.random() * 20);

    const [isHovered, setIsHovered] = React.useState(false);

    return (
        <div
            className='bot-card'
            style={{
                background: '#ffffff',
                borderRadius: '16px',
                padding: '1.5rem',
                boxShadow: isHovered ? '0 12px 32px rgba(30, 58, 138, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                cursor: 'pointer',
                border: `2px solid ${isHovered ? '#1e3a8a' : 'transparent'}`,
                position: 'relative',
                overflow: 'hidden',
                transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
        >
            {/* Premium Badge */}
            {isPremium && (
                <div
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                        color: 'white',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        boxShadow: '0 2px 8px rgba(255, 107, 53, 0.3)',
                    }}
                >
                    PREMIUM
                </div>
            )}

            {/* Bot Icon */}
            <div
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    marginBottom: '1rem',
                    boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)',
                }}
            >
                {botEmoji}
            </div>

            {/* Bot Name */}
            <h3
                style={{
                    color: '#1e3a8a',
                    fontSize: '1.15rem',
                    fontWeight: '700',
                    margin: '0 0 0.5rem 0',
                    lineHeight: '1.3',
                    minHeight: '2.6rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                {bot.title?.replace('.xml', '') || 'Untitled Bot'}
            </h3>

            {/* Bot Description */}
            <p
                style={{
                    color: '#64748b',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    margin: '0 0 1rem 0',
                    minHeight: '3rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                }}
            >
                Advanced automated trading strategy with optimized entry and exit points
            </p>

            {/* Success Rate Bar */}
            <div style={{ marginBottom: '1rem' }}>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                    }}
                >
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Success Rate</span>
                    <span style={{ fontSize: '0.875rem', color: '#1e3a8a', fontWeight: '700' }}>{successRate}%</span>
                </div>
                <div
                    style={{
                        width: '100%',
                        height: '6px',
                        background: '#e2e8f0',
                        borderRadius: '3px',
                        overflow: 'hidden',
                    }}
                >
                    <div
                        style={{
                            width: `${successRate}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #1e3a8a 0%, #3b82f6 100%)',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease',
                        }}
                    />
                </div>
            </div>

            {/* Load Button */}
            <button
                style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
                    color: '#FFD700',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                    boxShadow: isHovered ? '0 4px 12px rgba(30, 58, 138, 0.3)' : 'none',
                }}
            >
                Load Bot
                <svg width='16' height='16' viewBox='0 0 24 24' fill='none'>
                    <path
                        d='M13 7l5 5-5 5M6 12h12'
                        stroke='#FFD700'
                        strokeWidth='2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </button>
        </div>
    );
};
