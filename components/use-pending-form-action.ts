"use client";

import { useActionState, useRef } from "react";

export interface FormActionResult {
	error?: string;
	success?: string;
}

export function usePendingFormAction(
	action: (formData: FormData) => Promise<FormActionResult>,
	onResult: (result: FormActionResult) => void,
	fallbackError: string
) {
	const pendingRef = useRef(false);
	const [, formAction, pending] = useActionState(async (previous: FormActionResult, formData: FormData) => {
		if (pendingRef.current) {
			return previous;
		}
		pendingRef.current = true;
		let result: FormActionResult;
		try {
			result = await action(formData);
		} catch (reason) {
			result = { error: reason instanceof Error ? reason.message : fallbackError };
		} finally {
			pendingRef.current = false;
		}
		onResult(result);
		return result;
	}, {});

	return { pending, formAction };
}
