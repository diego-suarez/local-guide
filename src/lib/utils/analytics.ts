import { browser } from '$app/environment';

// Declare gtag function for TypeScript
declare global {
	interface Window {
		gtag?: (
			command: 'config' | 'event' | 'js' | 'set',
			targetId: string | Date,
			config?: Record<string, any>
		) => void;
		dataLayer?: any[];
	}
}

let isGA4Initialized = false;

/**
 * Initialize Google Analytics 4
 * Loads the GA4 script and configures it with privacy-friendly settings
 */
export function initGA4(measurementId: string): void {
	if (!browser || !measurementId) return;

	// Prevent double initialization
	if (isGA4Initialized) return;

	// Initialize dataLayer
	if (!window.dataLayer) {
		window.dataLayer = [];
	}
	const dataLayer = window.dataLayer;
	window.gtag = function (...args: any[]) {
		dataLayer.push(args);
	};

	// Load the GA4 script
	const script = document.createElement('script');
	script.async = true;
	script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
	document.head.appendChild(script);

	// Configure GA4 with privacy-friendly settings
	window.gtag('js', new Date());
	window.gtag('config', measurementId, {
		anonymize_ip: true, // IP anonymization
		allow_google_signals: false, // Disable Google signals
		allow_ad_personalization_signals: false, // Disable ad personalization
		send_page_view: false // We'll send page views manually
	});

	isGA4Initialized = true;
}

/**
 * Track a page view
 */
export function trackPageViewGA4(pathname: string, measurementId: string): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	window.gtag('config', measurementId, {
		page_path: pathname,
		page_title: document.title
	});
}

/**
 * Track when a place popup is viewed
 */
export function trackPlaceView(placeTitle: string, category: string): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	window.gtag('event', 'place_view', {
		place_title: placeTitle,
		category: category
	});
}

/**
 * Track navigation clicks (Waze, Google Maps, Apple Maps, Instagram)
 */
export function trackNavigationClick(
	type: 'waze' | 'google-maps' | 'apple-maps' | 'instagram',
	placeTitle: string
): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	const eventName = `${type}_click`;
	window.gtag('event', eventName, {
		place_title: placeTitle,
		navigation_type: type
	});
}

/**
 * Track when a map marker is clicked
 */
export function trackMarkerClick(placeTitle: string, category: string): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	window.gtag('event', 'marker_click', {
		place_title: placeTitle,
		category: category
	});
}

/**
 * Track language changes
 */
export function trackLanguageChange(language: string): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	window.gtag('event', 'language_change', {
		language: language
	});
}

/**
 * Track when a location page is viewed
 */
export function trackLocationView(locationName: string): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	window.gtag('event', 'location_view', {
		location_name: locationName
	});
}

/**
 * Track when a place list item is expanded
 */
export function trackListExpand(placeTitle: string, category: string): void {
	if (!browser || !isGA4Initialized || !window.gtag) return;

	window.gtag('event', 'list_expand', {
		place_title: placeTitle,
		category: category
	});
}
