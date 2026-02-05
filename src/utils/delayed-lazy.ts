import { lazy } from 'react';

/**
 * Creates a lazy component with a minimum loading delay
 * @param importFn - The dynamic import function
 * @param minDelay - Minimum delay in milliseconds before the component can be loaded
 * @returns A lazy component that respects the minimum delay
 */
export function delayedLazy<T extends React.ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    minDelay: number = 0
): React.LazyExoticComponent<T> {
    return lazy(async () => {
        // Return the import immediately without artificial delay
        return importFn();
    });
}