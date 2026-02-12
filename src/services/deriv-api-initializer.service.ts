/**
 * Deriv API Initializer Service
 * Handles proper initialization and management of the Deriv API connection
 */

interface DerivAPIConfig {
    appId: number;
    endpoint: string;
    language: string;
    brand: string;
}

interface APIInstance {
    send: (request: any) => Promise<any>;
    subscribe?: (request: any, callback: (response: any) => void) => Promise<() => void>;
    isConnected?: () => boolean;
}

class DerivAPIInitializer {
    private static instance: DerivAPIInitializer;
    private isInitialized = false;
    private isInitializing = false;
    private initPromise: Promise<void> | null = null;
    private apiInstance: APIInstance | null = null;
    private connectionListeners: Set<(connected: boolean) => void> = new Set();

    private readonly config: DerivAPIConfig = {
        appId: 80836,
        endpoint: 'wss://ws.derivws.com/websockets/v3',
        language: 'en',
        brand: 'BRAMFX',
    };

    public static getInstance(): DerivAPIInitializer {
        if (!DerivAPIInitializer.instance) {
            DerivAPIInitializer.instance = new DerivAPIInitializer();
        }
        return DerivAPIInitializer.instance;
    }

    /**
     * Initialize the Deriv API with proper error handling and fallbacks
     */
    public async initialize(): Promise<void> {
        if (this.isInitialized) {
            return;
        }

        if (this.isInitializing && this.initPromise) {
            return this.initPromise;
        }

        this.isInitializing = true;
        this.initPromise = this._performInitialization();

        try {
            await this.initPromise;
        } finally {
            this.isInitializing = false;
        }
    }

    private async _performInitialization(): Promise<void> {
        console.log('🚀 Initializing Deriv API...');

        try {
            // Step 1: Wait for the API script to be loaded
            await this.waitForAPIScript();

            // Step 2: Create API instance
            this.apiInstance = await this.createAPIInstance();

            // Step 3: Test the connection
            await this.testConnection();

            // Step 4: Set up global access
            this.setupGlobalAccess();

            this.isInitialized = true;
            console.log('✅ Deriv API initialized successfully');
            this.notifyConnectionListeners(true);
        } catch (error) {
            console.error('❌ Failed to initialize Deriv API:', error);

            // Create fallback API for graceful degradation
            this.createFallbackAPI();
            this.notifyConnectionListeners(false);

            throw error;
        }
    }

