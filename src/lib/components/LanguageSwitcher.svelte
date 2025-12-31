<script lang="ts">
	import { language } from '../i18n';
	import { Languages } from 'lucide-svelte';

	let isOpen = $state(false);
	let lang = $state(language);

	language.subscribe((value) => {
		lang = value;
	});

	function setLang(newLang: 'es' | 'en') {
		language.set(newLang);
		isOpen = false;
	}
</script>

<div class="relative">
	<button
		onclick={() => isOpen = !isOpen}
		class="p-3 border-2 border-[#282837] bg-[#12121c] hover:border-[#00ffff] transition-all duration-300 flex items-center gap-3 group"
		aria-label="Change language"
	>
		<Languages class="w-4 h-4 text-[#a0a0b0] group-hover:text-[#00ffff] transition-colors" />
		<span class="text-sm font-semibold text-white uppercase">{lang}</span>
	</button>

	{#if isOpen}
		<div class="absolute right-0 mt-2 w-40 panel-dark z-[9999] border-2 border-[#282837]">
			<button
				onclick={() => setLang('es')}
				class="w-full px-4 py-3 text-left hover:bg-[#00ffff]/10 transition-all duration-300 flex items-center justify-between border-b border-[#282837] {lang === 'es' ? 'bg-[#00ffff]/10' : ''}"
			>
				<span class="font-bold text-white">Español</span>
				{#if lang === 'es'}
					<span class="text-[#00ffff] font-black">✓</span>
				{/if}
			</button>
			<button
				onclick={() => setLang('en')}
				class="w-full px-4 py-3 text-left hover:bg-[#00ffff]/10 transition-all duration-300 flex items-center justify-between {lang === 'en' ? 'bg-[#00ffff]/10' : ''}"
			>
				<span class="font-bold text-white">English</span>
				{#if lang === 'en'}
					<span class="text-[#00ffff] font-black">✓</span>
				{/if}
			</button>
		</div>
	{/if}
</div>
