<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { popupPlace } from '$lib/stores/popup';
	import { language } from '$lib/i18n';
	import type { Language } from '$lib/i18n';
	import { getPlaceText } from '$lib/utils/i18n';
	import type { Place } from '$lib/types';
	import { normalizeInstagramUrl } from '$lib/utils/links';
	import { getCoverImagePath } from '$lib/utils';
	import { base } from '$app/paths';
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

	// Helper function to convert hex to rgba
	function hexToRgba(hex: string, alpha: number): string {
		const r = parseInt(hex.slice(1, 3), 16);
		const g = parseInt(hex.slice(3, 5), 16);
		const b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	interface Props {
		categories: Record<string, { icon: string; color: string }>;
	}

	let { categories }: Props = $props();

	// Translations map at module level to ensure imports are used
	const translationsByLang = {
		es: esTranslations,
		en: enTranslations,
		pt: ptTranslations
	};

	let currentPlace = $state<Place | null>(null);
	let currentLang = $state<Language>('es');

	// Subscribe to popup store
	popupPlace.subscribe((place) => {
		currentPlace = place;
	});

	language.subscribe((value) => {
		currentLang = value;
	});

	// Get current translations reactively
	const currentTranslations = $derived.by(() => {
		return translationsByLang[currentLang] || translationsByLang.es;
	});

	// Helper to get category translation
	function getCategoryTranslation(categoryKey: string, categories: Record<string, { icon: string; color: string }>, lang: Language): string {
		const translations = translationsByLang[lang] || translationsByLang.es;
		return translations.categories[categoryKey as keyof typeof translations.categories] || categoryKey;
	}

	// Icon SVG paths mapping
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

	function closePopup() {
		popupPlace.set(null);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			closePopup();
		}
	}

	// Lock body scroll when popup is open
	$effect(() => {
		if (currentPlace && browser) {
			document.body.style.overflow = 'hidden';
		} else if (browser) {
			document.body.style.overflow = '';
		}
	});
</script>

