import { type UserConfig } from 'vite';
export interface CreateViteConfigOptions {
    appName: string;
    port: number;
    rootDir: string;
}
export declare function createViteConfig(options: CreateViteConfigOptions): UserConfig;
