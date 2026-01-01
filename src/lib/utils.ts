import locationsData from './data/locations.json';
import type { Location } from './types';

export function loadLocations(): Location[] {
	return locationsData as Location[];
}

export function getLocationById(id: string): Location | undefined {
	return locationsData.find((loc) => loc.id === id) as Location | undefined;
}

/**
 * Get the cover image path for a place
 * @param placeId - The ID of the place
 * @param basePath - Optional base path (from $app/paths). Defaults to '/local-guide'
 * @returns The path to the cover image
 */
export function getCoverImagePath(placeId: string, basePath: string = '/local-guide'): string {
	return `${basePath}/covers/${placeId}.jpg`;
}
