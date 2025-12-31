import locationsData from './data/locations.json';
import type { Location } from './types';

export function loadLocations(): Location[] {
	return locationsData as Location[];
}

export function getLocationById(id: string): Location | undefined {
	return locationsData.find((loc) => loc.id === id) as Location | undefined;
}
