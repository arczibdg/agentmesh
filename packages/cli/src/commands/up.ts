import { Command } from 'commander';
import chalk from 'chalk';
import { MeshRuntime } from '@agentmesh/core';

export const upCommand = new Command('up')
  .description('Start the agent mesh')
  .argument('[agents...]', 'specific agents to start')
  .option('-c, --config <path>', 'path to mesh.yaml', 'mesh.yaml')
  .action(async (agents: string[], opts: { config: string }) => {
    const runtime = new MeshRuntime();

    try {
      await runtime.load({
        configPath: opts.config,
        agentFilter: agents.length > 0 ? agents : undefined,
      });

      const filter = agents.length > 0 ? ` (${agents.join(', ')})` : '';
      console.log(chalk.green(`Mesh started${filter}. Press Ctrl+C to stop.`));

      await runtime.start();

      // Keep process alive
      const shutdown = async () => {
        console.log(chalk.yellow('\nShutting down...'));
        await runtime.stop();
        process.exit(0);
      };

      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err) {
      console.error(chalk.red(`Failed to start mesh: ${(err as Error).message}`));
      process.exit(1);
    }
  });
