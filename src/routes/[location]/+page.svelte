<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Map from '$lib/components/Map.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { language } from '$lib/i18n';
	import type { Language } from '$lib/i18n';
	import { getPlaceText, getLocationDescription } from '$lib/utils/i18n';
	import { normalizeInstagramUrl } from '$lib/utils/links';
	import { getCoverImagePath } from '$lib/utils';
	import { base } from '$app/paths';
	import type { Place, Location, Categories } from '$lib/types';
	import categoriesData from '$lib/data/categories.json';
	import {
		Activity,
		Mountain,
		Utensils,
		Music,
		Waves,
		Trees,
		Building,
		Eye,
		Filter,
		ChevronDown,
		ChevronUp,
		CheckSquare,
		Square,
		X,
		Map as MapIcon,
		List
	} from 'lucide-svelte';

	interface Props {
		data: {
			location: Location;
			places: Place[];
		};
	}

	let { data }: Props = $props();

	const categories: Categories = categoriesData as Categories;
	let selectedPlace = $state<Place | null>(null);
	let visibleCategories = $state(new Set<string>(Object.keys(categories)));
	let mounted = $state(false);
	let filtersExpanded = $state(false);
	let lang = $state<Language>('es');
	let viewMode = $state<'map' | 'list'>('list');
	let expandedCategories = $state(new Set<string>());
	let expandedPlaces = $state(new Set<string>());

	language.subscribe((value) => {
		lang = value;
	});

	// Import translations directly for reactive access
	import esTranslations from '$lib/i18n/translations/es.json';
	import enTranslations from '$lib/i18n/translations/en.json';
	import ptTranslations from '$lib/i18n/translations/pt.json';

	const translationsByLang = {
		es: esTranslations,
		en: enTranslations,
		pt: ptTranslations
	} as const;

	// Reactive translations - these update when lang changes
	const filtersLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.filters;
	});
	const placesLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.places;
	});
	const selectAllLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.selectAll;
	});
	const clearLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.clear;
	});
	const clickMarkerLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.clickMarker;
	});
	const mapLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.map;
	});
	const listLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.list;
	});
	const aboutLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.about;
	});
	const homeTitle = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.home.title;
	});
	const goToLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.goTo;
	});
	const instagramLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.instagram ?? 'Instagram';
	});
	const noPlacesMatchFiltersLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.noPlacesMatchFilters;
	});
	const noCategoriesToDisplayLabel = $derived.by(() => {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.common.noCategoriesToDisplay;
	});
	
	// Reactive location description - updates when language changes
	const locationDescription = $derived.by(() => {
		const value = data.location.description;
		
		if (typeof value === 'string') {
			return value;
		}
		
		return value[lang] || value.es || '';
	});
	
	// Reactive category translation helper
	// This function is reactive because it uses the reactive `lang` variable
	function getCategoryTranslation(categoryKey: string): string {
		const translations = translationsByLang[lang] ?? translationsByLang.es;
		return translations.categories[categoryKey as keyof typeof translations.categories] || categoryKey;
	}

	// Icon mapping
	const iconMap: Record<string, any> = {
		activity: Activity,
		mountain: Mountain,
		utensils: Utensils,
		music: Music,
		waves: Waves,
		trees: Trees,
		building: Building,
		eye: Eye
	};

	function toggleCategory(category: string) {
		if (visibleCategories.has(category)) {
			visibleCategories.delete(category);
		} else {
			visibleCategories.add(category);
		}
		visibleCategories = new Set(visibleCategories);
	}

	function selectAll() {
		visibleCategories = new Set(Object.keys(categories));
	}

	function deselectAll() {
		visibleCategories = new Set();
	}

	const visiblePlaces = $derived(
		data.places.filter((place) => visibleCategories.has(place.category))
	);

	// Group places by category for list view
	// Show all places (not filtered) so users can browse everything
	const placesByCategory = $derived.by(() => {
		const grouped: Record<string, Place[]> = {};
		// Use all places for list view, not filtered ones
		for (const place of data.places) {
			if (!grouped[place.category]) {
				grouped[place.category] = [];
			}
			grouped[place.category].push(place);
		}
		return grouped;
	});

	function toggleCategoryExpansion(category: string) {
		if (expandedCategories.has(category)) {
			expandedCategories.delete(category);
		} else {
			expandedCategories.add(category);
		}
		expandedCategories = new Set(expandedCategories);
	}

	function togglePlaceExpansion(placeId: string) {
		if (expandedPlaces.has(placeId)) {
			expandedPlaces.delete(placeId);
		} else {
			expandedPlaces.add(placeId);
		}
		expandedPlaces = new Set(expandedPlaces);
	}

	function selectPlaceFromList(place: Place) {
		selectedPlace = place;
		// Popup will be handled by the map component
	}

	function getInstagramHref(place: Place): string | null {
		if (!place.instagram) return null;
		return normalizeInstagramUrl(place.instagram);
	}

	onMount(() => {
		mounted = true;
	});

	// Get cover image path for location
	const locationCoverPath = $derived.by(() => getCoverImagePath(data.location.id, base));

