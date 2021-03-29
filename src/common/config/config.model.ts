export interface ConfigPath {
    relative: boolean;
    path: string;
}

export interface Config {
    appName: string;
    es_host: string;
    es_port: string,
    writeback_index: string;
    port: number;
    wsport: number;
    elastalertPath: string;
    start?: Date;
    end?: Date;
    verbose: boolean;
    es_debug: boolean;
    debug: boolean;
    rulesPath: ConfigPath;
    templatesPath: ConfigPath;
    dataPath: ConfigPath;
}