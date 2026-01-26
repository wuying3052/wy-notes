import imageCompression from 'browser-image-compression';
import { supabase } from '../supabase';

// 提取压缩逻辑为单独的函数，以便于复用
export async function compressImageFile(file: File): Promise<File> {
	try {
		const options = {
			maxSizeMB: 0.5,
			maxWidthOrHeight: 1920,
			useWebWorker: true
		};
		return await imageCompression(file, options);
	} catch (error) {
		console.error('Image compression failed:', error);
		// 如果压缩失败，降级返回原文件，或者抛出异常
		// 为了不阻断流程，这里选择返回原文件，但打印错误
		return file;
	}
}

export async function uploadImage(
	file: File,
	bucket: string = 'wyNotes',
	pathPrefix: string = ''
): Promise<string> {
	try {
		const compressedFile = await compressImageFile(file);


		const fileExt = file.name.split('.').pop();
		const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
		const normalizedPrefix = pathPrefix.trim().replace(/^\/+|\/+$/g, '');
		const filePath = normalizedPrefix ? `${normalizedPrefix}/${fileName}` : fileName;

		const { error } = await supabase.storage.from(bucket).upload(filePath, compressedFile);

		if (error) {
			throw error;
		}

		const {
			data: { publicUrl }
		} = supabase.storage.from(bucket).getPublicUrl(filePath);

		return publicUrl;
	} catch (err: any) {
		console.error('Upload failed details:', err);
		throw new Error(err.message || '操作失败');
	}
}
