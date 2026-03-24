import { Command } from 'commander';
import chalk from 'chalk';
import { readFileSync, existsSync } from 'node:fs';
import { parseConfig, validateConfig, parseModelString } from '@agentmesh/core';

const ENV_VAR_MAP: Record<string, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  google: 'GOOGLE_API_KEY',
};

async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch('http://localhost:11434');
    return res.ok;
  } catch {
    return false;
  }
}

export const doctorCommand = new Command('doctor')
  .description('Check environment and configuration health')
  .option('-c, --config <path>', 'path to mesh.yaml', 'mesh.yaml')
  .action(async (opts: { config: string }) => {
    let hasErrors = false;

    // Check 1: Config file exists
    if (!existsSync(opts.config)) {
      console.log(chalk.red(`[FAIL] Config file not found: ${opts.config}`));
      console.log(chalk.dim('  Run "agentmesh init" to create one.'));
      process.exit(1);
    }
    console.log(chalk.green(`[OK]   Config file exists: ${opts.config}`));

    // Check 2: Config is valid
    let config;
    try {
      const yaml = readFileSync(opts.config, 'utf-8');
      config = parseConfig(yaml);
      validateConfig(config);
      console.log(chalk.green('[OK]   Config is valid'));
    } catch (err) {
      console.log(chalk.red(`[FAIL] Config is invalid: ${(err as Error).message}`));
      process.exit(1);
    }

    // Check 3: Model credentials
    const models = new Set<string>();
    for (const agent of Object.values(config.agents)) {
      if (agent.model) models.add(agent.model);
    }

    let ollamaChecked = false;
    let ollamaReachable = false;

    for (const model of models) {
      const parsed = parseModelString(model);

      if (parsed.provider === 'ollama') {
        if (!ollamaChecked) {
          ollamaChecked = true;
          ollamaReachable = await checkOllama();
        }
        if (ollamaReachable) {
          console.log(chalk.green(`[OK]   Ollama reachable for model "${model}"`));
        } else {
          console.log(chalk.red(`[FAIL] Ollama not reachable at localhost:11434 for model "${model}"`));
          hasErrors = true;
        }
        continue;
      }

      const envVar = ENV_VAR_MAP[parsed.provider];
      if (!envVar) {
        console.log(chalk.yellow(`[WARN] Unknown provider "${parsed.provider}" for model "${model}"`));
        continue;
      }

      if (process.env[envVar]) {
        console.log(chalk.green(`[OK]   ${envVar} is set for model "${model}"`));
      } else {
        console.log(chalk.red(`[FAIL] ${envVar} is not set (required for model "${model}")`));
        hasErrors = true;
      }
    }

    if (hasErrors) {
      console.log(chalk.red('\nSome checks failed.'));
      process.exit(1);
    } else {
      console.log(chalk.green('\nAll checks passed.'));
    }
  });
