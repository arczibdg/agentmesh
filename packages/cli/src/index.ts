import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { upCommand } from './commands/up.js';
import { validateCommand } from './commands/validate.js';
import { doctorCommand } from './commands/doctor.js';

const program = new Command();

program
  .name('agentmesh')
  .description('AgentMesh — multi-agent orchestration CLI')
  .version('0.1.0');

program.addCommand(initCommand);
program.addCommand(upCommand);
program.addCommand(validateCommand);
program.addCommand(doctorCommand);

program.parse();
