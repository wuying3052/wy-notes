<script lang="ts">
	let {
		name,
		size = 20,
		...props
	} = $props<{
		name: 'github' | 'twitter' | 'linkedin';
		size?: number;
		[key: string]: string | number | boolean | undefined;
	}>();

	const paths: Record<'github' | 'twitter' | 'linkedin', string> = {
		github:
			'M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7a3.37 3.37 0 0 0-.94 2.58V22',
		twitter:
			'M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z',
		linkedin:
			'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2zM4 2a2 2 0 1 1-2 2 2 2 0 0 1 2-2z'
	};

	const viewBoxes: Record<'github' | 'twitter' | 'linkedin', string> = {
		github: '0 0 24 24',
		twitter: '0 0 24 24',
		linkedin: '0 0 24 24'
	};
</script>

<svg
	xmlns="http://www.w3.org/2000/svg"
	width={size}
	height={size}
	viewBox={viewBoxes[name as 'github' | 'twitter' | 'linkedin']}
	fill="none"
	stroke="currentColor"
	stroke-width="2"
	stroke-linecap="round"
	stroke-linejoin="round"
	{...props}
>
	<path d={paths[name as 'github' | 'twitter' | 'linkedin']} />
</svg>
