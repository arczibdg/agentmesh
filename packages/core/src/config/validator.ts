import Ajv from 'ajv';

const SCHEMA: Record<string, unknown> = {
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AgentMesh Configuration",
  "description": "Schema for mesh.yaml configuration files",
  "type": "object",
  "required": ["version", "agents"],
  "additionalProperties": false,
  "properties": {
    "version": {
      "type": "string",
      "enum": ["1"],
      "description": "Config schema version"
    },
    "defaults": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "model": { "type": "string" },
        "timeout": { "type": "string", "pattern": "^\\d+s$" },
        "retries": { "type": "integer", "minimum": 0, "maximum": 10 },
        "checkpoint": { "type": "boolean" }
      }
    },
    "memory": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "store": { "type": "string" },
        "path": { "type": "string" },
        "namespaces": {
          "type": "array",
          "items": { "type": "string" }
        }
      }
    },
    "mcp": {
      "type": "object",
      "additionalProperties": {
        "$ref": "#/$defs/mcpServer"
      }
    },
    "agents": {
      "type": "object",
      "minProperties": 1,
      "additionalProperties": {
        "$ref": "#/$defs/agent"
      }
    }
  },
  "$defs": {
    "mcpServer": {
      "type": "object",
      "required": ["command"],
      "additionalProperties": false,
      "properties": {
        "command": { "type": "string" },
        "args": {
          "type": "array",
          "items": { "type": "string" }
        },
        "env": {
          "type": "object",
          "additionalProperties": { "type": "string" }
        }
      }
    },
    "agent": {
      "type": "object",
      "required": ["role"],
      "additionalProperties": false,
      "properties": {
        "role": { "type": "string" },
        "model": { "type": "string" },
        "extends": { "type": "string" },
        "tools": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "mcp": {
              "type": "array",
              "items": { "type": "string" }
            },
            "http": {
              "type": "array",
              "items": { "$ref": "#/$defs/httpTool" }
            }
          }
        },
        "memory": {
          "type": "object",
          "additionalProperties": false,
          "properties": {
            "read": {
              "type": "array",
              "items": { "type": "string" }
            },
            "write": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "listen": {
          "type": "array",
          "items": { "$ref": "#/$defs/listenEntry" }
        },
        "triggers": {
          "type": "array",
          "items": { "$ref": "#/$defs/trigger" }
        },
        "timeout": { "type": "string", "pattern": "^\\d+s$" },
        "retries": { "type": "integer", "minimum": 0, "maximum": 10 },
        "checkpoint": { "type": "boolean" },
        "config": {
          "type": "object"
        }
      }
    },
    "httpTool": {
      "type": "object",
      "required": ["name", "url"],
      "additionalProperties": false,
      "properties": {
        "name": { "type": "string" },
        "url": { "type": "string" },
        "auth": { "type": "string" }
      }
    },
    "listenEntry": {
      "type": "object",
      "required": ["from", "on"],
      "additionalProperties": false,
      "properties": {
        "from": { "type": "string" },
        "on": { "type": "string" }
      }
    },
    "trigger": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "event": { "type": "string" },
        "cron": { "type": "string" }
      }
    }
  }
};

export function validateConfig(config: unknown): void {
  const schema = { ...SCHEMA };
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
