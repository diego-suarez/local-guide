export interface Location {
	id: string;
	name: string;
	country: string;
	description: string | { es: string; en: string };
	center: [number, number]; // [lat, lng]
}

export interface Category {
	icon: string;
	color: string;
}

export interface Place {
	id: string;
	title: string | { es: string; en: string };
	description: string | { es: string; en: string };
	category: string;
	coordinates: [number, number]; // [lat, lng]
}

export interface Categories {
	[key: string]: Category;
}
