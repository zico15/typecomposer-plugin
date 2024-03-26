import { Plugin, ViteDevServer } from 'vite';
import { StyleBuild } from './base/Style';
import { ProjectBuild } from './ProjectBuild';
import { ChangeEvent } from './Interfaces';
/**
 * TypeCompose plugin function for project analysis and transformation during pre-build.
 * This plugin is responsible for analyzing the project and applying transformations
 * necessary to ensure that the code is compatible with browsers.
 *
 * @param project - Object that represents the project to be built.
 * @returns A plugin that analyzes and transforms the code during pre-build.
 */
export default function typeComposerPlugin(project: ProjectBuild): Plugin {

    return {
        name: 'typescript-elements',
        enforce: 'pre',
        watchChange(id: string, change: { event: ChangeEvent }) {
            project.watchChange(id, change);
        },
        resolveDynamicImport({ }, importee, importer) {
            return importee;
        },
        configureServer(server: ViteDevServer) {
        },
        async buildStart() {
            await project.buildStart();
        },
        transformIndexHtml(html) {
            if (!html.includes("typecomposer-plugin/public/safari-polyfill.ts")) {
                html = html.replace("<head>", `<head>
                <script
                type="module"
                src="/node_modules/typecomposer-plugin/public/safari-polyfill.ts"
              ></script>
              <script
                type="module"
                src="/node_modules/typecomposer/dist/esm/global/global.js"
              ></script>
              `);
            }
            return html;
        },
        generateBundle(options, bundle) {

        },
        writeBundle(options, bundle) {

        },
        async configResolved(config) {
            project.projectDir = config.root + "/src";
            project.indexPath = config.root + '/index.html';
            // StyleBuild.clear();
        },
        async load(id) {

            if (id.includes(StyleBuild.identifier)) {
                const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
                if (fileInfo) {
                    // console.log('load:', id);
                    // console.log('styleCode: ', project.styleCode);
                    return fileInfo.styleCode;
                }
            }
            return null;
        },
        async resolveId(id, importer) {
            if (id.includes(StyleBuild.identifier)) {
                const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
                if (fileInfo) {
                    return {
                        id: id,
                        external: true,
                        context: fileInfo.styleCode,
                        moduleSideEffects: false,
                    };
                }
            }
        },
        async handleHotUpdate({ file, server }) {
            if (file.endsWith('.html')) {
                project.isFileTemplate(file);
                // console.log('handleHotUpdate:', file);
                for await (const fileInfo of project.files.values()) {
                    if (fileInfo.templatesUrl.length > 0 && fileInfo.templatesUrl.includes(file)) {
                        // console.log('handleHotUpdate:templatesUrl ', fileInfo.path);
                        console.log('handleHotUpdate:templatesUrl ', fileInfo.path);
                        project.sendServerUpdate(fileInfo);
                        server.ws.send({
                            type: 'custom',
                            event: 'file-changed',
                            data: {
                                path: fileInfo.path,
                                change: 'reload'
                            }
                        });
                    }
                }
            }

            // const module = server.moduleGraph.getModuleById("virtual:/base/style-base.scss?direct");
            // console.log('module: ', module);
            // if (module && module.transformResult) {
            //     console.log('handleHotUpdate:', module.transformResult.code);
            //     project.server.moduleGraph.invalidateModule(module);
            // }


        },
        async transform(code, id) {
            // console.log('transform:', id);ß
            if (!id.includes("node_modules"))
                return await project.transform(code, id);
        },
    };
}


