export interface ConfigPath {
    relative: boolean;
    path: string;
}

export interface Config {
    appName: string;
    es_host: string;
    es_port: string;
    es_username: string;
    es_password: string;
    es_ssl: boolean;
    ea_verify_certs: boolean;
    es_ca_certs: string;
    es_client_cert: string;
    es_client_key: string;
    writeback_index: string;
    port: number;
    wsport: number;
    elastalertPath: string;
    start?: Date;
    end?: Date;
    verbose: boolean;
    es_debug: boolean;
    debug: boolean;
    prometheus_port: number;
    rulesPath: ConfigPath;
    templatesPath: ConfigPath;
    dataPath: ConfigPath;
}