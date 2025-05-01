import { WorkerEntrypoint } from "cloudflare:workers"
import { ProxyToSelf } from "workers-mcp"
import {
	compareSchemas,
	deleteBranch,
	getBranch,
	listBranches,
	listDatabases,
	restoreBranch,
	retrieveDatabaseSchema
} from "./branches"
import { listProjects } from "./projects"

export default class MyWorker extends WorkerEntrypoint<Env> {
	/**
	 * List all projects.
	 * @return {Promise<any[]>} the list of projects.
	 */
	async listProjects() {
		return await listProjects(this.env)
	}

	/**
	 * List all branches for a project.
	 * @param projectId {string} the ID of the project to list branches for.
	 * @return {Promise<any>} the list of branches.
	 */
	async listBranches(projectId: string) {
		return await listBranches({ env: this.env, projectId })
	}

	/**
	 * Get details of a specific branch.
	 * @param projectId {string} the ID of the project.
	 * @param branchId {string} the ID of the branch to retrieve.
	 * @return {Promise<any>} the branch details.
	 */
	async getBranch(projectId: string, branchId: string) {
		return await getBranch({ env: this.env, projectId, branchId })
	}

	/**
	 * Delete a specific branch.
	 * @param projectId {string} the ID of the project.
	 * @param branchId {string} the ID of the branch to delete.
	 * @return {Promise<any>} confirmation of deletion.
	 */
	async deleteBranch(projectId: string, branchId: string) {
		return await deleteBranch({ env: this.env, projectId, branchId })
	}

	/**
	 * Restore a branch to a specific point.
	 * @param projectId {string} the ID of the project.
	 * @param branchId {string} the ID of the branch to restore.
	 * @param source_branch_id {string} the ID of the source branch.
	 * @param source_lsn {string} [optional] the LSN to restore from.
	 * @param source_timestamp {string} [optional] the timestamp to restore from.
	 * @param preserve_under_name {string} [optional] name to preserve the branch under.
	 * @return {Promise<any>} confirmation of restoration.
	 */
	async restoreBranch(
		projectId: string,
		branchId: string,
		source_branch_id: string,
		source_lsn?: string,
		source_timestamp?: string,
		preserve_under_name?: string
	) {
		return await restoreBranch({
			env: this.env,
			projectId,
			branchId,
			source_branch_id,
			source_lsn,
			source_timestamp,
			preserve_under_name
		})
	}

	/**
	 * Compare schemas between branches.
	 * @param projectId {string} the ID of the project.
	 * @param branchId {string} the ID of the branch.
	 * @param db_name {string} the name of the database.
	 * @param base_branch_id {string} [optional] the ID of the base branch to compare against.
	 * @param lsn {string} [optional] the LSN to compare at.
	 * @param timestamp {string} [optional] the timestamp to compare at.
	 * @param base_timestamp {string} [optional] the base timestamp to compare against.
	 * @return {Promise<any>} the schema comparison results.
	 */
	async compareSchemas(
		projectId: string,
		branchId: string,
		db_name: string,
		base_branch_id?: string,
		lsn?: string,
		timestamp?: string,
		base_timestamp?: string
	) {
		return await compareSchemas({
			env: this.env,
			projectId,
			branchId,
			db_name,
			base_branch_id,
			lsn,
			timestamp,
			base_timestamp
		})
	}

	/**
	 * Retrieve the schema of a database.
	 * @param projectId {string} The ID of the project
	 * @param branchId {string} The ID of the branch
	 * @param db_name {string} The name of the database
	 * @param [lsn] {string} Log Sequence Number (LSN) - retrieve schema as it was at this specific LSN
	 * @param [timestamp] {string} ISO timestamp (e.g. "2024-02-23T02:11:30Z") - retrieve schema as it was at this point in time
	 * @returns {Promise<string>} The database schema in SQL format
	 */
	async retrieveDatabaseSchema(
		projectId: string,
		branchId: string,
		db_name: string,
		lsn?: string | null,
		timestamp?: string | null
	) {
		return await retrieveDatabaseSchema({
			env: this.env,
			projectId,
			branchId,
			db_name,
			lsn,
			timestamp
		})
	}

	/**
	 * List all databases for a branch.
	 * @param projectId {string} the ID of the project.
	 * @param branchId {string} the ID of the branch.
	 * @return {Promise<any>} the list of databases.
	 */
	async listDatabases(projectId: string, branchId: string) {
		return await listDatabases({ env: this.env, projectId, branchId })
	}

	/**
	 * @ignore
	 **/
	async fetch(request: Request): Promise<Response> {
		return new ProxyToSelf(this).fetch(request)
	}
}
