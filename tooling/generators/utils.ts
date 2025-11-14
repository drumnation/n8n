import fs from 'fs/promises';
import path from 'path';

export async function getWorkspacePackages(): Promise<string[]> {
  const packages: string[] = [];
  const dirs = ['packages', 'plugins'];

  for (const dir of dirs) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packageJsonPath = path.join(dir, entry.name, 'package.json');
          try {
            const packageJson = JSON.parse(
              await fs.readFile(packageJsonPath, 'utf-8')
            );
            packages.push(packageJson.name);
          } catch {
            // Skip if package.json doesn't exist or is invalid
          }
        }
      }
    } catch {
      // Skip if directory doesn't exist
    }
  }

  return packages;
}

export function toCamelCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

export function pascalCase(str: string): string {
  return str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}