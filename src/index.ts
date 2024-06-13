import type { Plugin } from 'vite'
import { ProjectBuild } from './plugin/transpilator/ProjectBuild';
import { Debuger } from './plugin/Debug/Log';
import { TypeComposer } from './plugin/transpilator/typecomposer';
import { TypeComposerBuild } from './plugin/build';
import { TypeComposerPWA } from './plugin/pwa';

export interface TypeComposerOptions {
    pwa?: TypeComposerPWA.PWDOptions;
    debuger?: boolean;
}

export default function typeComposer(options: TypeComposerOptions = {}): Plugin<any>[] {
    const { pwa } = options;
    Debuger.isDebug = options.debuger || false;
    Debuger.log('activate typecomposer debuger');
    const project = new ProjectBuild(options);
    const plugins: Plugin<any>[] = [TypeComposer.plugin(project), TypeComposerBuild.plugin(project)];
    if (pwa) {
        Debuger.log('activate pwa build');
        plugins.push(TypeComposerPWA.plugin(pwa));
    }
    return plugins;
}
