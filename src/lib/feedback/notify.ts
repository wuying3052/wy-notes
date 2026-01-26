import { toast } from 'svelte-sonner';
import { t } from '$lib/i18n';
import { normalizeError } from './normalizeError';

type NotifyOptions = {
	description?: string;
	duration?: number;
	mode?: 'auto' | 'manual';
	id?: string | number;
};

function messageFromKeyOrText(keyOrText: string): string {
	return keyOrText.includes('.') ? t(keyOrText) : keyOrText;
}

export const notify = {
	loading(messageKeyOrText: string, options?: Omit<NotifyOptions, 'mode'>) {
		return toast.loading(messageFromKeyOrText(messageKeyOrText), {
			description: options?.description,
			duration: options?.duration,
			id: options?.id
		});
	},
	success(messageKeyOrText: string, options?: NotifyOptions) {
		toast.success(messageFromKeyOrText(messageKeyOrText), {
			description: options?.description,
			duration: options?.mode === 'manual' ? Number.POSITIVE_INFINITY : options?.duration,
			id: options?.id
		});
	},
	info(messageKeyOrText: string, options?: NotifyOptions) {
		toast.info(messageFromKeyOrText(messageKeyOrText), {
			description: options?.description,
			duration: options?.mode === 'manual' ? Number.POSITIVE_INFINITY : options?.duration,
			id: options?.id
		});
	},
	warning(messageKeyOrText: string, options?: NotifyOptions) {
		toast.warning(messageFromKeyOrText(messageKeyOrText), {
			description: options?.description,
			duration: options?.mode === 'manual' ? Number.POSITIVE_INFINITY : options?.duration,
			id: options?.id
		});
	},
	error(err: unknown, options?: NotifyOptions & { fallbackKey?: string }) {
		const normalized = normalizeError(err);
		if (normalized.kind === 'validation' && normalized.fieldErrors) {
			toast.error(t(options?.fallbackKey ?? 'toast.validation_failed'), {
				duration: options?.mode === 'manual' ? Number.POSITIVE_INFINITY : options?.duration,
				id: options?.id
			});
			return;
		}

		const title = t(options?.fallbackKey ?? normalized.userMessageKey ?? 'toast.unknown_error');

		toast.error(title, {
			description: options?.description,
			duration: options?.mode === 'manual' ? Number.POSITIVE_INFINITY : options?.duration,
			id: options?.id
		});
	},
	validation(fieldErrors: Record<string, string>) {
		void fieldErrors;
		toast.error(t('toast.validation_failed'), { duration: 6000 });
	}
};
