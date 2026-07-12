export function assertProductionEnvironment(environment: { VERCEL_ENV?: string; RESEND_API_KEY?: string }): void {
	if (environment.VERCEL_ENV === "production" && !environment.RESEND_API_KEY?.trim()) {
		throw new Error("Missing RESEND_API_KEY in Vercel Production environment");
	}
}
