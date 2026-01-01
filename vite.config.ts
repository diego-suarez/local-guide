import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	base: '/local-guide/',
	define: {
		// Explicitly define the env var for Vite
		'import.meta.env.PUBLIC_GA4_MEASUREMENT_ID': JSON.stringify(process.env.PUBLIC_GA4_MEASUREMENT_ID || '')
	}
});
