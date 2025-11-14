#!/usr/bin/env tsx
/**
 * Script to catalog all n8n nodes for Claude Code multi-agent system
 * Extracts node metadata, parameters, and categorization
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

interface NodeMetadata {
	name: string;
	displayName: string;
	description: string;
	group: string[];
	version: number | number[];
	category: 'trigger' | 'action' | 'ai' | 'utility';
	inputs: string[];
	outputs: string[];
	hasCredentials: boolean;
	parameterCount: number;
	filePath: string;
}

interface NodeCatalog {
	totalNodes: number;
	categories: {
		triggers: NodeMetadata[];
		actions: NodeMetadata[];
		ai: NodeMetadata[];
		utilities: NodeMetadata[];
	};
	byGroup: Record<string, NodeMetadata[]>;
	taxonomy: {
		dataProcessing: string[];
		communication: string[];
		cloudServices: string[];
		ai: string[];
		automation: string[];
		other: string[];
	};
}

async function findNodeFiles(dir: string): Promise<string[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await findNodeFiles(fullPath)));
		} else if (entry.name.endsWith('.node.ts')) {
			files.push(fullPath);
		}
	}

	return files;
}

function extractNodeMetadata(content: string, filePath: string): NodeMetadata | null {
	// Extract class name
	const classMatch = content.match(/export class (\w+) implements INodeType/);
	if (!classMatch) return null;

	// Extract description object
	const descMatch = content.match(/description:\s*INodeTypeDescription\s*=\s*\{([\s\S]*?)\n\t\}/);
	if (!descMatch) return null;

	const descContent = descMatch[1];

	// Extract key fields
	const displayName = descContent.match(/displayName:\s*['"]([^'"]+)['"]/)?.[1] || '';
	const name = descContent.match(/name:\s*['"]([^'"]+)['"]/)?.[1] || '';
	const description = descContent.match(/description:\s*['"]([^'"]+)['"]/)?.[1] || '';
	const groupMatch = descContent.match(/group:\s*\[(.*?)\]/);
	const group = groupMatch
		? groupMatch[1]
				.split(',')
				.map((g) => g.trim().replace(/['"]/g, ''))
		: [];

	// Extract version
	const versionMatch = descContent.match(/version:\s*(\[[\d,\s.]+\]|\d+\.?\d*)/);
	const version = versionMatch ? eval(versionMatch[1]) : 1;

	// Categorize
	const isTrigger = group.includes('trigger') || name.toLowerCase().includes('trigger');
	const isAI =
		group.includes('ai') ||
		name.toLowerCase().includes('ai') ||
		name.toLowerCase().includes('langchain') ||
		name.toLowerCase().includes('mistral') ||
		name.toLowerCase().includes('openai');

	const category = isTrigger ? 'trigger' : isAI ? 'ai' : group.includes('core') ? 'utility' : 'action';

	// Extract inputs/outputs
	const inputsMatch = descContent.match(/inputs:\s*\[(.*?)\]/s);
	const inputs = inputsMatch
		? inputsMatch[1]
				.split(',')
				.map((i) => i.trim())
				.filter(Boolean)
		: [];

	const outputsMatch = descContent.match(/outputs:\s*\[(.*?)\]/s);
	const outputs = outputsMatch
		? outputsMatch[1]
				.split(',')
				.map((o) => o.trim())
				.filter(Boolean)
		: [];

	// Check for credentials
	const hasCredentials = content.includes('credentials:');

	// Count parameters
	const propertiesMatch = descContent.match(/properties:\s*\[([\s\S]*?)\n\t\],/);
	const parameterCount = propertiesMatch
		? (propertiesMatch[1].match(/\{[^{]*?displayName:/g) || []).length
		: 0;

	return {
		name,
		displayName,
		description,
		group,
		version,
		category,
		inputs,
		outputs,
		hasCredentials,
		parameterCount,
		filePath,
	};
}

function categorizeByDomain(metadata: NodeMetadata[]): NodeCatalog['taxonomy'] {
	const taxonomy: NodeCatalog['taxonomy'] = {
		dataProcessing: [],
		communication: [],
		cloudServices: [],
		ai: [],
		automation: [],
		other: [],
	};

	for (const node of metadata) {
		const name = node.name.toLowerCase();

		if (
			name.includes('ai') ||
			name.includes('langchain') ||
			name.includes('openai') ||
			name.includes('mistral') ||
			name.includes('embedding')
		) {
			taxonomy.ai.push(node.name);
		} else if (
			name.includes('mail') ||
			name.includes('slack') ||
			name.includes('discord') ||
			name.includes('telegram') ||
			name.includes('webhook')
		) {
			taxonomy.communication.push(node.name);
		} else if (
			name.includes('aws') ||
			name.includes('google') ||
			name.includes('azure') ||
			name.includes('s3') ||
			name.includes('dropbox')
		) {
			taxonomy.cloudServices.push(node.name);
		} else if (
			name.includes('filter') ||
			name.includes('merge') ||
			name.includes('split') ||
			name.includes('aggregate') ||
			name.includes('code')
		) {
			taxonomy.dataProcessing.push(node.name);
		} else if (
			name.includes('schedule') ||
			name.includes('cron') ||
			name.includes('wait') ||
			name.includes('loop')
		) {
			taxonomy.automation.push(node.name);
		} else {
			taxonomy.other.push(node.name);
		}
	}

	return taxonomy;
}

async function main() {
	const nodesDirs = [
		join(process.cwd(), 'packages/nodes-base/nodes'),
		join(process.cwd(), 'packages/@n8n/nodes-langchain/nodes'),
	];

	console.log('🔍 Scanning n8n nodes directories');
	let nodeFiles: string[] = [];

	for (const dir of nodesDirs) {
		const files = await findNodeFiles(dir);
		nodeFiles.push(...files);
		console.log(`📁 Found ${files.length} node files in ${dir.split('/').pop()}`);
	}

	const allMetadata: NodeMetadata[] = [];
	const catalog: NodeCatalog = {
		totalNodes: 0,
		categories: {
			triggers: [],
			actions: [],
			ai: [],
			utilities: [],
		},
		byGroup: {},
		taxonomy: {
			dataProcessing: [],
			communication: [],
			cloudServices: [],
			ai: [],
			automation: [],
			other: [],
		},
	};

	for (const file of nodeFiles) {
		try {
			const content = await readFile(file, 'utf-8');
			const metadata = extractNodeMetadata(content, file);

			if (metadata) {
				allMetadata.push(metadata);

				// Categorize
				if (metadata.category === 'trigger') {
					catalog.categories.triggers.push(metadata);
				} else if (metadata.category === 'ai') {
					catalog.categories.ai.push(metadata);
				} else if (metadata.category === 'utility') {
					catalog.categories.utilities.push(metadata);
				} else {
					catalog.categories.actions.push(metadata);
				}

				// Group by group tags
				for (const group of metadata.group) {
					if (!catalog.byGroup[group]) {
						catalog.byGroup[group] = [];
					}
					catalog.byGroup[group].push(metadata);
				}
			}
		} catch (error) {
			console.error(`❌ Error processing ${file}:`, error);
		}
	}

	catalog.totalNodes = allMetadata.length;
	catalog.taxonomy = categorizeByDomain(allMetadata);

	// Write catalog
	const outputPath = join(process.cwd(), '.claude/knowledge/n8n-node-catalog.json');
	await writeFile(outputPath, JSON.stringify(catalog, null, 2));

	console.log('\n✅ Catalog complete!');
	console.log(`📊 Total nodes: ${catalog.totalNodes}`);
	console.log(`   Triggers: ${catalog.categories.triggers.length}`);
	console.log(`   Actions: ${catalog.categories.actions.length}`);
	console.log(`   AI nodes: ${catalog.categories.ai.length}`);
	console.log(`   Utilities: ${catalog.categories.utilities.length}`);
	console.log(`\n📖 Taxonomy breakdown:`);
	console.log(`   Data Processing: ${catalog.taxonomy.dataProcessing.length}`);
	console.log(`   Communication: ${catalog.taxonomy.communication.length}`);
	console.log(`   Cloud Services: ${catalog.taxonomy.cloudServices.length}`);
	console.log(`   AI: ${catalog.taxonomy.ai.length}`);
	console.log(`   Automation: ${catalog.taxonomy.automation.length}`);
	console.log(`   Other: ${catalog.taxonomy.other.length}`);
	console.log(`\n💾 Saved to: ${outputPath}`);
}

main().catch(console.error);
