import type { NextConfig } from "next";
import { assertProductionEnvironment } from "./server/production-environment";

assertProductionEnvironment({
	VERCEL_ENV: process.env.VERCEL_ENV,
	RESEND_API_KEY: process.env.RESEND_API_KEY,
});

const nextConfig: NextConfig = {
	outputFileTracingIncludes: {
		"/api/submit": ["./public/logos/*", "./node_modules/@formepdf/core/pkg/*.wasm"],
		"/admin/prihlasky/*/hodnotenie.pdf": ["./public/logos/*", "./node_modules/@formepdf/core/pkg/*.wasm"],
	},
	turbopack: {
		root: process.cwd(),
	},
};

export default nextConfig;
