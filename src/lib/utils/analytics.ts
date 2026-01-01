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
 * Uses the standard GA4 implementation pattern with inline script + external script
 */
export function initGA4(measurementId: string): void {
	if (!browser || !measurementId) return;

	// Prevent double initialization
	if (isGA4Initialized) return;

	// Step 1: Create and inject the inline configuration script
	// This initializes dataLayer, defines gtag, and configures GA4
	const inlineScript = document.createElement('script');
	inlineScript.textContent = `
		window.dataLayer = window.dataLayer || [];
		function gtag(){dataLayer.push(arguments);}
		gtag('js', new Date());
		gtag('config', '${measurementId}', {
			anonymize_ip: true,
			allow_google_signals: false,
			allow_ad_personalization_signals: false,
			send_page_view: false
		});
	`;
	document.head.appendChild(inlineScript);

	// Step 2: Load the external GA4 script
	// This script will automatically process all events in dataLayer
	const externalScript = document.createElement('script');
	externalScript.async = true;
	externalScript.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
	
	externalScript.onload = () => {
		// The GA4 script has loaded and processed dataLayer
		// All queued events should now be sent
		console.log('GA4 script loaded and initialized');
	};
	
	externalScript.onerror = () => {
		console.error('Failed to load GA4 script');
	};
	
	document.head.appendChild(externalScript);

	isGA4Initialized = true;
}

/**
 * Track a page view
 */
export function trackPageViewGA4(pathname: string, measurementId: string): void {
	if (!browser || !isGA4Initialized) return;
	
	// gtag is defined globally by the inline script
	if (typeof window.gtag === 'function') {
		window.gtag('config', measurementId, {
			page_path: pathname,
			page_title: document.title
		});
	}
}

/**
 * Track when a place popup is viewed
 */
export function trackPlaceView(placeTitle: string, category: string): void {
	if (!browser || !isGA4Initialized) return;
	
	if (typeof window.gtag === 'function') {
		window.gtag('event', 'place_view', {
			place_title: placeTitle,
			category: category
		});
	}
}

/**
 * Track navigation clicks (Waze, Google Maps, Apple Maps, Instagram)
 */
export function trackNavigationClick(
	type: 'waze' | 'google-maps' | 'apple-maps' | 'instagram',
	placeTitle: string
): void {
	if (!browser || !isGA4Initialized) return;
	
	if (typeof window.gtag === 'function') {
		const eventName = `${type}_click`;
		window.gtag('event', eventName, {
			place_title: placeTitle,
			navigation_type: type
		});
	}
}

/**
 * Track when a map marker is clicked
 */
export function trackMarkerClick(placeTitle: string, category: string): void {
	if (!browser || !isGA4Initialized) return;
	
	if (typeof window.gtag === 'function') {
		window.gtag('event', 'marker_click', {
			place_title: placeTitle,
			category: category
		});
	}
}

/**
 * Track language changes
 */
export function trackLanguageChange(language: string): void {
	if (!browser || !isGA4Initialized) return;
	
	if (typeof window.gtag === 'function') {
		window.gtag('event', 'language_change', {
			language: language
		});
	}
}

/**
 * Track when a location page is viewed
 */
export function trackLocationView(locationName: string): void {
	if (!browser || !isGA4Initialized) return;
	
	if (typeof window.gtag === 'function') {
		window.gtag('event', 'location_view', {
			location_name: locationName
		});
	}
}

/**
 * Track when a place list item is expanded
 */
export function trackListExpand(placeTitle: string, category: string): void {
	if (!browser || !isGA4Initialized) return;
	
	if (typeof window.gtag === 'function') {
		window.gtag('event', 'list_expand', {
			place_title: placeTitle,
			category: category
		});
	}
}
