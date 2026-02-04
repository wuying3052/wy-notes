declare global {
	namespace App {
		type Pathname = string;
		interface Locals { }
	}
}

declare module '$app/types' {
	interface AppTypes {
		Pathname(): string;
	}
}

export { };
