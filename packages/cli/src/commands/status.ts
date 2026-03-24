import { Command } from 'commander';
import chalk from 'chalk';

export const statusCommand = new Command('status')
  .description('Show mesh and agent status')
  .action(() => {
    console.log(chalk.yellow('Requires a running mesh (IPC not yet implemented — v0.2 feature).'));
  });
