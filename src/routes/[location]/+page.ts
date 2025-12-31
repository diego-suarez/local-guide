import { error } from '@sveltejs/kit';
import { getLocationById } from '$lib/utils';
import type { PageLoad, EntryGenerator } from './$types';
import piriapolisData from '$lib/data/piriapolis.json';
import locationsData from '$lib/data/locations.json';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return locationsData.map((loc) => ({ location: loc.id }));
};

export const load: PageLoad = async ({ params }) => {
	const location = getLocationById(params.location);
	
	if (!location) {
		throw error(404, 'Location not found');
	}

	// Load location-specific places data
	let places = [];
	if (params.location === 'piriapolis') {
		places = piriapolisData;
	}

	return {
		location,
		places
	};
};
