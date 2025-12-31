<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import Map from '$lib/components/Map.svelte';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import { t, language } from '$lib/i18n';
	import { getPlaceText, getLocationDescription } from '$lib/utils/i18n';
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
	let detailsExpanded = $state(false);
	let lang = $state(language);
	let viewMode = $state<'map' | 'list'>('map');
	let expandedCategories = $state(new Set<string>());
	let expandedPlaces = $state(new Set<string>());

	language.subscribe((value) => {
		lang = value;
	});

	// Import translations directly for reactive access
	import esTranslations from '$lib/i18n/translations/es.json';
	import enTranslations from '$lib/i18n/translations/en.json';

	// Reactive translations - these update when lang changes
	const filtersLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.filters;
	});
	const placesLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.places;
	});
	const selectAllLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.selectAll;
	});
	const clearLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.clear;
	});
	const clickMarkerLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.clickMarker;
	});
	const mapLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.map;
	});
	const listLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.list;
	});
	const aboutLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.about;
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
		const translations = lang === 'es' ? esTranslations : enTranslations;
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
		detailsExpanded = true;
		// Scroll to details if on mobile
		if (browser && window.innerWidth < 768) {
			setTimeout(() => {
				document.getElementById('place-details')?.scrollIntoView({ behavior: 'smooth' });
			}, 100);
		}
	}

	onMount(() => {
		mounted = true;
	});

	// Auto-expand details when place is selected
	$effect(() => {
		if (selectedPlace) {
			detailsExpanded = true;
		}
	});
</script>

<svelte:head>
	<title>{data.location.name} - {lang === 'es' ? 'Guía Local' : 'Local Guide'}</title>
</svelte:head>

<div class="min-h-screen bg-[#08080c] relative overflow-hidden">
	<!-- Animated grid background -->
	<div class="fixed inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px); background-size: 50px 50px;"></div>
	
	<!-- Neon accent lines -->
	<div class="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ffff] to-transparent opacity-50"></div>

	<!-- Header -->
	<header class="container-wide py-6 flex justify-between items-center relative z-20 border-b border-[#282837] sticky top-0 bg-[#08080c]/95 backdrop-blur-sm">
		<div>
			<h1 class="heading-md text-white mb-1">{data.location.name}</h1>
			<div class="text-[#ff00ff] text-sm font-medium">{data.location.country}</div>
		</div>
		<LanguageSwitcher />
	</header>

	<!-- City Description -->
	<section class="section-spacing border-b border-[#282837]">
		<div class="container-wide max-w-4xl">
			<div class="text-[#ffc800] text-sm font-medium mb-4">{aboutLabel}</div>
			<p class="text-xl text-[#a0a0b0] leading-relaxed text-balance">
				{locationDescription}
			</p>
		</div>
	</section>

	<!-- View Toggle -->
	<div class="container-wide py-6 relative z-10">
		<div class="flex items-center gap-2 border border-[#282837] bg-[#12121c] p-1 max-w-fit">
			<button
				onclick={() => viewMode = 'map'}
				class="flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all duration-300 {viewMode === 'map'
					? 'bg-[#00ffff] text-[#08080c]'
					: 'text-[#a0a0b0] hover:text-[#00ffff]'}"
			>
				<MapIcon class="w-4 h-4" />
				{mapLabel}
			</button>
			<button
				onclick={() => viewMode = 'list'}
				class="flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all duration-300 {viewMode === 'list'
					? 'bg-[#00ffff] text-[#08080c]'
					: 'text-[#a0a0b0] hover:text-[#00ffff]'}"
			>
				<List class="w-4 h-4" />
				{listLabel}
			</button>
		</div>
	</div>

	<!-- Map View -->
	{#if viewMode === 'map'}
		<div class="container-wide pb-12 relative z-10">
			<!-- Filters Panel - Above Map -->
			<div class="panel-dark mb-6">
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

			<!-- Place Details Panel -->
			<div class="panel-dark">
				<!-- Details Header -->
				<button
					onclick={() => detailsExpanded = !detailsExpanded}
					class="w-full flex items-center justify-between mb-6 group"
					disabled={!selectedPlace}
				>
					<div class="flex items-center gap-4">
						<div class="w-10 h-10 border-2 border-[#ff00ff] flex items-center justify-center">
							<Eye class="w-5 h-5 text-[#ff00ff]" />
						</div>
						<h2 class="text-xl font-bold text-white">
							{selectedPlace ? getPlaceText(selectedPlace, 'title') : clickMarkerLabel}
						</h2>
					</div>
					{#if selectedPlace}
						<div class="w-8 h-8 border border-[#282837] flex items-center justify-center group-hover:border-[#ff00ff] transition-colors">
							{#if detailsExpanded}
								<ChevronUp class="w-4 h-4 text-[#a0a0b0]" />
							{:else}
								<ChevronDown class="w-4 h-4 text-[#a0a0b0]" />
							{/if}
						</div>
					{/if}
				</button>

				<!-- Details Content -->
				{#if selectedPlace && detailsExpanded}
					{@const category = categories[selectedPlace.category]}
					{@const Icon = iconMap[category.icon]}
					<div id="place-details" class="animate-scale-in">
						<!-- Category Badge -->
						<div class="flex items-center gap-4 mb-8 pb-6 border-b border-[#282837]">
							<div
								class="w-16 h-16 border-2 flex items-center justify-center"
								style="border-color: {category.color}"
							>
								{#if Icon}
									<Icon class="w-8 h-8" style="color: {category.color}" />
								{/if}
							</div>
							<div>
								<div class="text-[#a0a0b0] text-xs font-medium mb-1">Category</div>
								<div class="text-white font-semibold" style="color: {category.color}">
									{getCategoryTranslation(selectedPlace.category)}
								</div>
							</div>
						</div>

						<!-- Title -->
						<h3 class="heading-md text-white mb-6">
							{getPlaceText(selectedPlace, 'title')}
						</h3>

						<!-- Description -->
						<p class="text-[#a0a0b0] leading-relaxed text-lg">{getPlaceText(selectedPlace, 'description')}</p>
					</div>
				{:else if !selectedPlace}
					<div class="flex flex-col items-center justify-center text-center py-16">
						<div class="w-20 h-20 border-2 border-[#282837] flex items-center justify-center mb-6">
							<Eye class="w-10 h-10 text-[#282837]" />
						</div>
						<p class="text-[#a0a0b0] text-lg">{clickMarkerLabel}</p>
					</div>
				{/if}
			</div>
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
													<p class="text-[#a0a0b0] leading-relaxed text-sm">
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
								? 'No places match the current filters. Try adjusting your filters.'
								: 'No categories to display.'}
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
</style>
