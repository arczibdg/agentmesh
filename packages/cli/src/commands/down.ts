import { Command } from 'commander';
import chalk from 'chalk';

export const downCommand = new Command('down')
  .description('Stop the running mesh')
  .action(() => {
    console.log(chalk.yellow('Requires a running mesh (IPC not yet implemented — v0.2 feature).'));
  });
