<script lang="ts">
	import { onMount } from 'svelte';
	import { loadLocations } from '$lib/utils';
	import { language } from '$lib/i18n';
	import { getLocationDescription } from '$lib/utils/i18n';
	import LanguageSwitcher from '$lib/components/LanguageSwitcher.svelte';
	import type { Location } from '$lib/types';
	import { MapPin, ArrowRight } from 'lucide-svelte';
	import esTranslations from '$lib/i18n/translations/es.json';
	import enTranslations from '$lib/i18n/translations/en.json';

	let locations = $state<Location[]>([]);
	let mounted = $state(false);
	let lang = $state(language);

	language.subscribe((value) => {
		lang = value;
	});

	// Reactive translations
	const subtitleLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.home.subtitle;
	});
	const exploreLabel = $derived.by(() => {
		const translations = lang === 'es' ? esTranslations : enTranslations;
		return translations.common.explore;
	});

	onMount(() => {
		locations = loadLocations();
		mounted = true;
	});
</script>

<div class="min-h-screen bg-[#08080c] relative overflow-hidden">
	<!-- Animated grid background -->
	<div class="fixed inset-0 opacity-10 pointer-events-none" style="background-image: linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px); background-size: 50px 50px;"></div>
	
	<!-- Neon accent lines -->
	<div class="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00ffff] to-transparent opacity-50"></div>
	<div class="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#ff00ff] to-transparent opacity-50"></div>

	<!-- Header -->
	<header class="container-wide py-8 flex justify-between items-center relative z-20 border-b border-[#282837]">
		<div class="text-neon-cyan text-sm font-semibold tracking-wide">Local Guide</div>
		<LanguageSwitcher />
	</header>

	<!-- Hero Section -->
	<section class="section-spacing relative z-10">
		<div class="container-wide">
			<div class="max-w-4xl">
				<div class="mb-4 text-[#ff00ff] text-sm font-medium">Explore</div>
				<h1 class="heading-xl text-white mb-8">
					<span class="text-neon-cyan">{lang === 'es' ? 'Guía' : 'Local'}</span>
					<br />
					<span class="text-neon-magenta">{lang === 'es' ? 'Local' : 'Guide'}</span>
				</h1>
				<p class="text-xl text-[#a0a0b0] max-w-2xl leading-relaxed mb-12">
					{subtitleLabel}
				</p>
			</div>
		</div>
	</section>

	<!-- Locations Section -->
	<section class="section-spacing border-t border-[#282837]">
		<div class="container-wide">
			<div class="mb-16">
				<div class="text-[#ffc800] text-sm font-medium mb-4">Destinations</div>
				<h2 class="heading-lg text-white">Select Location</h2>
			</div>

			{#if mounted}
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{#each locations as location, index (location.id)}
						<a
							href="/{location.id}"
							class="card-modern group block"
							style="animation-delay: {index * 100}ms"
						>
							<div class="p-10">
							<!-- Number badge -->
							<div class="mb-6 flex items-center gap-4">
								<div class="w-12 h-12 border-2 border-[#00ffff] flex items-center justify-center text-neon-cyan font-semibold text-lg">
									{String(index + 1).padStart(2, '0')}
								</div>
								<div class="h-px flex-1 bg-gradient-to-r from-[#00ffff] to-transparent"></div>
							</div>

								<!-- Location Info -->
								<h3 class="heading-md text-white mb-3 group-hover:text-neon-cyan transition-colors">
									{location.name}
								</h3>
								<div class="text-[#ff00ff] text-sm font-medium mb-6">
									{location.country}
								</div>
								<p class="text-[#a0a0b0] mb-8 leading-relaxed line-clamp-3">
									{getLocationDescription(location)}
								</p>

								<!-- CTA -->
								<div class="flex items-center gap-3 text-[#00ffff] text-sm font-medium group-hover:gap-6 transition-all">
									<span>{exploreLabel}</span>
									<ArrowRight class="w-5 h-5 group-hover:translate-x-2 transition-transform" />
								</div>
							</div>
						</a>
					{/each}
				</div>
			{:else}
				<!-- Loading State -->
				<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
					{#each Array(2) as _}
						<div class="card-modern animate-pulse">
							<div class="p-10">
								<div class="w-12 h-12 bg-[#282837] mb-6"></div>
								<div class="h-8 bg-[#282837] mb-4 w-3/4"></div>
								<div class="h-4 bg-[#282837] mb-2"></div>
								<div class="h-4 bg-[#282837] w-5/6"></div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
</div>

<style>
	@keyframes fadeIn {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-fade-in {
		animation: fadeIn 1s ease-out;
	}
</style>
