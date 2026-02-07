import React from 'react';
import './DerivAnalysisPage.scss';

export const DerivAnalysisPage: React.FC = () => {
    return (
        <div className='deriv-analysis-page'>
            <div className='deriv-analysis-header'>
                <h1>📊 Deriv Analysis</h1>
                <p>Full Deriv Trader interface with Over/Under trading capabilities</p>
            </div>
            <div className='deriv-trader-container'>
                <iframe
                    src='https://app.deriv.com/dtrader?market=synthetic_index&underlying=R_100&trade_type=overunder'
                    title='Deriv Trader'
                    className='deriv-trader-iframe'
                    allow='fullscreen; payment'
                />
            </div>
        </div>
    );
};
