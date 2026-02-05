import { initSurvicate } from '../public-path';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { analyticsManager } from '@/services/analytics-manager.service';
import { masterTradeIntegrationService } from '@/services/master-trade-integration.service';
import { TAuthData } from '@/types/api-types';
import { initAntiInspect } from '@/utils/anti-inspect';
import { initializeFastLaneViewport } from '@/utils/fast-lane-viewport';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { router } from './AppRoutes';
import './app-root.scss';
// Initialize console manager and analytics manager early
import '@/utils/console-manager';

function App() {
    useEffect(() => {
        // Initialize analytics manager early
        analyticsManager.initialize().catch(console.error);

        // Initialize master trade integration service for copy trading
        masterTradeIntegrationService.initialize().catch(console.error);

        initSurvicate();
        window?.dataLayer?.push({ event: 'page_load' });

        // Initialize Fast Lane viewport manager
        initializeFastLaneViewport();

        // Initialize anti-inspection protection (production only)
        initAntiInspect();

        return () => {
            const survicateBox = document.getElementById('survicate-box');
            if (survicateBox) {
                survicateBox.style.display = 'none';
            }
        };
    }, []);

    useEffect(() => {
        const accountsList = localStorage.getItem('accountsList');
        const clientAccounts = localStorage.getItem('clientAccounts');
        const urlParams = new URLSearchParams(window.location.search);
        const accountCurrency = urlParams.get('account');

        if (!accountsList || !clientAccounts) return;

        try {
            const parsedAccounts = JSON.parse(accountsList);
            const parsedClientAccounts = JSON.parse(clientAccounts) as TAuthData['account_list'];
            const isValidCurrency = accountCurrency
                ? Object.values(parsedClientAccounts).some(
                      account => account.currency.toUpperCase() === accountCurrency.toUpperCase()
                  )
                : false;

            const updateLocalStorage = (token: string, loginid: string) => {
                localStorage.setItem('authToken', token);
                localStorage.setItem('active_loginid', loginid);
            };

            // Handle demo account
            if (accountCurrency?.toUpperCase() === 'DEMO') {
                const demoAccount = Object.entries(parsedAccounts).find(([key]) => key.startsWith('VR'));

                if (demoAccount) {
                    const [loginid, token] = demoAccount;
                    updateLocalStorage(String(token), loginid);
                    return;
                }
            }

            // Handle real account with valid currency
            if (accountCurrency?.toUpperCase() !== 'DEMO' && isValidCurrency) {
                const realAccount = Object.entries(parsedClientAccounts).find(
                    ([loginid, account]) =>
                        !loginid.startsWith('VR') && account.currency.toUpperCase() === accountCurrency?.toUpperCase()
                );

                if (realAccount) {
                    const [loginid, account] = realAccount;
                    if ('token' in account) {
                        updateLocalStorage(String(account?.token), loginid);
                    }
                    return;
                }
            }
        } catch (e) {
            console.warn('Error parsing accounts:', e);
        }
    }, []);

    // ✅ Register the service worker (for PWA support)
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/service-worker.js')
                    .catch(error => {
                        console.warn('Service Worker registration failed:', error);
                    });
            });
        }
    }, []);

    return (
        <>
            <RouterProvider router={router} />
            <Analytics />
            <SpeedInsights />
        </>
    );
}

export default App;
