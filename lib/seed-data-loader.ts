// Dynamic Seed Data Loader

import { MachinerySelection } from './machinery-config';

const STORAGE_KEY = 'naval-predictions-selection';

/**
 * Build API URL for loading seed data
 */
export function buildSeedDataUrl(
    ship: string,
    machineryType: string,
    model: string
): string {
    return `/api/seed-data?ship=${encodeURIComponent(ship)}&machineryType=${encodeURIComponent(machineryType)}&model=${encodeURIComponent(model)}`;
}

/**
 * Load seed data from API
 */
export async function loadSeedData(
    ship: string,
    machineryType: string,
    model: string
): Promise<any[]> {
    const url = buildSeedDataUrl(ship, machineryType, model);

    try {
        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to load seed data: ${response.statusText}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Seed data must be an array');
        }

        console.log(`✅ Loaded ${data.length} records for ${ship} - ${machineryType} (${model})`);
        return data;
    } catch (error) {
        console.error(`❌ Error loading seed data:`, error);
        throw error;
    }
}

/**
 * Save current selection to localStorage
 */
export function saveSelection(selection: MachinerySelection): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(selection));
    }
}

/**
 * Load current selection from localStorage
 */
export function loadSelection(): MachinerySelection | null {
    if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (error) {
                console.error('Failed to parse stored selection:', error);
                return null;
            }
        }
    }
    return null;
}

/**
 * Clear stored selection
 */
export function clearSelection(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
    }
}
