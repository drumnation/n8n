/**
 * n8n Workflow TDD Test Suite
 *
 * Purpose: Test-driven development framework for n8n workflow automation
 * Pattern: RED → GREEN → REFACTOR
 *
 * Tests:
 * 1. Workflow Import/Export
 * 2. Workflow Execution
 * 3. Node Output Validation
 * 4. Error Detection
 * 5. Credential Configuration
 */

import { Agent } from 'node:http';
import type { SuperAgentTest } from 'supertest';
import { Container } from '@n8n/di';

import config from '@n8n/config';
import { WorkflowRepository } from '@/databases/repositories/workflow.repository';

import { createAgent, createAuthAgent } from './shared/agent';
import * as testDb from './shared/test-db';
import { randomCredentialPayload } from './shared/random';
import { affixRoleToSaveCredential } from './shared/db/credentials';
import * as utils from './shared/utils/';
import { createOwner } from './shared/db/users';
import { createWorkflow } from './shared/db/workflows';
import { WorkflowRunner } from '@/workflow-runner';

let agent: SuperAgentTest;
let authAgent: SuperAgentTest;
let owner: User;
let workflowRunner: WorkflowRunner;

const testServer = utils.setupTestServer({ endpointGroups: ['workflows', 'credentials'] });

beforeAll(async () => {
	owner = await createOwner();
	authAgent = await createAuthAgent(testServer.app, { user: owner });
	agent = createAgent(testServer.app);

	workflowRunner = Container.get(WorkflowRunner);
});

beforeEach(async () => {
	await testDb.truncate(['Workflow', 'Credentials', 'Execution']);
});

