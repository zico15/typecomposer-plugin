import type { Plugin } from 'vite'
import { PWDOptions, PwaBuildPlugin } from "./plugin/pwa";
import typeComposerPlugin from "./plugin/transpilator";
import { BuildPlugin } from './plugin/build';
import { ProjectBuild } from './plugin/transpilator/ProjectBuild';
import { Debuger } from './plugin/Debug/Log';

export interface TypeComposerOptions {
    pwa?: PWDOptions;
    debuger?: boolean;
}

export default function TypeComposer(options: TypeComposerOptions = {}): Plugin<any>[] {
    const { pwa } = options;
    Debuger.isDebug = options.debuger || false;
    Debuger.log('activate typecomposer debuger');
    const project = new ProjectBuild();
    const plugins: Plugin<any>[] = [typeComposerPlugin(project), BuildPlugin(project)];
    if (pwa) {
        Debuger.log('activate pwa build');
        plugins.push(PwaBuildPlugin(pwa));
    }
    return [typeComposerPlugin(project)];
}