    /**
     * Wait for the Deriv API script to be loaded
     */
    private async waitForAPIScript(timeout: number = 15000): Promise<void> {
        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkAPI = () => {
                const elapsed = Date.now() - startTime;

                // Check for various API patterns
                if (
                    (window as any).api_base ||
                    (window as any).DerivAPI ||
                    (window as any).WS ||
                    typeof (window as any).DerivAPIBasic !== 'undefined'
                ) {
                    console.log('✅ Deriv API script detected');
                    resolve();
                    return;
                }

                if (elapsed >= timeout) {
                    reject(new Error('Timeout waiting for Deriv API script'));
                    return;
                }

                setTimeout(checkAPI, 200);
            };

            checkAPI();
        });
    }

    /**
     * Create API instance using available methods
     */
    private async createAPIInstance(): Promise<APIInstance> {
        const windowAny = window as any;

        // Check for stored API token
        const storedToken = localStorage.getItem('deriv_api_token');

        // Method 1: Use existing api_base
        if (windowAny.api_base?.api) {
            console.log('🔧 Using existing api_base');

            // If we have a token, authorize the existing connection
            if (storedToken) {
                this.authorizeWithToken(windowAny.api_base.api, storedToken);
            }

            return windowAny.api_base.api;
        }

        // Method 2: Create from DerivAPI
        if (windowAny.DerivAPI) {
            console.log('🔧 Creating API from DerivAPI');
            const api = new windowAny.DerivAPI({
                app_id: this.config.appId,
                endpoint: this.config.endpoint,
                lang: this.config.language,
                brand: this.config.brand,
            });

            // If we have a token, authorize the connection
            if (storedToken) {
                this.authorizeWithToken(api, storedToken);
            }

            return api;
        }

        // Method 3: Create WebSocket-based API
        if (windowAny.WebSocket) {
            console.log('🔧 Creating WebSocket-based API');
            return this.createWebSocketAPI(storedToken);
        }

        throw new Error('No suitable API method available');
    }

    /**
     * Authorize API connection with token
     */
    private async authorizeWithToken(api: APIInstance, token: string): Promise<void> {
        try {
            console.log('🔐 Authorizing with API token...');
            const response = await api.send({ authorize: token });

            if (response.error) {
                console.error('❌ Token authorization failed:', response.error.message);
                localStorage.removeItem('deriv_api_token');
                throw new Error(response.error.message);
            }

            console.log('✅ Successfully authorized with token');
        } catch (error) {
            console.error('❌ Token authorization error:', error);
            localStorage.removeItem('deriv_api_token');
        }
    }

    /**
     * Create WebSocket-based API as fallback
     */
    private createWebSocketAPI(token?: string | null): APIInstance {
        return {
            send: (request: any) => {
                return new Promise((resolve, reject) => {
                    const wsUrl = `${this.config.endpoint}?app_id=${this.config.appId}&l=${this.config.language}&brand=${this.config.brand}`;
                    const ws = new WebSocket(wsUrl);

                    const timeout = setTimeout(() => {
                        ws.close();
                        reject(new Error('WebSocket request timeout'));
                    }, 15000);

                    let isAuthorized = false;

                    ws.onopen = () => {
                        // If token is provided, authorize first
                        if (token && !isAuthorized) {
                            ws.send(JSON.stringify({ authorize: token }));
                            isAuthorized = true;
                        } else {
                            ws.send(JSON.stringify(request));
                        }
                    };

                    ws.onmessage = event => {
                        try {
                            const response = JSON.parse(event.data);

                            // If this was an authorization response, send the actual request
                            if (response.msg_type === 'authorize' && !response.error) {
                                ws.send(JSON.stringify(request));
                                return;
                            }

                            clearTimeout(timeout);
                            ws.close();
                            resolve(response);
                        } catch {
                            clearTimeout(timeout);
                            ws.close();
                            reject(new Error('Invalid JSON response'));
                        }
                    };

                    ws.onerror = () => {
                        clearTimeout(timeout);
                        ws.close();
                        reject(new Error('WebSocket connection error'));
                    };
                });
            },
            isConnected: () => true, // Assume connected for WebSocket API
        };
    }

    /**
     * Test the API connection
     */
    private async testConnection(): Promise<void> {
        if (!this.apiInstance) {
            throw new Error('API instance not available');
        }

        console.log('🔍 Testing API connection...');

        try {
            const response = await Promise.race([
                this.apiInstance.send({ ping: 1 }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Connection test timeout')), 10000)),
            ]);

            if (response.error) {
                throw new Error(`API error: ${response.error.message}`);
            }

            console.log('✅ API connection test successful');
        } catch (error) {
            console.warn('⚠️ API connection test failed:', error);
            // Don't throw here - allow initialization to continue
        }
    }

    /**
     * Set up global access for backward compatibility
     */
    private setupGlobalAccess(): void {
        const windowAny = window as any;

        // Ensure api_base is available globally
        if (!windowAny.api_base) {
            windowAny.api_base = {
                api: this.apiInstance,
            };
        }

        // Also set up direct API access
        if (!windowAny.derivAPI) {
            windowAny.derivAPI = this.apiInstance;
        }

        console.log('🔧 Global API access configured');
    }

    /**
     * Create fallback API for graceful degradation
     */
    private createFallbackAPI(): void {
        console.log('🔧 Creating fallback API for graceful degradation');

        const fallbackAPI: APIInstance = {
            send: () => {
                console.warn('⚠️ Using fallback API - limited functionality');
                return Promise.reject(
                    new Error('Deriv API not available - please check your connection and try again')
                );
            },
            isConnected: () => false,
        };

        this.apiInstance = fallbackAPI;

        // Set up global fallback
        const windowAny = window as any;
        if (!windowAny.api_base) {
            windowAny.api_base = { api: fallbackAPI };
        }
    }

    /**
     * Get the current API instance
     */
    public getAPI(): APIInstance | null {
        return this.apiInstance;
    }

    /**
     * Check if API is initialized and ready
     */
    public isReady(): boolean {
        return this.isInitialized && this.apiInstance !== null;
    }

    /**
     * Check if API is currently connected
     */
    public isConnected(): boolean {
        if (!this.apiInstance) return false;

        if (typeof this.apiInstance.isConnected === 'function') {
            return this.apiInstance.isConnected();
        }

        return this.isInitialized;
    }

    /**
     * Add connection status listener
     */
    public addConnectionListener(callback: (connected: boolean) => void): () => void {
        this.connectionListeners.add(callback);

        // Immediately call with current status
        callback(this.isConnected());

        // Return unsubscribe function
        return () => {
            this.connectionListeners.delete(callback);
        };
    }

    /**
     * Notify all connection listeners
     */
    private notifyConnectionListeners(connected: boolean): void {
        this.connectionListeners.forEach(callback => {
            try {
                callback(connected);
            } catch (error) {
                console.error('Error in connection listener:', error);
            }
        });
    }

    /**
     * Reinitialize the API (useful for recovery)
     */
    public async reinitialize(): Promise<void> {
        console.log('🔄 Reinitializing Deriv API...');

        this.isInitialized = false;
        this.isInitializing = false;
        this.initPromise = null;
        this.apiInstance = null;

        await this.initialize();
    }

    /**
     * Reset the API state (alias for reinitialize for backward compatibility)
     */
    public async reset(): Promise<void> {
        return this.reinitialize();
    }

    /**
     * Get connection statistics
     */
    public getConnectionStats() {
        return {
            isInitialized: this.isInitialized,
            isInitializing: this.isInitializing,
            isConnected: this.isConnected(),
            hasAPI: this.apiInstance !== null,
            listenerCount: this.connectionListeners.size,
            config: this.config,
        };
    }

    /**
     * Wait for API to be ready
     */
    public async waitForReady(timeout: number = 20000): Promise<void> {
        if (this.isReady()) {
            return;
        }

        const startTime = Date.now();

        return new Promise((resolve, reject) => {
            const checkReady = () => {
                if (this.isReady()) {
                    resolve();
                    return;
                }

                const elapsed = Date.now() - startTime;
                if (elapsed >= timeout) {
                    reject(new Error('Timeout waiting for API to be ready'));
                    return;
                }

                setTimeout(checkReady, 100);
            };

            // Start initialization if not already started
            if (!this.isInitializing && !this.isInitialized) {
                this.initialize().catch(reject);
            }

            checkReady();
        });
    }
}

// Create and export singleton instance
export const derivAPIInitializer = DerivAPIInitializer.getInstance();

// Auto-initialize when module is loaded
if (typeof window !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            derivAPIInitializer.initialize().catch(error => {
                console.error('Auto-initialization failed:', error);
            });
        });
    } else {
        // DOM is already ready
        derivAPIInitializer.initialize().catch(error => {
            console.error('Auto-initialization failed:', error);
        });
    }
}

// Export types for TypeScript support
export type { APIInstance, DerivAPIConfig };