</script>

<svelte:head>
	<title>{data.location.name} - {homeTitle}</title>
</svelte:head>

<div class="min-h-screen bg-[#08080c] relative overflow-hidden">
	<!-- Animated grid background -->
	<div class="fixed inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px); background-size: 50px 50px;"></div>
	
	<!-- Neon accent lines -->
	<div class="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ffff] to-transparent opacity-50"></div>

	<!-- Header -->
	<header class="container-wide py-4 md:py-6 flex justify-between items-center relative z-20 border-b border-[#282837] sticky top-0 bg-[#08080c]/95 backdrop-blur-sm">
		<div>
			<h1 class="heading-md text-white mb-1">{data.location.name}</h1>
			<div class="text-[#ff00ff] text-sm font-medium">{data.location.country}</div>
		</div>
		<LanguageSwitcher />
	</header>

	<!-- City Description -->
	<section class="section-spacing border-b border-[#282837] location-description-section" style="background-image: url('{locationCoverPath}');">
		<div class="location-description-gradient"></div>
		<div class="container-wide max-w-4xl relative z-10">
			<div class="text-[#ffc800] text-sm font-medium mb-4">{aboutLabel}</div>
			<p class="text-xl text-[#a0a0b0] leading-relaxed text-balance">
				{locationDescription}
			</p>
		</div>
	</section>

	<!-- View Toggle -->
	<div class="container-wide py-4 md:py-6 relative z-10">
		<div class="flex items-center gap-2 border border-[#282837] bg-[#12121c] p-1 max-w-fit">
			<button
				onclick={() => viewMode = 'list'}
				class="flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all duration-300 {viewMode === 'list'
					? 'bg-[#00ffff] text-[#08080c]'
					: 'text-[#a0a0b0] hover:text-[#00ffff]'}"
			>
				<List class="w-4 h-4" />
				{listLabel}
			</button>
			<button
				onclick={() => viewMode = 'map'}
				class="flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all duration-300 {viewMode === 'map'
					? 'bg-[#00ffff] text-[#08080c]'
					: 'text-[#a0a0b0] hover:text-[#00ffff]'}"
			>
				<MapIcon class="w-4 h-4" />
				{mapLabel}
			</button>
		</div>
	</div>

	<!-- Map View -->
	{#if viewMode === 'map'}
		<div class="container-wide pb-6 md:pb-12 relative z-10">
			<!-- Filters Panel - Above Map -->
			<div class="panel-dark mb-4 md:mb-6">
				<!-- Filter Header -->
				<button
					onclick={() => filtersExpanded = !filtersExpanded}
					class="w-full flex items-center justify-between group"
				>
					<div class="flex items-center gap-3">
						<div class="w-8 h-8 border-2 border-[#00ffff] flex items-center justify-center">
							<Filter class="w-4 h-4 text-[#00ffff]" />
						</div>
						<div>
							<h2 class="text-lg font-semibold text-white">{filtersLabel}</h2>
							<div class="text-[#00ffff] text-sm">
								{visiblePlaces.length} {placesLabel}
							</div>
						</div>
					</div>
					<div class="w-7 h-7 border border-[#282837] flex items-center justify-center group-hover:border-[#00ffff] transition-colors">
						{#if filtersExpanded}
							<ChevronUp class="w-3.5 h-3.5 text-[#a0a0b0]" />
						{:else}
							<ChevronDown class="w-3.5 h-3.5 text-[#a0a0b0]" />
						{/if}
					</div>
				</button>

				<!-- Filter Content -->
				{#if filtersExpanded}
					<div class="mt-4 pt-4 border-t border-[#282837] space-y-3 animate-slide-up">
						<!-- Select All / Deselect All -->
						<div class="flex gap-2">
							<button
								onclick={selectAll}
								class="flex-1 btn-neon text-sm py-2"
							>
								{selectAllLabel}
							</button>
							<button
								onclick={deselectAll}
								class="flex-1 border-2 border-[#282837] text-[#a0a0b0] px-3 py-2 text-sm hover:border-[#ff00ff] hover:text-[#ff00ff] transition-all"
							>
								{clearLabel}
							</button>
						</div>

						<!-- Category Filters - Compact Grid -->
						<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
							{#each Object.entries(categories) as [key, category]}
								{@const Icon = iconMap[category.icon]}
								{@const isSelected = visibleCategories.has(key)}
								<button
									onclick={() => toggleCategory(key)}
									class="flex flex-col items-center gap-2 p-3 border-2 transition-all duration-300 hover:border-[#00ffff] {isSelected
										? 'border-[#00ffff] bg-[#00ffff]/10'
										: 'border-[#282837] bg-[#12121c]'}"
								>
									<div
										class="w-10 h-10 border-2 flex items-center justify-center transition-all duration-300 {isSelected
											? 'border-[#00ffff]'
											: 'border-[#282837]'}"
										style={isSelected ? `border-color: ${category.color};` : ''}
									>
										{#if Icon}
											<Icon class="w-5 h-5" style="color: {isSelected ? category.color : '#a0a0b0'}" />
										{/if}
									</div>
									<span class="text-xs font-medium text-white text-center leading-tight">
										{getCategoryTranslation(key)}
									</span>
									{#if isSelected}
										<CheckSquare class="w-4 h-4" style="color: {category.color}" />
									{:else}
										<Square class="w-4 h-4 text-[#282837]" />
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>

			<!-- Map -->
			<div class="card-modern p-0 overflow-hidden h-[70vh] min-h-[500px] mb-8">
				{#if mounted}
					<Map
						center={data.location.center}
						places={data.places}
						bind:selectedPlace
						visibleCategories={visibleCategories}
						categories={categories}
					/>
				{/if}
			</div>

			<!-- Place Details Panel - Hidden since popup handles details now -->
			<!-- Removed: Details are now shown in modern popup when clicking markers -->
		</div>

	<!-- List View -->
	{:else}
		<div class="container-wide pb-6 relative z-10">
			<!-- Categories List -->
			<div class="space-y-3">
				{#each Object.entries(placesByCategory) as [categoryKey, places]}
					{@const category = categories[categoryKey]}
					{@const Icon = iconMap[category.icon]}
					{@const isExpanded = expandedCategories.has(categoryKey)}
					
					{#if category && places && places.length > 0}
						<div class="panel-dark-compact">
							<!-- Category Header -->
							<button
								onclick={() => toggleCategoryExpansion(categoryKey)}
								class="w-full flex items-center justify-between group"
							>
								<div class="flex items-center gap-3">
									<div
										class="w-10 h-10 border-2 flex items-center justify-center group-hover:border-[#00ffff] transition-colors"
										style="border-color: {category.color}"
									>
										{#if Icon}
											<Icon class="w-5 h-5" style="color: {category.color}" />
										{/if}
									</div>
									<div class="text-left">
										<h3 class="text-lg font-semibold text-white">
											{getCategoryTranslation(categoryKey)}
										</h3>
										<div class="text-[#a0a0b0] text-xs">
											{places.length} {placesLabel}
										</div>
									</div>
								</div>
								<div class="w-6 h-6 border border-[#282837] flex items-center justify-center group-hover:border-[#00ffff] transition-colors">
									{#if isExpanded}
										<ChevronUp class="w-3.5 h-3.5 text-[#a0a0b0]" />
									{:else}
										<ChevronDown class="w-3.5 h-3.5 text-[#a0a0b0]" />
									{/if}
								</div>
							</button>

							<!-- Category Places -->
							{#if isExpanded}
								<div class="mt-3 pt-3 border-t border-[#282837] space-y-2 animate-slide-up">
									{#each places as place}
										{@const isPlaceExpanded = expandedPlaces.has(place.id)}
										<div class="border-2 border-[#282837] bg-[#08080c] hover:border-[#00ffff] transition-all">
											<!-- Place Header -->
											<button
												onclick={() => {
													togglePlaceExpansion(place.id);
													selectPlaceFromList(place);
												}}
												class="w-full p-3 flex items-center justify-between group"
											>
												<h4 class="text-base font-semibold text-white text-left group-hover:text-[#00ffff] transition-colors">
													{getPlaceText(place, 'title')}
												</h4>
												<div class="w-5 h-5 border border-[#282837] flex items-center justify-center group-hover:border-[#00ffff] transition-colors">
													{#if isPlaceExpanded}
														<ChevronUp class="w-3 h-3 text-[#a0a0b0] flex-shrink-0" />
													{:else}
														<ChevronDown class="w-3 h-3 text-[#a0a0b0] flex-shrink-0" />
													{/if}
												</div>
											</button>

											<!-- Place Details -->
											{#if isPlaceExpanded}
												<div class="px-3 pb-3 animate-scale-in border-t border-[#282837] pt-3">
													<!-- Navigation Links -->
													<div class="list-navigation">
														<div class="list-navigation-label">
															{goToLabel}
														</div>
														<div class="list-navigation-links">
															<a 
																href="https://waze.com/ul?ll={place.coordinates[0]},{place.coordinates[1]}&navigate=yes" 
																target="_blank" 
																rel="noopener noreferrer" 
																class="nav-text-link"
															>Waze</a>
															<a 
																href="https://www.google.com/maps/dir/?api=1&destination={place.coordinates[0]},{place.coordinates[1]}" 
																target="_blank" 
																rel="noopener noreferrer" 
																class="nav-text-link"
															>Google Maps</a>
															<a 
																href="https://maps.apple.com/?daddr={place.coordinates[0]},{place.coordinates[1]}&dirflg=d" 
																target="_blank" 
																rel="noopener noreferrer" 
																class="nav-text-link"
															>Apple Maps</a>
															{#if getInstagramHref(place)}
																<a
																	href={getInstagramHref(place) as string}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="nav-text-link nav-text-link-instagram"
																>{instagramLabel}</a>
															{/if}
														</div>
													</div>
													
													<p class="text-[#a0a0b0] leading-relaxed text-sm mt-4">
														{getPlaceText(place, 'description')}
													</p>
												</div>
											{/if}
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{/if}
				{/each}

				{#if Object.keys(placesByCategory).length === 0}
					<div class="panel-dark text-center py-16">
						<p class="text-[#a0a0b0] text-lg">
							{visiblePlaces.length === 0
								? noPlacesMatchFiltersLabel
								: noCategoriesToDisplayLabel}
						</p>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes scaleIn {
		from {
			opacity: 0;
			transform: scale(0.95);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-scale-in {
		animation: scaleIn 0.3s ease-out;
	}

	.animate-slide-up {
		animation: slideUp 0.3s ease-out;
	}

	/* Navigation links styling for list view */
	.list-navigation {
		margin-bottom: 16px;
		padding-bottom: 16px;
		border-bottom: 1px solid #282837;
	}

	.list-navigation-label {
		font-size: 10px;
		font-weight: 500;
		color: #a0a0b0;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		margin-bottom: 12px;
	}

	.list-navigation-links {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}

	.list-navigation .nav-text-link {
		display: inline-block;
		padding: 5px 10px;
		border: 1px solid #282837;
		background: #08080c;
		color: #a0a0b0;
		font-size: 11px;
		font-weight: 500;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		text-decoration: none;
		border-radius: 4px;
		white-space: nowrap;
		word-wrap: break-word;
		overflow-wrap: break-word;
	}

	.list-navigation .nav-text-link:hover {
		border-color: #00ffff;
		background: rgba(0, 255, 255, 0.1);
		color: #00ffff;
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 255, 255, 0.2);
	}

	.list-navigation .nav-text-link-instagram {
		background: linear-gradient(45deg, #833AB4, #E1306C, #F77737);
		border-color: #E1306C;
		color: #ffffff;
	}

	.list-navigation .nav-text-link-instagram:hover {
		background: linear-gradient(45deg, #9B4DD1, #F56040, #FCAF45);
		border-color: #F56040;
		color: #ffffff;
		box-shadow: 0 2px 8px rgba(225, 48, 108, 0.4);
	}

	@media (max-width: 480px) {
		.list-navigation .nav-text-link {
			font-size: 10px;
			padding: 4px 8px;
			white-space: normal;
		}
	}

	/* Location description section with cover image */
	.location-description-section {
		position: relative;
		background-size: cover;
		background-position: center;
		background-repeat: no-repeat;
		overflow: hidden;
	}

	.location-description-gradient {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.7) 40%, rgba(40, 40, 55, 0.5) 70%, rgba(60, 60, 75, 0.3) 100%);
		pointer-events: none;
		z-index: 1;
	}
</style>
