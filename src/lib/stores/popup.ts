import { writable } from 'svelte/store';
import type { Place } from '$lib/types';

export const popupPlace = writable<Place | null>(null);
