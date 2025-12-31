<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import '../app.css';
	import PlacePopup from '$lib/components/PlacePopup.svelte';
	import categoriesData from '$lib/data/categories.json';
	import type { Categories } from '$lib/types';

	export const prerender = true;

	let { children } = $props();
	const categories: Categories = categoriesData as Categories;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
</svelte:head>

{@render children()}

<PlacePopup {categories} />
