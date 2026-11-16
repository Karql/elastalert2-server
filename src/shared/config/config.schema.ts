// Config file (config/config.json) schema; the Config type is inferred from it
import { z } from 'zod';
import { logFormats, logLevels } from '../logger/logging';

// Joi converted strings to numbers/booleans by default, keep accepting them
const num = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number)]);
const bool = z.union([z.boolean(), z.stringbool()]);
const isoDate = z.union([z.iso.date(), z.iso.datetime({ offset: true, local: true })]).transform((s) => new Date(s));

const configPath = (defaultPath: string) => z.object({
  relative: bool.default(true),
  path: z.string().default(defaultPath),
}).strict().prefault({});

export const configSchema = z.object({
  appName: z.string().default('elastalert-server'),
  writeback_index: z.string().default('elastalert_status'),
  port: num.default(3030),
  wsport: num.default(3333),
  elastalertPath: z.string().default('/opt/elastalert'),
  start: isoDate.optional(),
  end: isoDate.optional(),
  verbose: bool.default(false),
  es_debug: bool.default(false),
  debug: bool.default(false),
  prometheus_port: num.nullable().default(null),
  rulesPath: configPath('/rules'),
  templatesPath: configPath('/rule_templates'),
  dataPath: configPath('/server_data'),
  logging: z.object({
    level: z.enum(logLevels).default('info'),
    format: z.enum(logFormats).default('json'),
  }).strict().prefault({}),
}).strict().refine((c) => !c.start || !c.end || c.end > c.start, {
  message: '"end" must be greater than "start"',
  path: ['end'],
});

/**
 * Options of the removed Elasticsearch endpoints (/metadata, /mapping, /search).
 * Still accepted so existing config files keep working, but ignored.
 * TODO: remove in the next major version
 */
export const deprecatedConfigKeys = [
  'es_host',
  'es_port',
  'es_username',
  'es_password',
  'es_ssl',
  'ea_verify_certs',
  'es_ca_certs',
  'es_client_cert',
  'es_client_key',
] as const;

export type Config = z.infer<typeof configSchema>;
export type ConfigPath = Config['rulesPath'];
