<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { language } from '$lib/i18n';
	import { getPlaceText } from '$lib/utils/i18n';
	import type { Place } from '$lib/types';

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
	let currentLang = $state(language);
	let isInitialLoad = $state(true);

	language.subscribe((value) => {
		currentLang = value;
	});

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

	function createCustomIcon(category: string, color: string, iconName: string) {
		const iconPath = iconPaths[iconName] || '';
		const bgColor = hexToRgba(color, 0.2); // Increased opacity from 0.2 to 0.5 for better visibility
		
		// Create square marker matching filter style: rounded-lg, colored background, border
		const markerHtml = `
			<div style="
				width: 32px;
				height: 32px;
				border-radius: 6px;
				background-color: ${bgColor};
				border: 2px solid ${color};
				display: flex;
				align-items: center;
				justify-content: center;
				box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
			">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					${iconPath}
				</svg>
			</div>
		`;

		return L.divIcon({
			className: 'custom-marker',
			html: markerHtml,
			iconSize: [32, 32],
			iconAnchor: [16, 16], // Center of marker (both horizontally and vertically)
			popupAnchor: [0, -24] // Position tooltip above marker center
		});
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
			
			// Create tooltip positioned above the marker to avoid overlay
			const tooltip = L.tooltip({
				className: 'custom-tooltip',
				direction: 'top',
				permanent: false,
				interactive: false
			}).setContent(`<div class="font-semibold text-gray-800 text-sm">${placeTitle}</div>`);

			const marker = L.marker([place.coordinates[0], place.coordinates[1]], { 
				icon,
				riseOnHover: true,
				zIndexOffset: 1000
			})
				.addTo(map)
				.bindTooltip(tooltip)
				.on('click', function(e) {
					e.originalEvent.stopPropagation();
					selectedPlace = place;
					// Smooth scroll to details if on mobile
					if (browser && window.innerWidth < 768) {
						document.getElementById('place-details')?.scrollIntoView({ behavior: 'smooth' });
					}
				})
				.on('mouseover', function () {
					this.openTooltip();
					// Increase z-index on hover for better clickability
					this.setZIndexOffset(2000);
				})
				.on('mouseout', function () {
					this.closeTooltip();
					this.setZIndexOffset(1000);
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

		// Highlight selected place (but don't override initial bounds fit)
		if (selectedPlace && markers.has(selectedPlace.id) && !isInitialLoad) {
			const marker = markers.get(selectedPlace.id);
			if (marker) {
				marker.getElement()?.classList.add('marker-selected');
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

	:global(.leaflet-marker-icon) {
		cursor: pointer !important;
	}

	:global(.marker-selected) {
		filter: drop-shadow(0 0 12px rgba(59, 130, 246, 0.9));
		z-index: 2000 !important;
	}

	:global(.custom-tooltip) {
		font-family: 'Inter', sans-serif;
		padding: 6px 10px;
		border-radius: 6px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
		background: white;
		border: 1px solid rgba(0, 0, 0, 0.1);
		font-size: 13px;
		white-space: nowrap;
		pointer-events: none; /* Prevent tooltip from blocking marker clicks */
		margin-bottom: 12px !important; /* Add spacing between tooltip and marker */
	}

	:global(.leaflet-tooltip-top) {
		margin-top: 0 !important;
	}

	:global(.leaflet-tooltip-top:before) {
		border-top-color: white;
	}

	:global(.leaflet-tooltip-bottom:before) {
		border-bottom-color: white;
	}

	:global(.leaflet-tooltip-left:before) {
		border-left-color: white;
	}

	:global(.leaflet-tooltip-right:before) {
		border-right-color: white;
	}
</style>
