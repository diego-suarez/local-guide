export interface Location {
	id: string;
	name: string;
	country: string;
	description: string | { es: string; en: string; pt?: string };
	center: [number, number]; // [lat, lng]
}

export interface Category {
	icon: string;
	color: string;
}

export interface Place {
	id: string;
	title: string | { es: string; en: string; pt?: string };
	description: string | { es: string; en: string; pt?: string };
	category: string;
	coordinates: [number, number]; // [lat, lng]
	/**
	 * Optional Instagram profile for this place.
	 * Accepts either a full URL (https://www.instagram.com/<handle>/)
	 * or a handle (e.g. "@myplace" or "myplace").
	 */
	instagram?: string;
}

export interface Categories {
	[key: string]: Category;
}
