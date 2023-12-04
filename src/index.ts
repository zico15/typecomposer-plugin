import type { Plugin } from 'vite'
import { PWDOptions, PwaBuildPlugin } from "./plugin/pwa";
import typeComposePlugin from "./plugin/base";
import { BuildPlugin } from './plugin/build';

export interface TypeComposeOptions {
    pwa?: PWDOptions;
}

export default function TypeCompose(options: TypeComposeOptions = {}): Plugin<any>[] {
    const { pwa } = options;
    const plugins: Plugin<any>[] = [typeComposePlugin(), BuildPlugin()];
    if (pwa) {
        console.log('activate pwa build');
        console.log('options: ', pwa);
        plugins.push(PwaBuildPlugin(pwa));
    }
    return plugins;
}
