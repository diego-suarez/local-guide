/**
 * Analytics utility for tracking user interactions
 * Supports Google Analytics 4 (GA4)
 */

import { browser } from '$app/environment';

// Google Analytics 4
declare global {
	interface Window {
		gtag?: (...args: any[]) => void;
		dataLayer?: any[];
	}
}

/**
 * Initialize Google Analytics 4
 * Get your Measurement ID from: https://analytics.google.com/
 * Format: G-XXXXXXXXXX
 */
export function initGA4(measurementId: string) {
	if (!browser) return;

	// Load gtag script
	const script1 = document.createElement('script');
	script1.async = true;
	script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
	document.head.appendChild(script1);

	// Initialize dataLayer and gtag
	window.dataLayer = window.dataLayer || [];
	function gtag(...args: any[]) {
		window.dataLayer?.push(args);
	}
	window.gtag = gtag;

	gtag('js', new Date());
	gtag('config', measurementId, {
		// Privacy-friendly settings
		anonymize_ip: true,
		allow_google_signals: false,
		allow_ad_personalization_signals: false
	});
}

/**
 * Track a custom event in GA4
 */
export function trackEventGA4(eventName: string, eventParams?: Record<string, any>) {
	if (!browser || !window.gtag) return;
	window.gtag('event', eventName, eventParams);
}

/**
 * Track page view in GA4
 */
export function trackPageViewGA4(path: string, measurementId?: string) {
	if (!browser || !window.gtag) return;
	// GA4 automatically tracks page views, but we can send custom page_view events
	window.gtag('event', 'page_view', {
		page_path: path
	});
}

/**
 * Track navigation link clicks (Waze, Google Maps, etc.)
 * Uses beacon transport for external links to ensure tracking completes
 */
export function trackNavigationClick(service: 'waze' | 'google-maps' | 'apple-maps' | 'instagram', placeName?: string) {
	const eventData = {
		service,
		place_name: placeName || 'unknown'
	};

	// Track in GA4 with beacon transport for external links
	if (browser && window.gtag) {
		window.gtag('event', 'navigation_click', {
			...eventData,
			transport_type: 'beacon' // Ensures event is sent even if page unloads
		});
	}
}

/**
 * Track place popup open
 */
export function trackPlaceView(placeName: string, category: string) {
	const eventData = {
		place_name: placeName,
		category
	};

	trackEventGA4('place_view', eventData);
}

/**
 * Track location page view
 */
export function trackLocationView(locationName: string) {
	const eventData = {
		location_name: locationName
	};

	trackEventGA4('location_view', eventData);
}

/**
 * Track language change
 */
export function trackLanguageChange(language: string) {
	const eventData = {
		language
	};

	trackEventGA4('language_change', eventData);
}

/**
 * Track map marker click
 */
export function trackMarkerClick(placeName: string, category: string) {
	const eventData = {
		place_name: placeName,
		category,
		interaction_type: 'map'
	};

	trackEventGA4('marker_click', eventData);
}

/**
 * Track list view place expansion
 */
export function trackListExpand(placeName: string, category: string) {
	const eventData = {
		place_name: placeName,
		category,
		interaction_type: 'list'
	};

	trackEventGA4('list_expand', eventData);
}
