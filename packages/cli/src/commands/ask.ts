import { Command } from 'commander';
import chalk from 'chalk';

export const askCommand = new Command('ask')
  .description('Send a prompt to a running agent')
  .action(() => {
    console.log(chalk.yellow('Requires a running mesh (IPC not yet implemented — v0.2 feature).'));
  });
