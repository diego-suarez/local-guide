import { browser } from '$app/environment';
import { writable, get } from 'svelte/store';
import es from './translations/es.json';
import en from './translations/en.json';

export type Language = 'es' | 'en';

const translations = {
	es,
	en
};

// Default to Spanish
const defaultLang: Language = 'es';

function getStoredLanguage(): Language {
	if (!browser) return defaultLang;
	const stored = localStorage.getItem('language');
	return (stored === 'es' || stored === 'en') ? stored : defaultLang;
}

function createLanguageStore() {
	const { subscribe, set, update } = writable<Language>(getStoredLanguage());

	return {
		subscribe,
		set: (lang: Language) => {
			if (browser) {
				localStorage.setItem('language', lang);
			}
			set(lang);
		},
		update
	};
}

export const language = createLanguageStore();

export function t(key: string): string {
	const lang = get(language);
	const keys = key.split('.');
	let value: any = translations[lang];

	for (const k of keys) {
		value = value?.[k];
		if (value === undefined) {
			// Fallback to Spanish if key not found
			value = translations['es'];
			for (const k2 of keys) {
				value = value?.[k2];
			}
			break;
		}
	}

	return value || key;
}
