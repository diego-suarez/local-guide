<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import PlacePopup from '$lib/components/PlacePopup.svelte';
	import categoriesData from '$lib/data/categories.json';
	import type { Categories } from '$lib/types';
	import { initGA4, trackPageViewGA4 } from '$lib/utils/analytics';

	export const prerender = true;

	let { children } = $props();
	const categories: Categories = categoriesData as Categories;

	// Analytics Configuration
	// Get your Measurement ID from: https://analytics.google.com/
	// Format: G-XXXXXXXXXX
	const GA4_MEASUREMENT_ID = import.meta.env.PUBLIC_GA4_MEASUREMENT_ID || '';

	onMount(() => {
		if (!browser) return;

		// Initialize Google Analytics 4 (if configured)
		if (GA4_MEASUREMENT_ID) {
			initGA4(GA4_MEASUREMENT_ID);
		}
	});

	// Track page views on route changes
	$effect(() => {
		if (browser && page.url.pathname && GA4_MEASUREMENT_ID) {
			trackPageViewGA4(page.url.pathname, GA4_MEASUREMENT_ID);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}

<PlacePopup {categories} />
