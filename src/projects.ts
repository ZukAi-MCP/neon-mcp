import { createApiClient } from "@neondatabase/api-client"

export async function listProjects(env: Env) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	const projects = await apiClient.listProjects({
		limit: 100
	})

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(projects, null, 2)
			}
		]
	}
}
