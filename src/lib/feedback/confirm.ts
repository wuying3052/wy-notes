import { writable } from 'svelte/store';
import { t } from '$lib/i18n';

export type ConfirmOptions = {
	title?: string;
	description?: string;
	confirmText?: string;
	cancelText?: string;
	danger?: boolean;
};

type ConfirmState = {
	options: Required<Pick<ConfirmOptions, 'title' | 'confirmText' | 'cancelText'>> &
		Omit<ConfirmOptions, 'title' | 'confirmText' | 'cancelText'>;
	resolve: (value: boolean) => void;
};

export const confirmState = writable<ConfirmState | null>(null);

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
	return new Promise((resolve) => {
		confirmState.set({
			options: {
				title: options.title ?? t('confirm.title'),
				confirmText: options.confirmText ?? t('confirm.confirm'),
				cancelText: options.cancelText ?? t('confirm.cancel'),
				description: options.description,
				danger: options.danger ?? false
			},
			resolve
		});
	});
}

export function closeConfirm(result: boolean) {
	confirmState.update((state) => {
		if (!state) return null;
		state.resolve(result);
		return null;
	});
}