{#if currentPlace}
	{@const category = categories[currentPlace.category]}
	{@const iconPath = iconPaths[category?.icon || ''] || ''}
	{@const placeTitle = getPlaceText(currentPlace, 'title')}
	{@const placeDescription = getPlaceText(currentPlace, 'description')}
	{@const categoryName = getCategoryTranslation(currentPlace.category, categories, currentLang)}
	{@const [lat, lng] = currentPlace.coordinates}
	{@const goToLabel = currentTranslations.common.goTo}
	{@const categoryLabel = currentTranslations.common.category}
	{@const instagramUrl = currentPlace.instagram ? normalizeInstagramUrl(currentPlace.instagram) : null}
	{@const instagramLabel = currentTranslations.common.instagram ?? 'Instagram'}
	{@const coverImagePath = getCoverImagePath(currentPlace.id, base)}
	
	<div class="popup-overlay" on:click={closePopup} role="button" tabindex="0" on:keydown={handleKeydown}>
		<div class="popup-container" on:click|stopPropagation role="dialog" aria-modal="true" aria-labelledby="popup-title">
			<button class="popup-close-button" on:click={closePopup} aria-label="Close">
				×
			</button>
			
			<div class="modern-popup">
				<!-- Fixed header section -->
				<div class="popup-fixed-header">
					<!-- Header with category badge -->
					{#if category}
						<div class="popup-header" style="border-color: {category.color};">
							<div class="popup-category-badge" style="background: {hexToRgba(category.color, 0.15)}; border-color: {category.color};">
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="{category.color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
									{@html iconPath}
								</svg>
							</div>
							<div class="popup-category-info">
								<div class="popup-category-label">{categoryLabel}</div>
								<div class="popup-category-name" style="color: {category.color};">{categoryName}</div>
							</div>
						</div>
					{/if}
					
					<!-- Title -->
					<h3 class="popup-title" id="popup-title">{placeTitle}</h3>
				</div>
				
				<!-- Scrollable description section with cover image background -->
				<div class="popup-scrollable-content" style="background-image: url('{coverImagePath}');">
					<div class="popup-content-gradient"></div>
					<div class="popup-content-inner">
						<!-- Navigation Links -->
						<div class="popup-navigation">
							<div class="popup-navigation-label">{goToLabel}</div>
							<div class="popup-navigation-links">
								<a href={getWazeUrl(lat, lng)} target="_blank" rel="noopener noreferrer" class="nav-text-link">Waze</a>
								<a href={getGoogleMapsUrl(lat, lng)} target="_blank" rel="noopener noreferrer" class="nav-text-link">Google Maps</a>
								<a href={getAppleMapsUrl(lat, lng)} target="_blank" rel="noopener noreferrer" class="nav-text-link">Apple Maps</a>
								{#if instagramUrl}
									<a href={instagramUrl} target="_blank" rel="noopener noreferrer" class="nav-text-link nav-text-link-instagram">{instagramLabel}</a>
								{/if}
							</div>
						</div>
						
						<p class="popup-description">{placeDescription}</p>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Custom popup overlay */
	.popup-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		z-index: 1000;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 20px;
		animation: fadeIn 0.2s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.popup-container {
		background: #12121c;
		border: 2px solid #282837;
		border-radius: 0;
		box-shadow: 
			0 10px 40px rgba(0, 0, 0, 0.6),
			0 0 30px rgba(0, 255, 255, 0.2);
		max-width: 400px;
		width: 100%;
		max-height: 90vh;
		display: flex;
		flex-direction: column;
		position: relative;
		animation: slideUp 0.3s ease-out;
	}

	@keyframes slideUp {
		from {
			transform: translateY(20px);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}

	@media (max-width: 768px) {
		.popup-overlay {
			padding: 12px;
		}

		.popup-container {
			max-width: calc(100vw - 24px);
			width: calc(100vw - 24px);
		}
	}

	.popup-close-button {
		position: absolute;
		top: 8px;
		right: 8px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(18, 18, 28, 0.9);
		border: 1px solid #282837;
		color: #a0a0b0;
		font-size: 24px;
		cursor: pointer;
		transition: all 0.3s;
		z-index: 10;
		line-height: 1;
	}

	.popup-close-button:hover {
		color: #00ffff;
		background: rgba(0, 255, 255, 0.1);
		border-color: #00ffff;
	}

	@media (max-width: 768px) {
		.popup-close-button {
			width: 40px;
			height: 40px;
			font-size: 28px;
			top: 4px;
			right: 4px;
		}
	}

	.modern-popup {
		display: flex;
		flex-direction: column;
		max-height: min(70vh, 500px);
		color: #f0f0f0;
		font-family: 'Poppins', sans-serif;
		overflow: hidden;
	}

	@media (max-width: 768px) {
		.modern-popup {
			max-height: min(75vh, 500px);
		}
	}

	.popup-fixed-header {
		padding: 24px 24px 0 24px;
		flex-shrink: 0;
	}

	@media (max-width: 768px) {
		.popup-fixed-header {
			padding: 16px 16px 0 16px;
		}
	}

	.popup-header {
		display: flex;
		align-items: center;
		gap: 16px;
		padding-bottom: 20px;
		border-bottom: 1px solid #282837;
		margin-bottom: 20px;
	}

	@media (max-width: 768px) {
		.popup-header {
			gap: 12px;
			padding-bottom: 16px;
			margin-bottom: 16px;
		}
	}

	.popup-category-badge {
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
		.popup-category-badge {
			width: 40px;
			height: 40px;
		}
	}

	.popup-category-info {
		flex: 1;
	}

	.popup-category-label {
		font-size: 11px;
		font-weight: 500;
		color: #a0a0b0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 4px;
	}

	.popup-category-name {
		font-size: 16px;
		font-weight: 600;
	}

	.popup-title {
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
		.popup-title {
			font-size: 20px;
			padding-bottom: 16px;
		}
	}

	.popup-scrollable-content {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		position: relative;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		/* Custom scrollbar styling */
		scrollbar-width: thin;
		scrollbar-color: #282837 #12121c;
	}

	.popup-content-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(40, 40, 55, 0.5) 70%, rgba(60, 60, 75, 0.3) 100%);
		pointer-events: none;
		z-index: 1;
	}

	.popup-content-inner {
		position: relative;
		z-index: 2;
		padding: 20px 24px 24px 24px;
	}

	@media (max-width: 768px) {
		.popup-content-inner {
			padding: 16px 16px 16px 16px;
		}
	}

	.popup-scrollable-content::-webkit-scrollbar {
		width: 8px;
	}

	.popup-scrollable-content::-webkit-scrollbar-track {
		background: #12121c;
	}

	.popup-scrollable-content::-webkit-scrollbar-thumb {
		background: #282837;
		border-radius: 4px;
	}

	.popup-scrollable-content::-webkit-scrollbar-thumb:hover {
		background: #00ffff;
		box-shadow: 0 0 8px rgba(0, 255, 255, 0.5);
	}

	.popup-description {
		font-size: 15px;
		line-height: 1.7;
		color: #a0a0b0;
		margin: 0;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	@media (max-width: 768px) {
		.popup-description {
			font-size: 14px;
			line-height: 1.6;
		}
	}

	.popup-navigation {
		margin-bottom: 24px;
		padding-bottom: 24px;
		border-bottom: 1px solid #282837;
	}

	.popup-navigation-label {
		font-size: 11px;
		font-weight: 500;
		color: #a0a0b0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 16px;
	}

	.popup-navigation-links {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		align-items: center;
	}

	.nav-text-link {
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

	.nav-text-link:hover {
		border-color: #00ffff;
		background: rgba(0, 255, 255, 0.1);
		color: #00ffff;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2);
	}

	.nav-text-link-instagram {
		background: linear-gradient(45deg, #833AB4, #E1306C, #F77737);
		border-color: #E1306C;
		color: #ffffff;
	}

	.nav-text-link-instagram:hover {
		background: linear-gradient(45deg, #9B4DD1, #F56040, #FCAF45);
		border-color: #F56040;
		color: #ffffff;
		box-shadow: 0 2px 8px rgba(225, 48, 108, 0.4);
	}

	@media (max-width: 768px) {
		.popup-navigation {
			margin-bottom: 20px;
			padding-bottom: 20px;
		}

		.popup-navigation-links {
			gap: 6px;
		}

		.nav-text-link {
			font-size: 11px;
			padding: 5px 10px;
			white-space: normal;
		}
	}
</style>
