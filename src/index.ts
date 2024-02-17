import type { Plugin } from 'vite'
import { PWDOptions, PwaBuildPlugin } from "./plugin/pwa";
import typeComposerPlugin from "./plugin/transpilator";
import { BuildPlugin } from './plugin/build';
import { ProjectBuild } from './plugin/transpilator/ProjectBuild';

export interface TypeComposerOptions {
    pwa?: PWDOptions;
}

export default function TypeComposer(options: TypeComposerOptions = {}): Plugin<any>[] {
    const { pwa } = options;
    const project = new ProjectBuild();
    const plugins: Plugin<any>[] = [typeComposerPlugin(project), BuildPlugin(project)];
    if (pwa) {
        console.log('activate pwa build');
        // console.log('options: ', pwa);
        plugins.push(PwaBuildPlugin(pwa));
    }
    return [typeComposerPlugin(project)];
}
