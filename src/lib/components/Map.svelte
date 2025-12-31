<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { language } from '$lib/i18n';
	import type { Language } from '$lib/i18n';
	import { getPlaceText } from '$lib/utils/i18n';
	import type { Place } from '$lib/types';
	import { normalizeInstagramUrl } from '$lib/utils/links';
	import enTranslations from '$lib/i18n/translations/en.json';
	import esTranslations from '$lib/i18n/translations/es.json';
	import ptTranslations from '$lib/i18n/translations/pt.json';

	// Helper functions to generate navigation URLs
	function getWazeUrl(lat: number, lng: number): string {
		return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
	}

	function getGoogleMapsUrl(lat: number, lng: number): string {
		return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
	}

	function getAppleMapsUrl(lat: number, lng: number): string {
		return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
	}

	interface Props {
		center: [number, number];
		places: Place[];
		selectedPlace: Place | null;
		visibleCategories: Set<string>;
		categories: Record<string, { icon: string; color: string }>;
	}

	let {
		center,
		places,
		selectedPlace = $bindable(),
		visibleCategories,
		categories
	}: Props = $props();

	let mapContainer: HTMLDivElement;
	let map: any;
	let markers: Map<string, any> = new Map();
	let L: any;
	let currentLang = $state<Language>('es');
	let isInitialLoad = $state(true);

	language.subscribe((value) => {
		currentLang = value;
	});

	const translationsByLang = {
		es: esTranslations,
		en: enTranslations,
		pt: ptTranslations
	} as const;

	// Icon SVG paths mapping (matching lucide-svelte icons)
	const iconPaths: Record<string, string> = {
		activity: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />',
		mountain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z" />',
		utensils: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />',
		music: '<path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />',
		waves: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" /><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />',
		trees: '<path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" /><path d="M7 16v6" /><path d="M13 19v3" /><path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />',
		building: '<path d="M12 10h.01" /><path d="M12 14h.01" /><path d="M12 6h.01" /><path d="M16 10h.01" /><path d="M16 14h.01" /><path d="M16 6h.01" /><path d="M8 10h.01" /><path d="M8 14h.01" /><path d="M8 6h.01" /><path d="M9 22v-3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /><rect x="4" y="2" width="16" height="20" rx="2" />',
		eye: '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" />'
	};

	// Helper to get category translation
	function getCategoryTranslation(categoryKey: string): string {
		const translations = translationsByLang[currentLang] ?? translationsByLang.es;
		return translations.categories[categoryKey as keyof typeof translations.categories] || categoryKey;
	}

	// Create modern popup HTML for place details
	function createPopupContent(place: Place, category: { icon: string; color: string }): string {
		const translations = translationsByLang[currentLang] ?? translationsByLang.es;
		const iconPath = iconPaths[category.icon] || '';
		const placeTitle = getPlaceText(place, 'title');
		const placeDescription = getPlaceText(place, 'description');
		const categoryName = getCategoryTranslation(place.category);
		const [lat, lng] = place.coordinates;
		const goToLabel = translations.common.goTo;
		const categoryLabel = translations.common.category;
		const instagramUrl = place.instagram ? normalizeInstagramUrl(place.instagram) : null;
		const instagramLabel = translations.common.instagram ?? 'Instagram';
		
		return `
			<div class="modern-popup">
				<!-- Fixed header section -->
				<div class="popup-fixed-header">
					<!-- Header with category badge -->
					<div class="popup-header" style="border-color: ${category.color};">
						<div class="popup-category-badge" style="background: ${hexToRgba(category.color, 0.15)}; border-color: ${category.color};">
							<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${category.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
								${iconPath}
							</svg>
						</div>
						<div class="popup-category-info">
							<div class="popup-category-label">${categoryLabel}</div>
							<div class="popup-category-name" style="color: ${category.color};">${categoryName}</div>
						</div>
					</div>
					
					<!-- Title -->
					<h3 class="popup-title">${placeTitle}</h3>
				</div>
				
				<!-- Scrollable description section -->
				<div class="popup-scrollable-content">
					<p class="popup-description">${placeDescription}</p>
					
					<!-- Navigation Links -->
					<div class="popup-navigation">
						<div class="popup-navigation-label">${goToLabel}</div>
						<div class="popup-navigation-links">
							<a href="${getWazeUrl(lat, lng)}" target="_blank" rel="noopener noreferrer" class="nav-text-link">Waze</a>
							<a href="${getGoogleMapsUrl(lat, lng)}" target="_blank" rel="noopener noreferrer" class="nav-text-link">Google Maps</a>
							<a href="${getAppleMapsUrl(lat, lng)}" target="_blank" rel="noopener noreferrer" class="nav-text-link">Apple Maps</a>
							${instagramUrl ? `<a href="${instagramUrl}" target="_blank" rel="noopener noreferrer" class="nav-text-link">${instagramLabel}</a>` : ''}
						</div>
					</div>
				</div>
			</div>
		`;
	}

	// Create modern floating label tooltip
	function createFloatingLabel(title: string, color: string): string {
		return `
			<div class="floating-label" style="--label-color: ${color};">
				<div class="floating-label-content">
					${title}
				</div>
				<div class="floating-label-arrow"></div>
			</div>
		`;
	}

	function createCustomIcon(category: string, color: string, iconName: string) {
		const iconPath = iconPaths[iconName] || '';
		
		// Modern pill-shaped marker with pin point - state-of-the-art design
		// Using solid background with gradient for better visibility and modern look
		const markerHtml = `
			<div class="modern-marker-wrapper" style="
				position: relative;
				width: 40px;
				height: 40px;
				display: flex;
				align-items: center;
				justify-content: center;
				transform-origin: center bottom;
			">
				<!-- Main marker body - pill shape -->
				<div class="modern-marker-body" style="
					width: 40px;
					height: 40px;
					border-radius: 20px 20px 20px 4px;
					background: linear-gradient(135deg, ${color}, ${adjustColorBrightness(color, -20)});
					border: 2px solid ${color};
					display: flex;
					align-items: center;
					justify-content: center;
					box-shadow: 
						0 4px 12px rgba(0, 0, 0, 0.3),
						0 0 20px ${hexToRgba(color, 0.4)},
						inset 0 1px 0 rgba(255, 255, 255, 0.2);
					transform: rotate(-45deg);
					transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
					position: relative;
					overflow: visible;
				">
					<!-- Inner glow effect -->
					<div style="
						position: absolute;
						inset: 2px;
						border-radius: 18px 18px 18px 2px;
						background: ${hexToRgba(color, 0.15)};
						pointer-events: none;
					"></div>
					<!-- Icon rotated back to upright -->
					<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transform: rotate(45deg); filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));">
						${iconPath}
					</svg>
				</div>
				<!-- Pin point shadow -->
				<div style="
					position: absolute;
					bottom: -6px;
					left: 50%;
					transform: translateX(-50%) rotate(45deg);
					width: 12px;
					height: 12px;
					background: ${color};
					border-radius: 0 0 2px 0;
					box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
					z-index: -1;
				"></div>
			</div>
		`;

		return L.divIcon({
			className: 'custom-marker',
			html: markerHtml,
			iconSize: [40, 40],
			iconAnchor: [20, 36], // Anchor at the pin point
			popupAnchor: [0, -40] // Position tooltip above marker
		});
	}

	// Helper function to adjust color brightness
	function adjustColorBrightness(hex: string, percent: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		
		const newR = Math.max(0, Math.min(255, r + (r * percent / 100)));
		const newG = Math.max(0, Math.min(255, g + (g * percent / 100)));
		const newB = Math.max(0, Math.min(255, b + (b * percent / 100)));
		
		return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`;
	}

	// Helper function to convert hex to rgba
	function hexToRgba(hex: string, alpha: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	function updateMarkers() {
		if (!map || !L) return;

		// Remove all existing markers
		markers.forEach((marker) => {
			map.removeLayer(marker);
		});
		markers.clear();

		// Collect visible places for bounds calculation
		const visiblePlaces: Place[] = [];

		// Add visible markers
		places.forEach((place) => {
			if (!visibleCategories.has(place.category)) return;

			const category = categories[place.category];
			if (!category) return;

			visiblePlaces.push(place);

			const icon = createCustomIcon(place.category, category.color, category.icon);
			const placeTitle = getPlaceText(place, 'title');
			
			// Create modern floating label tooltip
			const tooltip = L.tooltip({
				className: 'floating-label-tooltip',
				direction: 'top',
				permanent: false,
				interactive: false,
				offset: [0, -50] // Position well above marker
			}).setContent(createFloatingLabel(placeTitle, category.color));

			// Create modern popup for place details
			// Responsive max width based on screen size
			const isMobile = browser && window.innerWidth < 768;
			const popup = L.popup({
				className: 'modern-popup-container',
				maxWidth: isMobile ? Math.min(window.innerWidth - 40, 320) : 400,
				closeButton: true,
				autoPan: true,
				// More padding on mobile to ensure close button and content are visible
				autoPanPadding: isMobile ? [80, 20] : [50, 50]
			}).setContent(createPopupContent(place, category));

			const marker = L.marker([place.coordinates[0], place.coordinates[1]], { 
				icon,
				riseOnHover: false,
				zIndexOffset: 1000
			})
				.addTo(map)
				.bindTooltip(tooltip)
				.bindPopup(popup);

			marker.on('click', (e: any) => {
				e?.originalEvent?.stopPropagation?.();
				selectedPlace = place; // Keep for highlighting
				marker.openPopup();
			});
			marker.on('mouseover', () => {
				marker.openTooltip();
				marker.setZIndexOffset(2000);
			});
			marker.on('mouseout', () => {
				marker.closeTooltip();
				// Only reset z-index if not selected
				if (!selectedPlace || selectedPlace.id !== place.id) {
					marker.setZIndexOffset(1000);
				}
			});

			markers.set(place.id, marker);
		});

		// Fit bounds to show all markers on initial load
		if (isInitialLoad && visiblePlaces.length > 0) {
			const bounds = L.latLngBounds(
				visiblePlaces.map(place => [place.coordinates[0], place.coordinates[1]])
			);
			
			// Add padding to bounds (in pixels)
			map.fitBounds(bounds, {
				padding: [50, 50],
				maxZoom: 15,
				animate: true,
				duration: 0.8
			});
			
			isInitialLoad = false;
		}

		// Remove selected class from all markers first
		markers.forEach((marker) => {
			marker.getElement()?.classList.remove('marker-selected');
			// Reset z-index for non-selected markers
			marker.setZIndexOffset(1000);
		});

		// Highlight selected place (but don't override initial bounds fit)
		if (selectedPlace && markers.has(selectedPlace.id) && !isInitialLoad) {
			const marker = markers.get(selectedPlace.id);
			if (marker) {
				const category = categories[selectedPlace.category];
				const markerElement = marker.getElement();
				if (markerElement && category) {
					markerElement.classList.add('marker-selected');
					// Add color as CSS variable for glow effect
					markerElement.style.setProperty('--marker-color', category.color);
					// Ensure selected marker is on top
					marker.setZIndexOffset(3000);
				}
				map.setView([selectedPlace.coordinates[0], selectedPlace.coordinates[1]], 14, {
					animate: true,
					duration: 0.5
				});
			}
		}
	}

	onMount(async () => {
		if (!browser) return;

		// Dynamically import Leaflet only on client
		L = (await import('leaflet')).default;
		await import('leaflet/dist/leaflet.css');

		map = L.map(mapContainer, {
			center,
			zoom: 13,
			zoomControl: true,
			attributionControl: true
		});

		L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
			attribution: '© OpenStreetMap contributors',
			maxZoom: 19
		}).addTo(map);

		// Wait for map to be ready, then add markers
		map.whenReady(() => {
			updateMarkers();
		});
	});

	// Update markers when places, visibleCategories, categories, or language change
	$effect(() => {
		// Access reactive values to track them
		const _places = places;
		const _visibleCategories = visibleCategories;
		const _categories = categories;
		const _lang = currentLang;
		
		if (map && L) {
			updateMarkers();
			// Invalidate size to ensure markers are visible
			setTimeout(() => {
				map.invalidateSize();
			}, 100);
		}
	});

	onDestroy(() => {
		if (map) {
			map.remove();
		}
	});
</script>

<div bind:this={mapContainer} class="w-full h-full min-h-[500px] rounded-2xl overflow-hidden shadow-2xl"></div>

<style>
	:global(.custom-marker) {
		background: transparent !important;
		border: none !important;
		cursor: pointer !important;
		pointer-events: auto !important;
	}

	/* Apply transforms to the wrapper, not the Leaflet container */
	:global(.custom-marker .modern-marker-wrapper) {
		transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
		transform-origin: center bottom !important;
	}

	:global(.custom-marker:hover .modern-marker-wrapper) {
		transform: scale(1.15) translateY(-2px) !important;
	}

	:global(.custom-marker:hover .modern-marker-body) {
		box-shadow: 
			0 6px 20px rgba(0, 0, 0, 0.4),
			0 0 30px rgba(0, 255, 255, 0.6),
			inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
	}

	:global(.leaflet-marker-icon) {
		cursor: pointer !important;
	}

	:global(.marker-selected .modern-marker-wrapper) {
		transform: scale(1.2) translateY(-3px) !important;
	}

	:global(.marker-selected .modern-marker-body) {
		box-shadow: 
			0 8px 24px rgba(0, 0, 0, 0.5),
			0 0 40px var(--marker-color, #00ffff),
			inset 0 1px 0 rgba(255, 255, 255, 0.4) !important;
		animation: pulse-glow 2s ease-in-out infinite !important;
	}

	/* Modern floating label tooltip */
	:global(.floating-label-tooltip) {
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
		padding: 0 !important;
		margin: 0 !important;
		pointer-events: none !important;
	}

	:global(.floating-label-tooltip .floating-label) {
		position: relative;
		display: inline-block;
	}

	:global(.floating-label-tooltip .floating-label-content) {
		background: linear-gradient(135deg, #12121c, #1a1a28);
		border: 2px solid var(--label-color, #00ffff);
		border-radius: 8px;
		padding: 8px 14px;
		font-size: 13px;
		font-weight: 600;
		color: #f0f0f0;
		white-space: nowrap;
		box-shadow: 
			0 4px 12px rgba(0, 0, 0, 0.4),
			0 0 20px var(--label-color, #00ffff);
		backdrop-filter: blur(10px);
		transform: translateY(-2px);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}

	:global(.floating-label-tooltip .floating-label-arrow) {
		position: absolute;
		bottom: -8px;
		left: 50%;
		transform: translateX(-50%) rotate(45deg);
		width: 12px;
		height: 12px;
		background: #12121c;
		border-right: 2px solid var(--label-color, #00ffff);
		border-bottom: 2px solid var(--label-color, #00ffff);
		box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
	}

	/* Modern popup styles */
	:global(.modern-popup-container) {
		background: transparent !important;
		border: none !important;
		box-shadow: none !important;
	}

	/* Ensure popup doesn't overflow viewport on mobile */
	@media (max-width: 768px) {
		:global(.leaflet-popup) {
			max-width: calc(100vw - 20px) !important;
		}
	}

	:global(.modern-popup-container .leaflet-popup-content-wrapper) {
		background: #12121c !important;
		border: 2px solid #282837 !important;
		border-radius: 0 !important;
		padding: 0 !important;
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(0, 255, 255, 0.2) !important;
		max-width: 100vw !important;
	}

	@media (max-width: 768px) {
		:global(.modern-popup-container .leaflet-popup-content-wrapper) {
			max-width: calc(100vw - 20px) !important;
			margin: 10px !important;
		}
	}

	:global(.modern-popup-container .leaflet-popup-content) {
		margin: 0 !important;
		padding: 0 !important;
		width: auto !important;
		min-width: 280px;
		max-width: 400px;
	}

	@media (max-width: 768px) {
		:global(.modern-popup-container .leaflet-popup-content) {
			min-width: calc(100vw - 40px) !important;
			max-width: calc(100vw - 40px) !important;
		}
	}

	:global(.modern-popup) {
		display: flex;
		flex-direction: column;
		max-height: min(70vh, 500px);
		color: #f0f0f0;
		font-family: 'Poppins', sans-serif;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		:global(.modern-popup) {
			max-height: min(75vh, 500px);
		}
	}

	:global(.popup-fixed-header) {
		padding: 24px 24px 0 24px;
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		:global(.popup-fixed-header) {
			padding: 16px 16px 0 16px;
		}
	}

	:global(.popup-header) {
		display: flex;
		align-items: center;
		gap: 16px;
		padding-bottom: 20px;
		border-bottom: 1px solid #282837;
		margin-bottom: 20px;
	}

	@media (max-width: 768px) {
		:global(.popup-header) {
			gap: 12px;
			padding-bottom: 16px;
			margin-bottom: 16px;
		}
	}

	:global(.popup-category-badge) {
		width: 48px;
		height: 48px;
		border-radius: 8px;
		border: 2px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		box-shadow: 0 0 15px currentColor;
	}

	@media (max-width: 768px) {
		:global(.popup-category-badge) {
			width: 40px;
			height: 40px;
		}
	}

	:global(.popup-category-info) {
		flex: 1;
	}

	:global(.popup-category-label) {
		font-size: 11px;
		font-weight: 500;
		color: #a0a0b0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	:global(.popup-category-name) {
		font-size: 16px;
		font-weight: 600;
	}

	:global(.popup-title) {
		font-size: 24px;
		font-weight: 700;
		color: #f0f0f0;
		margin: 0 0 0 0;
		line-height: 1.3;
		letter-spacing: -0.01em;
		padding-bottom: 20px;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	@media (max-width: 768px) {
		:global(.popup-title) {
			font-size: 20px;
			padding-bottom: 16px;
		}
	}

	:global(.popup-scrollable-content) {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: 20px 24px 24px 24px;
		/* Custom scrollbar styling */
		scrollbar-width: thin;
		scrollbar-color: #282837 #12121c;
	}

	@media (max-width: 768px) {
		:global(.popup-scrollable-content) {
			padding: 16px 16px 16px 16px;
		}
	}

	:global(.popup-scrollable-content::-webkit-scrollbar) {
		width: 8px;
	}

	:global(.popup-scrollable-content::-webkit-scrollbar-track) {
		background: #12121c;
	}

	:global(.popup-scrollable-content::-webkit-scrollbar-thumb) {
		background: #282837;
		border-radius: 4px;
	}

	:global(.popup-scrollable-content::-webkit-scrollbar-thumb:hover) {
		background: #00ffff;
		box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
	}

	:global(.popup-description) {
		font-size: 15px;
		line-height: 1.7;
		color: #a0a0b0;
		margin: 0 0 24px 0;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	@media (max-width: 768px) {
		:global(.popup-description) {
			font-size: 14px;
			line-height: 1.6;
			margin-bottom: 20px;
		}
	}

	:global(.popup-navigation) {
		margin-top: 24px;
		padding-top: 24px;
		border-top: 1px solid #282837;
	}

	:global(.popup-navigation-label) {
		font-size: 11px;
		font-weight: 500;
		color: #a0a0b0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 16px;
	}

	:global(.popup-navigation-links) {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	:global(.nav-text-link) {
		display: inline-block;
		padding: 6px 12px;
		border: 1px solid #282837;
		background: #08080c;
		color: #a0a0b0;
		font-size: 12px;
		font-weight: 500;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		border-radius: 6px;
		white-space: nowrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	:global(.nav-text-link:hover) {
		border-color: #00ffff;
		background: rgba(0, 255, 255, 0.1);
		color: #00ffff;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2);
	}

	@media (max-width: 768px) {
		:global(.popup-navigation) {
			margin-top: 20px;
			padding-top: 20px;
		}

		:global(.popup-navigation-links) {
			gap: 6px;
		}

		:global(.nav-text-link) {
			font-size: 11px;
			padding: 5px 10px;
			white-space: normal;
		}
	}

	:global(.modern-popup-container .leaflet-popup-close-button) {
		color: #a0a0b0 !important;
		font-size: 24px !important;
		width: 32px !important;
		height: 32px !important;
		line-height: 32px !important;
		text-align: center !important;
		transition: all 0.3s !important;
		z-index: 1000 !important;
		position: absolute !important;
		top: 8px !important;
		right: 8px !important;
	}

	:global(.modern-popup-container .leaflet-popup-close-button:hover) {
		color: #00ffff !important;
		background: rgba(0, 255, 255, 0.1) !important;
	}

	@media (max-width: 768px) {
		:global(.modern-popup-container .leaflet-popup-close-button) {
			width: 40px !important;
			height: 40px !important;
			line-height: 40px !important;
			font-size: 28px !important;
			top: 4px !important;
			right: 4px !important;
			/* Ensure close button is always visible and tappable */
			background: rgba(18, 18, 28, 0.9) !important;
			border: 1px solid #282837 !important;
		}
	}

	:global(.modern-popup-container .leaflet-popup-tip) {
		background: #12121c !important;
		border: 2px solid #282837 !important;
		border-top: none !important;
		border-left: none !important;
		box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3) !important;
	}
</style>
