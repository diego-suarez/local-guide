<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { language } from '$lib/i18n';
	import type { Language } from '$lib/i18n';
	import { popupPlace } from '$lib/stores/popup';
	import type { Place } from '$lib/types';
	import { getPlaceText } from '$lib/utils/i18n';
	import esTranslations from '$lib/i18n/translations/es.json';
	import enTranslations from '$lib/i18n/translations/en.json';
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

			const marker = L.marker([place.coordinates[0], place.coordinates[1]], { 
				icon,
				riseOnHover: false,
				zIndexOffset: 1000
			})
				.addTo(map)
				.bindTooltip(tooltip);

			marker.on('click', (e: any) => {
				e?.originalEvent?.stopPropagation?.();
				selectedPlace = place; // Keep for highlighting
				popupPlace.set(place); // Show custom popup via store
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

</style>
