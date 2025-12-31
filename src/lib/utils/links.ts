export function normalizeInstagramUrl(value: string): string | null {
	const raw = value.trim();
	if (!raw) return null;

	// Full URL already
	if (/^https?:\/\//i.test(raw)) {
		try {
			const url = new URL(raw);
			// Only allow instagram hostnames
			const host = url.hostname.toLowerCase();
			if (!host.endsWith('instagram.com')) return null;

			// Normalize to canonical profile URL shape when possible.
			// Keep original path if it already points to something valid.
			return url.toString();
		} catch {
			return null;
		}
	}

	// Handle form: "@foo" or "foo" or "foo/"
	const handle = raw.replace(/^@/, '').replace(/\/+$/, '');
	if (!handle) return null;
	if (!/^[A-Za-z0-9._]+$/.test(handle)) return null;

	return `https://www.instagram.com/${handle}/`;
}

