export class NetworkTimeoutHandler {
    async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
        let timeoutId: NodeJS.Timeout;
        const timeoutPromise = new Promise<T>((_, reject) => {
            timeoutId = setTimeout(() => {
                reject(new Error('Operation timed out'));
            }, timeoutMs);
        });

        try {
            const result = await Promise.race([promise, timeoutPromise]);
            return result;
        } finally {
            // @ts-expect-error - timeoutId might be undefined but clearTimeout handles it gracefully
            if (timeoutId) clearTimeout(timeoutId);
        }
    }
}

export const networkTimeoutHandler = new NetworkTimeoutHandler();
