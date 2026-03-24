import { Command } from 'commander';
import chalk from 'chalk';

export const logsCommand = new Command('logs')
  .description('Stream agent logs')
  .action(() => {
    console.log(chalk.yellow('Requires a running mesh (IPC not yet implemented — v0.2 feature).'));
  });
