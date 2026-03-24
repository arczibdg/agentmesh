import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { parseConfig, validateConfig } from '@agentmesh/core';

export const validateCommand = new Command('validate')
  .description('Validate mesh.yaml configuration')
  .option('-c, --config <path>', 'path to mesh.yaml', 'mesh.yaml')
  .action((opts: { config: string }) => {
    try {
      const yaml = readFileSync(opts.config, 'utf-8');
      const config = parseConfig(yaml);
      validateConfig(config);

      const agentCount = Object.keys(config.agents).length;
      const mcpCount = config.mcp ? Object.keys(config.mcp).length : 0;

      console.log(chalk.green('Config is valid.'));
      console.log(`  Agents:      ${agentCount}`);
      console.log(`  MCP servers: ${mcpCount}`);
    } catch (err) {
      console.error(chalk.red(`Validation failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });
