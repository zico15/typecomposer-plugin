import type { Plugin } from 'vite'
import { PWDOptions, PwaBuildPlugin } from "./plugin/pwa";
import typeComposePlugin from "./plugin/base";
import { BuildPlugin } from './plugin/build';
import { ProjectBuild } from './plugin/transpilator/ProjectBuild';

export interface TypeComposeOptions {
    pwa?: PWDOptions;
}

export default function TypeCompose(options: TypeComposeOptions = {}): Plugin<any>[] {
    const { pwa } = options;
    const project = new ProjectBuild();
    const plugins: Plugin<any>[] = [typeComposePlugin(project), BuildPlugin(project)];
    if (pwa) {
        console.log('activate pwa build');
        // console.log('options: ', pwa);
        plugins.push(PwaBuildPlugin(pwa));
    }
    return [typeComposePlugin(project)];
}
