import { lazy, Suspense } from 'react';
import { createBrowserRouter, createRoutesFromElements, Route } from 'react-router-dom';
import ChunkLoader from '@/components/loader/chunk-loader';
import RoutePromptDialog from '@/components/route-prompt-dialog';
import { StoreProvider } from '@/hooks/useStore';
import CallbackPage from '@/pages/callback';
import Endpoint from '@/pages/endpoint';
import { initializeI18n, localize, TranslationProvider } from '@deriv-com/translations';
import CoreStoreProvider from './CoreStoreProvider';
import { delayedLazy } from '@/utils/delayed-lazy';

// Main components with delayed loading
const Layout = delayedLazy(() => import('../components/layout'), 1000);
const AppRoot = delayedLazy(() => import('./app-root'), 1000);

// Phase 1 Demo Pages
const LiveSignalsDemo = lazy(() => import('../pages/live-signals-demo').then(m => ({ default: m.LiveSignalsDemo })));
const DynamicSignalsDemo = lazy(() =>
    import('../pages/dynamic-signals-demo').then(m => ({ default: m.DynamicSignalsDemo }))
);
const FlashAnimationDemo = lazy(() =>
    import('../components/signals/FlashAnimationDemo').then(m => ({ default: m.FlashAnimationDemo }))
);
const EnhancedSignalsDemo = lazy(() => import('../pages/enhanced-signals-demo').then(m => ({ default: m.default })));
const AdvancedAlgo = lazy(() => import('../pages/advanced-algo').then(m => ({ default: m.default })));
const ElvisZone = lazy(() => import('../pages/elvis-zone').then(m => ({ default: m.default })));

// Accumulator Trading Page
const Accumulator = lazy(() => import('../pages/accumulator/accumulator').then(m => ({ default: m.default })));

// Tick Speed Trading Page
const TickSpeedTrading = lazy(() => import('../pages/tick-speed-trading').then(m => ({ default: m.default })));

// Digit Hacker AI Page
const DigitHackerPage = lazy(() => import('../pages/digit-hacker-page').then(m => ({ default: m.DigitHackerPage })));

// Signal Savvy Page
const SignalSavvyPage = lazy(() => import('../pages/signal-savvy-page').then(m => ({ default: m.default })));

// Patel Signals Page
const PatelSignalsPage = lazy(() => import('../pages/patel-signals-page').then(m => ({ default: m.default })));

// Patel Signal Center Page
const PatelSignalCenterPage = lazy(() =>
    import('../pages/patel-signal-center-page').then(m => ({ default: m.default }))
);

// Rich Mother Page
const RichMotherPage = lazy(() => import('../pages/rich-mother-page').then(m => ({ default: m.default })));

// Speed Bot Page
const SpeedBotPage = lazy(() => import('../pages/speed-bot-page').then(m => ({ default: m.default })));

// DTrader Manual Page
const DTraderManual = lazy(() => import('../pages/dtrader-manual').then(m => ({ default: m.default })));

const { TRANSLATIONS_CDN_URL, R2_PROJECT_NAME, CROWDIN_BRANCH_NAME } = process.env;
const i18nInstance = initializeI18n({
    cdnUrl: `${TRANSLATIONS_CDN_URL}/${R2_PROJECT_NAME}/${CROWDIN_BRANCH_NAME}`,
});

export const router = createBrowserRouter(
    createRoutesFromElements(
        <Route
            path='/'
            element={
                <Suspense
                    fallback={<ChunkLoader message={localize('Welcome to BRAM FX connecting to the server...')} />}
                >
                    <TranslationProvider defaultLang='EN' i18nInstance={i18nInstance}>
                        <StoreProvider>
                            <RoutePromptDialog />
                            <CoreStoreProvider>
                                <Layout />
                            </CoreStoreProvider>
                        </StoreProvider>
                    </TranslationProvider>
                </Suspense>
            }
        >
            <Route index element={<AppRoot />} />
            <Route path='endpoint' element={<Endpoint />} />
            <Route path='callback' element={<CallbackPage />} />

            {/* Advanced Algo - Main Production Page */}
            <Route path='advanced-algo' element={<AdvancedAlgo />} />

            {/* ElvisZone - Matches/Differs Analyzer */}
            <Route path='elvis-zone' element={<ElvisZone />} />

            {/* Accumulator Trading Page */}
            <Route path='accumulator' element={<Accumulator />} />

            {/* Tick Speed Trading Page */}
            <Route path='tick-speed-trading' element={<TickSpeedTrading />} />

            {/* Digit Hacker AI Page */}
            <Route path='digit-hacker' element={<DigitHackerPage />} />

            {/* Signal Savvy Page */}
            <Route path='signal-savvy' element={<SignalSavvyPage />} />

            {/* Patel Signals Page */}
            <Route path='patel-signals' element={<PatelSignalsPage />} />

            {/* Patel Signal Center Page */}
            <Route path='patel-signal-center' element={<PatelSignalCenterPage />} />

            {/* Rich Mother Page */}
            <Route path='rich-mother' element={<RichMotherPage />} />

            {/* Speed Bot Page */}
            <Route path='speed-bot' element={<SpeedBotPage />} />

            {/* DTrader Manual Page */}
            <Route path='dtrader-manual' element={<DTraderManual />} />

            {/* Phase 1 Demo Routes */}
            <Route path='live-signals-demo' element={<LiveSignalsDemo />} />
            <Route path='dynamic-signals-demo' element={<DynamicSignalsDemo />} />
            <Route path='enhanced-signals-demo' element={<EnhancedSignalsDemo />} />
            <Route path='flash-animation-demo' element={<FlashAnimationDemo />} />
        </Route>
    )
);
