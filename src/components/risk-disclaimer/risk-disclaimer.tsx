import React, { useState } from 'react';
import './risk-disclaimer.scss';

const RiskDisclaimer: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => setIsOpen(true);
    const handleClose = () => setIsOpen(false);

    return (
        <>
            {/* Risk Disclaimer Button */}
            <button className="risk-disclaimer-button" onClick={handleOpen} aria-label="Risk Disclaimer">
                <span className="warning-icon">⚠</span>
                <span className="button-text">Risk Disclaimer</span>
            </button>

            {/* Risk Disclaimer Modal */}
            {isOpen && (
                <div className="risk-disclaimer-overlay" onClick={handleClose}>
                    <div className="risk-disclaimer-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <span className="warning-icon-large">⚠</span>
                            <h2>Risk Disclaimer</h2>
                            <button className="close-button" onClick={handleClose} aria-label="Close">
                                ✕
                            </button>
                        </div>

                        <div className="modal-content">
                            <p className="intro-text">
                                Deriv offers complex derivatives, such as options and contracts for difference ("CFDs"). 
                                These products may not be suitable for all clients, and trading them puts you at risk.
                            </p>

                            <p className="section-title">
                                Please make sure that you understand the following risks before trading Deriv products:
                            </p>

                            <ul className="risk-list">
                                <li>
                                    <span className="list-label">a)</span> You may lose some or all of the money you invest in the trade
                                </li>
                                <li>
                                    <span className="list-label">b)</span> If your trade involves currency conversion, exchange rates will affect your profit and loss
                                </li>
                            </ul>

                            <div className="warning-box">
                                You should never trade with borrowed money or with money that you cannot afford to lose.
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="understand-button" onClick={handleClose}>
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default RiskDisclaimer;
