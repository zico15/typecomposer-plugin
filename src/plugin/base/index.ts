import { Plugin, ViteDevServer } from 'vite';
import { ProjectBuild } from './ProjectBuild';
import { StyleBuild } from './Style';

export default function typeComposePlugin(project: ProjectBuild): Plugin {

    return {
        name: 'typescript-elements',
        enforce: 'pre',
        resolveDynamicImport({ }, importee, importer) {
            return importee;
        },
        configureServer(server: ViteDevServer) {
            // console.log('config: ', server != undefined);
        },
        async buildStart() {
            console.log('buildStart:');
        },
        transformIndexHtml(html) {
            if (!html.includes("typecompose-plugin/public/safari-polyfill.ts")) {
                html = html.replace("<head>", `<head>
                <script
                type="module"
                src="/node_modules/typecompose-plugin/public/safari-polyfill.ts"
              ></script>`);
            }
            return html;
        },
        generateBundle(options, bundle) {

        },
        writeBundle(options, bundle) {

        },
        async configResolved(config) {
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
                // console.log('handleHotUpdate:', file);
                for await (const fileInfo of project.files.values()) {
                    if (fileInfo.templatesUrl.length > 0 && fileInfo.templatesUrl.includes(file)) {
                        // console.log('handleHotUpdate:templatesUrl ', fileInfo.path);
                        project.sendServerUpdate(fileInfo);
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
            if (id.endsWith('.ts') && !id.includes("node_modules/typecompose-plugin")) {

                code = await project.analyze(id, code);
                if (id.includes("main.ts")) {
                    // const stylePath = project.path + "public/style.scss";
                    // console.log('transform:', stylePath, " isExists:", existsSync(stylePath));
                    // const styleBase = `
                    // body {
                    //     background-color: red !important;
                    // };
                    // `
                    // writeFileSync(stylePath, styleBase);
                    // execFileSync()
                }
            }
            else if (id.includes(StyleBuild.identifier)) {
                // console.log('transform:', id);
                const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
                if (fileInfo) {
                    // console.log('styleCode: ', project.styleCode);
                    return fileInfo.styleCode;
                }
            }
            return code;
        },
    };
}


