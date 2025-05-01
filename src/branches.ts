import { createApiClient } from "@neondatabase/api-client"
import type { GetProjectBranchSchemaParams } from "@neondatabase/api-client"

export async function listBranches({
	env,
	projectId
}: {
	env: Env
	projectId: string
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	const branches = await apiClient.listProjectBranches({
		projectId: projectId,
		limit: 100
	})

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(branches, null, 2)
			}
		]
	}
}

export async function getBranch({
	env,
	projectId,
	branchId
}: {
	env: Env
	projectId: string
	branchId: string
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	const branch = await apiClient.getProjectBranch(projectId, branchId)

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(branch, null, 2)
			}
		]
	}
}

export async function deleteBranch({
	env,
	projectId,
	branchId
}: {
	env: Env
	projectId: string
	branchId: string
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	await apiClient.deleteProjectBranch(projectId, branchId)

	return {
		content: ["Branch deleted"]
	}
}

export async function restoreBranch({
	env,
	projectId,
	branchId,
	source_branch_id,
	source_lsn,
	source_timestamp,
	preserve_under_name
}: {
	env: Env
	projectId: string
	branchId: string
	source_branch_id: string
	source_lsn?: string
	source_timestamp?: string
	preserve_under_name?: string
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	await apiClient.restoreProjectBranch(projectId, branchId, {
		source_branch_id,
		source_lsn,
		source_timestamp,
		preserve_under_name
	})

	return {
		content: ["Branch restored"]
	}
}

export async function retrieveDatabaseSchema({
	env,
	projectId,
	branchId,
	db_name,
	lsn,
	timestamp
}: {
	env: Env
	projectId: string
	branchId: string
	db_name: string
	lsn?: string | null
	timestamp?: string | null
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	// Base parameters that are always required
	const params: GetProjectBranchSchemaParams = {
		projectId,
		branchId,
		db_name
	}

	// Only add optional parameters if they have actual values
	if (lsn) params.lsn = lsn
	if (timestamp) params.timestamp = timestamp

	const response = await apiClient.getProjectBranchSchema(params)

	// Extract just the SQL schema from the response
	return {
		content: [
			{
				type: "text",
				// Return just the SQL schema in a more readable format
				text: response.data?.sql || "No schema available"
			}
		]
	}
}

export async function compareSchemas({
	env,
	projectId,
	branchId,
	base_branch_id,
	db_name,
	lsn,
	timestamp,
	base_timestamp
}: {
	env: Env
	projectId: string
	branchId: string
	db_name: string
	base_branch_id?: string
	lsn?: string
	timestamp?: string
	base_timestamp?: string
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	const schema = await apiClient.getProjectBranchSchemaComparison({
		projectId,
		branchId,
		db_name,
		base_branch_id,
		lsn,
		timestamp,
		base_timestamp
	})

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(schema, null, 2)
			}
		]
	}
}

export async function listDatabases({
	env,
	projectId,
	branchId
}: {
	env: Env
	projectId: string
	branchId: string
}) {
	const apiClient = createApiClient({
		apiKey: env.NEON_API_KEY
	})

	const databases = await apiClient.listProjectBranchDatabases(
		projectId,
		branchId
	)

	return {
		content: [
			{
				type: "text",
				text: JSON.stringify(databases, null, 2)
			}
		]
	}
}
