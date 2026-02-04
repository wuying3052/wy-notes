import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, createLogger } from 'vite';

const logger = createLogger();
const originalWarn = logger.warn;

logger.warn = (msg, options) => {
	if (msg.includes('Sourcemap for') && msg.includes('node_modules')) return;
	originalWarn(msg, options);
};

export default defineConfig({
	customLogger: logger,
	plugins: [sveltekit()],
	build: {
		target: 'esnext',
		sourcemap: false
	}
});