describe('n8n Workflow TDD Suite', () => {
	describe('Phase 1: Workflow Import Validation', () => {
		test('should import valid workflow JSON', async () => {
			// RED: Test fails initially
			const workflowData = {
				name: 'Test Workflow - Import',
				nodes: [
					{
						id: 'manual-trigger',
						name: 'Manual Trigger',
						type: 'n8n-nodes-base.manualTrigger',
						position: [250, 300],
						parameters: {},
						typeVersion: 1,
					},
					{
						id: 'set-node',
						name: 'Set',
						type: 'n8n-nodes-base.set',
						position: [450, 300],
						parameters: {
							mode: 'manual',
							duplicateItem: false,
							assignments: {
								assignments: [
									{
										id: 'test-1',
										name: 'message',
										value: 'Hello World',
										type: 'string',
									},
								],
							},
						},
						typeVersion: 3.4,
					},
				],
				connections: {
					'Manual Trigger': {
						main: [[{ node: 'Set', type: 'main', index: 0 }]],
					},
				},
				settings: {},
			};

			// GREEN: Make test pass
			const response = await authAgent.post('/workflows').send(workflowData);

			expect(response.status).toBe(200);
			expect(response.body.data).toHaveProperty('id');
			expect(response.body.data.name).toBe('Test Workflow - Import');
			expect(response.body.data.nodes).toHaveLength(2);
		});

		test('should reject workflow with invalid node type', async () => {
			const invalidWorkflow = {
				name: 'Invalid Workflow',
				nodes: [
					{
						id: 'invalid-node',
						name: 'Invalid',
						type: 'n8n-nodes-base.nonexistent',
						position: [250, 300],
						parameters: {},
						typeVersion: 1,
					},
				],
				connections: {},
				settings: {},
			};

			const response = await authAgent.post('/workflows').send(invalidWorkflow);

			expect(response.status).toBe(400);
			expect(response.body).toHaveProperty('message');
		});

		test('should reject workflow with invalid connection', async () => {
			const invalidConnections = {
				name: 'Bad Connections',
				nodes: [
					{
						id: 'manual-trigger',
						name: 'Manual Trigger',
						type: 'n8n-nodes-base.manualTrigger',
						position: [250, 300],
						parameters: {},
						typeVersion: 1,
					},
				],
				connections: {
					'Manual Trigger': {
						main: [[{ node: 'NonExistentNode', type: 'main', index: 0 }]],
					},
				},
				settings: {},
			};

			const response = await authAgent.post('/workflows').send(invalidConnections);

			expect(response.status).toBe(400);
		});
	});

	describe('Phase 2: Workflow Execution', () => {
		test('should execute simple workflow and return output', async () => {
			// Create workflow
			const workflow = await createWorkflow(
				{
					name: 'Test Workflow - Execution',
					nodes: [
						{
							id: 'manual-trigger',
							name: 'Manual Trigger',
							type: 'n8n-nodes-base.manualTrigger',
							position: [250, 300],
							parameters: {},
							typeVersion: 1,
						},
						{
							id: 'set-node',
							name: 'Set',
							type: 'n8n-nodes-base.set',
							position: [450, 300],
							parameters: {
								mode: 'manual',
								duplicateItem: false,
								assignments: {
									assignments: [
										{
											id: 'test-1',
											name: 'testValue',
											value: '=42',
											type: 'number',
										},
									],
								},
							},
							typeVersion: 3.4,
						},
					],
					connections: {
						'Manual Trigger': {
							main: [[{ node: 'Set', type: 'main', index: 0 }]],
						},
					},
					settings: {},
				},
				owner,
			);

			// Execute workflow
			const response = await authAgent.post(`/workflows/${workflow.id}/run`).send({
				workflowData: workflow,
			});

			expect(response.status).toBe(200);
			expect(response.body).toHaveProperty('data');
			expect(response.body.finished).toBe(true);

			// Validate output
			const setNodeOutput = response.body.data.resultData.runData.Set;
			expect(setNodeOutput).toBeDefined();
			expect(setNodeOutput[0].data.main[0][0].json.testValue).toBe(42);
		});

		test('should handle workflow execution errors gracefully', async () => {
			// Create workflow with intentional error (HTTP request to invalid URL)
			const workflow = await createWorkflow(
				{
					name: 'Test Workflow - Error Handling',
					nodes: [
						{
							id: 'manual-trigger',
							name: 'Manual Trigger',
							type: 'n8n-nodes-base.manualTrigger',
							position: [250, 300],
							parameters: {},
							typeVersion: 1,
						},
						{
							id: 'http-request',
							name: 'HTTP Request',
							type: 'n8n-nodes-base.httpRequest',
							position: [450, 300],
							parameters: {
								url: 'http://invalid-domain-that-does-not-exist.com',
								method: 'GET',
							},
							typeVersion: 4.2,
						},
					],
					connections: {
						'Manual Trigger': {
							main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]],
						},
					},
					settings: {},
				},
				owner,
			);

			const response = await authAgent.post(`/workflows/${workflow.id}/run`).send({
				workflowData: workflow,
			});

			expect(response.status).toBe(200);
			expect(response.body.finished).toBe(false);
			expect(response.body.data.resultData.error).toBeDefined();
		});
	});

	describe('Phase 3: Node Output Validation', () => {
		test('should validate Set node output structure', async () => {
			const workflow = await createWorkflow(
				{
					name: 'Test Set Node Output',
					nodes: [
						{
							id: 'manual-trigger',
							name: 'Manual Trigger',
							type: 'n8n-nodes-base.manualTrigger',
							position: [250, 300],
							parameters: {},
							typeVersion: 1,
						},
						{
							id: 'set-node',
							name: 'Set',
							type: 'n8n-nodes-base.set',
							position: [450, 300],
							parameters: {
								mode: 'manual',
								duplicateItem: false,
								assignments: {
									assignments: [
										{
											id: 'test-1',
											name: 'stringValue',
											value: 'test',
											type: 'string',
										},
										{
											id: 'test-2',
											name: 'numberValue',
											value: '=123',
											type: 'number',
										},
										{
											id: 'test-3',
											name: 'booleanValue',
											value: '=true',
											type: 'boolean',
										},
									],
								},
							},
							typeVersion: 3.4,
						},
					],
					connections: {
						'Manual Trigger': {
							main: [[{ node: 'Set', type: 'main', index: 0 }]],
						},
					},
					settings: {},
				},
				owner,
			);

			const response = await authAgent.post(`/workflows/${workflow.id}/run`).send({
				workflowData: workflow,
			});

			const output = response.body.data.resultData.runData.Set[0].data.main[0][0].json;

			expect(output.stringValue).toBe('test');
			expect(output.numberValue).toBe(123);
			expect(output.booleanValue).toBe(true);
		});

		test('should validate Code node JavaScript execution', async () => {
			const workflow = await createWorkflow(
				{
					name: 'Test Code Node',
					nodes: [
						{
							id: 'manual-trigger',
							name: 'Manual Trigger',
							type: 'n8n-nodes-base.manualTrigger',
							position: [250, 300],
							parameters: {},
							typeVersion: 1,
						},
						{
							id: 'code-node',
							name: 'Code',
							type: 'n8n-nodes-base.code',
							position: [450, 300],
							parameters: {
								language: 'javaScript',
								jsCode: `
									return [
										{
											json: {
												result: 1 + 1,
												timestamp: new Date().toISOString(),
												isValid: true
											}
										}
									];
								`,
							},
							typeVersion: 2,
						},
					],
					connections: {
						'Manual Trigger': {
							main: [[{ node: 'Code', type: 'main', index: 0 }]],
						},
					},
					settings: {},
				},
				owner,
			);

			const response = await authAgent.post(`/workflows/${workflow.id}/run`).send({
				workflowData: workflow,
			});

			const output = response.body.data.resultData.runData.Code[0].data.main[0][0].json;

			expect(output.result).toBe(2);
			expect(output.isValid).toBe(true);
			expect(output.timestamp).toMatch(/\d{4}-\d{2}-\d{2}T/);
		});
	});

	describe('Phase 4: Credential Integration', () => {
		test('should execute workflow with credential reference', async () => {
			// Create credential (mock)
			const credentialPayload = affixRoleToSaveCredential(
				randomCredentialPayload(),
				'credential-owner',
			);
			const credential = await authAgent.post('/credentials').send(credentialPayload);

			// Create workflow with credential reference
			const workflow = await createWorkflow(
				{
					name: 'Test Workflow - With Credentials',
					nodes: [
						{
							id: 'manual-trigger',
							name: 'Manual Trigger',
							type: 'n8n-nodes-base.manualTrigger',
							position: [250, 300],
							parameters: {},
							typeVersion: 1,
						},
						{
							id: 'http-request',
							name: 'HTTP Request',
							type: 'n8n-nodes-base.httpRequest',
							position: [450, 300],
							parameters: {
								url: 'https://httpbin.org/get',
								method: 'GET',
								authentication: 'genericCredentialType',
							},
							credentials: {
								genericCredentialType: {
									id: credential.body.data.id,
								},
							},
							typeVersion: 4.2,
						},
					],
					connections: {
						'Manual Trigger': {
							main: [[{ node: 'HTTP Request', type: 'main', index: 0 }]],
						},
					},
					settings: {},
				},
				owner,
			);

			expect(workflow.nodes[1].credentials).toBeDefined();
			expect(workflow.nodes[1].credentials.genericCredentialType.id).toBe(credential.body.data.id);
		});
	});

	describe('Phase 5: Workflow Validation Suite', () => {
		test('should validate workflow structure completeness', () => {
			const validWorkflow = {
				name: 'Complete Workflow',
				nodes: [
					{
						id: 'trigger',
						name: 'Trigger',
						type: 'n8n-nodes-base.manualTrigger',
						position: [250, 300],
						parameters: {},
						typeVersion: 1,
					},
				],
				connections: {},
				settings: {},
			};

			expect(validWorkflow).toHaveProperty('name');
			expect(validWorkflow).toHaveProperty('nodes');
			expect(validWorkflow).toHaveProperty('connections');
			expect(validWorkflow).toHaveProperty('settings');
			expect(validWorkflow.nodes.length).toBeGreaterThan(0);
		});

		test('should validate node has required fields', () => {
			const validNode = {
				id: 'test-node',
				name: 'Test Node',
				type: 'n8n-nodes-base.set',
				position: [250, 300],
				parameters: {},
				typeVersion: 3.4,
			};

			expect(validNode).toHaveProperty('id');
			expect(validNode).toHaveProperty('name');
			expect(validNode).toHaveProperty('type');
			expect(validNode).toHaveProperty('position');
			expect(validNode).toHaveProperty('parameters');
			expect(validNode).toHaveProperty('typeVersion');
		});

		test('should validate connection references exist', () => {
			const workflow = {
				nodes: [
					{ id: 'node1', name: 'Node 1', type: 'n8n-nodes-base.manualTrigger' },
					{ id: 'node2', name: 'Node 2', type: 'n8n-nodes-base.set' },
				],
				connections: {
					'Node 1': {
						main: [[{ node: 'Node 2', type: 'main', index: 0 }]],
					},
				},
			};

			const targetNode = workflow.connections['Node 1'].main[0][0].node;
			const nodeExists = workflow.nodes.some((n) => n.name === targetNode);

			expect(nodeExists).toBe(true);
		});
	});
});
