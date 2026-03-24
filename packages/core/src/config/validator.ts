import Ajv from 'ajv';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

let cachedSchema: Record<string, unknown> | null = null;

function findSchemaFile(): string {
  // Walk up from cwd looking for schema.json (works regardless of CJS/ESM)
  let dir = process.cwd();
  while (true) {
    const candidate = join(dir, 'schema.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('schema.json not found. Run from the agentmesh project root.');
}

function loadSchema(): Record<string, unknown> {
  if (cachedSchema) return cachedSchema;
  cachedSchema = JSON.parse(readFileSync(findSchemaFile(), 'utf-8')) as Record<string, unknown>;
  return cachedSchema;
}

export function validateConfig(config: unknown): void {
  const schema = { ...loadSchema() };
  // Remove $schema keyword — Ajv draft-07 doesn't recognize draft/2020-12
  delete schema['$schema'];
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);
  const valid = validate(config);

  if (!valid && validate.errors) {
    const messages = validate.errors.map((err) => {
      if (err.keyword === 'additionalProperties') {
        const field = (err.params as { additionalProperty?: string }).additionalProperty;
        return `Unknown field '${field}' at ${err.instancePath || '/'}`;
      }
      if (err.keyword === 'enum') {
        return `Invalid value at ${err.instancePath}: ${err.message}`;
      }
      if (err.keyword === 'required') {
        const prop = (err.params as { missingProperty?: string }).missingProperty;
        return `Missing required field '${prop}' at ${err.instancePath || '/'}`;
      }
      if (err.keyword === 'minProperties') {
        return `${err.instancePath} must have at least 1 entry`;
      }
      return `${err.instancePath}: ${err.message}`;
    });

    throw new Error(`Config validation failed:\n  - ${messages.join('\n  - ')}`);
  }
}
