// Defines the config's Zod schema
import { z } from 'zod';

// Joi converted strings to numbers/booleans by default, keep accepting them
const num = z.union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/).transform(Number)]);
const bool = z.union([z.boolean(), z.stringbool()]);
const isoDate = z.union([z.iso.date(), z.iso.datetime({ offset: true, local: true })]).transform((s) => new Date(s));

const configPath = (defaultPath: string) => z.object({
  relative: bool.default(true),
  path: z.string().default(defaultPath),
}).strict().prefault({});

const schema = z.object({
  appName: z.string().default('elastalert-server'),
  es_host: z.string().default('elastalert'),
  es_port: num.default(9200),
  es_username: z.string().default(''),
  es_password: z.string().default(''),
  es_ssl: bool.default(false),
  ea_verify_certs: bool.default(false),
  es_ca_certs: z.string().default(''),
  es_client_cert: z.string().default(''),
  es_client_key: z.string().default(''),
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
}).strict().refine((c) => !c.start || !c.end || c.end > c.start, {
  message: '"end" must be greater than "start"',
  path: ['end'],
});

export default schema;
