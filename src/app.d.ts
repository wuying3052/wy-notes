declare global {
	namespace App {
		type Pathname = string;
		interface Locals {
			supabase: import('@supabase/supabase-js').SupabaseClient;
		}
	}
}

declare module '$app/types' {
	interface AppTypes {
		Pathname(): string;
	}
}

export { };

declare module 'carta-md';
declare module '@cartamd/plugin-attachment';
declare module '@cartamd/plugin-code';
declare module '@cartamd/plugin-slash';
declare module '@cartamd/plugin-emoji';
declare module '@cartamd/plugin-math';
