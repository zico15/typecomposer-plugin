import { Plugin, ViteDevServer } from 'vite';
import { ProjectBuild } from './ProjectBuild';

export default function typeComposePlugin(): Plugin {
    let project: ProjectBuild;

    return {
        name: 'typescript-elements',
        enforce: 'pre',
        resolveDynamicImport({ }, importee, importer) {
            console.log('resolveDynamicImport:', importee, importer);
            return importee;
        },
        configureServer(server: ViteDevServer) {
            console.log('config: ', server != undefined);
        },
        async buildStart() {
            console.log('buildStart:');
            project = new ProjectBuild();

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
            if (id.includes(`virtual:stylebase`)) {
                const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
                if (fileInfo) {
                    console.log('load:', id);
                    // console.log('styleCode: ', project.styleCode);
                    return fileInfo.styleCode;
                }
            }
            return null;
        },
        async resolveId(id, importer) {
            const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
            if (fileInfo) {

                // const code = `
                // body {
                //     background-color: red !important;
                // };`
                // // Retorne o ID do módulo virtual
                // const virtualId = `virtual:${id}`;
                // console.log('resolveId:', id, virtualId);

                // zera o cache do módulo virtual
                return {
                    id: id,
                    external: true,
                    context: fileInfo.styleCode,
                };
            }
        },
        async handleHotUpdate({ file, server }) {
            if (file.endsWith('.html')) {
                console.log('handleHotUpdate:', file);
                for await (const fileInfo of project.files.values()) {
                    if (fileInfo.templatesUrl.length > 0 && fileInfo.templatesUrl.includes(file)) {
                        console.log('handleHotUpdate:templatesUrl ', fileInfo.path);
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
        async transform(code, path) {
            if (path.endsWith('.ts') && !path.includes("node_modules/typecompose-plugin")) {

                code = await project.analyze(path, code);
                if (path.includes("main.ts")) {
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
            return code;
        },
    };
}


