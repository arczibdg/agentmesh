import { Command } from 'commander';
import chalk from 'chalk';
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';

const MESH_YAML = `# mesh.yaml — AgentMesh configuration
version: "1"

defaults:
  model: claude-sonnet-4-6
  timeout: 120s
  retries: 3

memory:
  namespaces:
    - shared

agents:
  assistant:
    role: "General-purpose AI assistant"
    memory:
      read: [shared]
      write: [shared]
`;

const DOT_ENV = `# AgentMesh environment variables
# ANTHROPIC_API_KEY=sk-ant-...
# OPENAI_API_KEY=sk-...
`;

const GITIGNORE = `.agentmesh/
.env
*.db
node_modules/
`;

function writeIfMissing(path: string, content: string, label: string): void {
  if (existsSync(path)) {
    console.log(chalk.yellow(`  skip  ${label} (already exists)`));
    return;
  }
  writeFileSync(path, content, 'utf-8');
  console.log(chalk.green(`  create  ${label}`));
}

export const initCommand = new Command('init')
  .description('Scaffold a new AgentMesh project (mesh.yaml, .env, .gitignore)')
  .action(() => {
    console.log(chalk.bold('Initializing AgentMesh project...\n'));

    writeIfMissing('mesh.yaml', MESH_YAML, 'mesh.yaml');
    writeIfMissing('.env', DOT_ENV, '.env');
    writeIfMissing('.gitignore', GITIGNORE, '.gitignore');

    if (!existsSync('.agentmesh')) {
      mkdirSync('.agentmesh', { recursive: true });
      console.log(chalk.green('  create  .agentmesh/'));
    } else {
      console.log(chalk.yellow('  skip  .agentmesh/ (already exists)'));
    }

    console.log(chalk.bold('\nDone. Edit mesh.yaml to configure your agents.'));
  });
