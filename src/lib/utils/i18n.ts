import { language } from '../i18n';
import { get } from 'svelte/store';
import type { Place, Location } from '../types';

export function getPlaceText(place: Place, field: 'title' | 'description'): string {
	const lang = get(language);
	const value = place[field];
	
	if (typeof value === 'string') {
		return value;
	}
	
	return value[lang] || value.es || '';
}

export function getLocationDescription(location: Location): string {
	const lang = get(language);
	const value = location.description;
	
	if (typeof value === 'string') {
		return value;
	}
	
	return value[lang] || value.es || '';
}
