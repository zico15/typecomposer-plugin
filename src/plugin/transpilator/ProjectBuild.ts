import { ClassDeclaration, Decorator, Project, SourceFile } from 'ts-morph';
import { utimesSync, readdirSync, statSync, existsSync, readFileSync } from 'node:fs';
import { RegisterBuild } from './base/Register';
import { StyleBuild } from './base/Style';
import { FileInfo, ClassInfo, ChangeEvent, printFileInfo } from './Interfaces';
import path from 'node:path';
import { TemplateBuild } from './base/Template';
import { Router } from './base/RouterController';
import { Theme } from './base/ThemeController';
import { RefBuild } from './base/Ref';
import { Debuger } from '../Debug/Log';
import { TypeComposerOptions } from '../..';
import * as os from 'os';

export class ProjectBuild extends Project {

    public files: Map<string, FileInfo> = new Map<string, FileInfo>();
    public path: string;
    public projectDir: string = ""
    public indexPath: string = "";
    public stylePath: string;
    public styleCode: string = "";
    public pathClassMain: string = "";
    public routerPath: string = "";
    public outputDir: string = "";

    constructor(public options: TypeComposerOptions) {
        super();
        this.path = this.getSourceFiles().find(e => e.getFilePath().includes("node_modules/typecomposer-plugin"))?.getFilePath() || "";
        if (this.path != "")
            this.path = this.path.split("node_modules/typecomposer-plugin/")[0] + "node_modules/typecomposer-plugin/";
        this.stylePath = this.path + "public/style.scss";
        this.load_node_modules_dependencys();
    }

    public async load_node_modules_dependencys() {
        const listaDependencies: any[] = ['node_modules/typecomposer'];
        try {
            const itens = readdirSync("node_modules");
            const pacotes = itens.filter(item => statSync(path.join("node_modules", item)).
                isDirectory() && item !== "." && item !== "..").map(item => path.join("node_modules", path.join(item, "package.json"))).filter(item => existsSync(item));
            for (const packageJsonPath of pacotes) {
                const packageJsonContent = readFileSync(packageJsonPath, "utf-8");
                const packageJson = JSON.parse(packageJsonContent);
                const dependencies = packageJson.dependencies || {};
                const devDependencies = packageJson.devDependencies || {};
                if (dependencies?.typecomposer || devDependencies?.typecomposer)
                    listaDependencies.push(packageJsonPath.replace("package.json", ""));
            }
        } catch (error) {
            Debuger.error("error load_node_modules_dependencys: ", error);
        }
        for (const dependencie of listaDependencies) {
            this.addSourceFilesAtPaths(`${dependencie}/**/*.ts`);
        }
    }

    async buildStart() {
        const routers = await Router.findRouterTsFiles(this.projectDir);
        if (routers.length > 0) {
            this.routerPath = routers[0];
            await Router.updateRouterFiles(this.routerPath, this.indexPath);
        }
        Theme.findFiles(this.projectDir);
        Debuger.log("buildStart: ", Theme.getFiles());
    }

    public async analyze(path: string, code: string): Promise<string> {
        const sourceFile = this.createSourceFile('dummy.ts', code, { overwrite: true, scriptKind: 3 });
        const fileInfo: FileInfo = this.files.get(path) || { sourceFile: sourceFile, classes: [], removeDatas: [], path: path, templatesUrl: [], startDatas: [], endDatas: [], imports: [] };
        const classes = sourceFile.getClasses();
        fileInfo.sourceFile = sourceFile;
        fileInfo.removeDatas = [];
        fileInfo.startDatas = [];
        fileInfo.endDatas = [];
        fileInfo.path = path;
        fileInfo.templatesUrl = [];
        printFileInfo(fileInfo);
        fileInfo.imports = this.getImportInfo(sourceFile);
        fileInfo.classes = classes.map((classDeclaration: ClassDeclaration) => {
            return this.getClassInofo(classDeclaration, fileInfo);
        }).filter((classInfo: ClassInfo) => classInfo.isComponent);
        await RegisterBuild.anliyze(fileInfo);
        await TemplateBuild.anliyze(fileInfo);
        await RefBuild.anliyze(fileInfo);
        this.files.set(path, fileInfo);
        return await this.build(fileInfo);
    }

    private async build(fileInfo: FileInfo) {
        for await (const classInfo of fileInfo.classes) {
            this.insertConstructorDatas(classInfo);
            this.injectFunctions(fileInfo.sourceFile, classInfo.classDeclaration);
        }
        let code = fileInfo.sourceFile.getFullText();
        for await (const classInfo of fileInfo.classes) {
            const afterClassDatas = classInfo.afterClassDatas.join("\n");
            code = code.replace(classInfo.classDeclaration.getText(),
                classInfo.classDeclaration.getText() + "\n" + afterClassDatas);
        }
        for await (const data of fileInfo.removeDatas) {
            code = code.replace(data, "");
        }
        for await (const data of fileInfo.startDatas) {
            code = data + code;
        }
        for await (const data of fileInfo.endDatas) {
            code = code + data;
        }
        fileInfo.removeDatas.length = 0;
        return await StyleBuild.build(fileInfo, code);
    }

    public getClassInofo(classDeclaration: ClassDeclaration, fileInfo: FileInfo): ClassInfo {
        const className = classDeclaration.getName();
        const extendsClause = classDeclaration.getExtends()?.getText();
        const decorators = classDeclaration.getDecorators()?.map((decorator: Decorator) => decorator.getText()) || [];
        const { isComponent, paranet } = this.checkIsComponent(classDeclaration);
        return {
            className,
            extends: extendsClause,
            decorators: decorators,
            imports: JSON.stringify(fileInfo.imports),
            isComponent: isComponent,
            classDeclaration: classDeclaration,
            registerOptions: {},
            constructorDatas: [],
            styles: [],
            isExported: classDeclaration.isExported(),
            afterClassDatas: [],
            refComponents: [],
            paranet: paranet,
        };
    }

    public isClassFromModule(classDeclaration: ClassDeclaration, moduleName: string): boolean {
        const sourceFile = classDeclaration.getSourceFile();
        return sourceFile.getImportDeclarations().some((importDeclaration) => {
            return importDeclaration.getNamedImports().some((namedImport) => {
                return namedImport.getText() === classDeclaration.getName() && importDeclaration.getModuleSpecifierValue() === moduleName;
            });
        });
    }

    private checkImplementsComponent(sourceFile: SourceFile, classDeclaration: ClassDeclaration): {
        isComponent: boolean, paranet: {
            path: string;
            className: string;
        } | undefined
    } {
        if (sourceFile && classDeclaration && classDeclaration.getImplements().map(e => e.getText()).includes('IComponent')) {
            const i = sourceFile.getFilePath();
            if (i.includes("node_modules/typecomposer"))
                return { isComponent: true, paranet: { path: i.includes(".d.ts") ? i.replace(".d.ts", ".js") : i, className: classDeclaration.getName() || "" } };
        }
        return { isComponent: false, paranet: undefined };
    }

    public checkIsComponent(classDeclaration: ClassDeclaration): {
        isComponent: boolean, paranet: {
            path: string;
            className: string;
        } | undefined
    } {
        if (classDeclaration == undefined)
            return { isComponent: false, paranet: undefined };
        const check = this.checkImplementsComponent(classDeclaration.getSourceFile(), classDeclaration)
        if (check.isComponent)
            return check;
        if (classDeclaration) {
            const extendsClause = classDeclaration.getHeritageClauses()[0]; // Considerando apenas a primeira cláusula "extends"
            const extendsTypeNode = extendsClause ? extendsClause.getTypeNodes()[0] : undefined;

            if (extendsTypeNode) {
                const extendedClassName = extendsTypeNode.getText();
                const extendedClassDeclaration = this.getSourceFiles().find(sourceFile => sourceFile.getClass(extendedClassName))?.getClass(extendedClassName);
                if (extendedClassDeclaration)
                    return this.checkIsComponent(extendedClassDeclaration);
            }
        }
        return { isComponent: false, paranet: undefined };
    }

    getImportInfo(sourceFile: SourceFile) {
        const imports = sourceFile.getImportDeclarations().map((importDeclaration) => {
            const moduleSpecifier: string = importDeclaration.getModuleSpecifierValue();
            const namedImports: string[] = importDeclaration.getNamedImports().map((namedImport) => namedImport.getText());
            return { moduleSpecifier: moduleSpecifier, namedImports: namedImports };
        });
        return imports;
    }

    private insertConstructorDatas(classInfo: ClassInfo) {
        const classDeclaration: ClassDeclaration = classInfo.classDeclaration;
        try {
            let constructorDeclaration = classDeclaration.getConstructors()[0];
            if (constructorDeclaration == undefined) {
                constructorDeclaration = classDeclaration.addConstructor();
                if (classDeclaration.getExtends()) {
                    constructorDeclaration.insertStatements(0, writer => {
                        writer.write("super();");
                    });
                }
            }
            const injectedLine = classInfo.constructorDatas.join("\n");
            constructorDeclaration.insertStatements(1, writer => {
                writer.write(injectedLine);
            });
            // adiconar no final do construtor
            constructorDeclaration.insertStatements(constructorDeclaration.getStatements().length, writer => {
                writer.write("this.onInit();");
            });
        }
        catch (__) {
            Debuger.error("Error: ", __);
        }
    }

    private injectFunctions(sourceFile: SourceFile, classDeclaration: ClassDeclaration) {
        const connectedCallback = classDeclaration.getMethod("connectedCallback") || classDeclaration.addMethod({
            name: "connectedCallback",
            isAsync: false,
            isStatic: false,
            returnType: "void",
            statements: [],
            parameters: []
        });
        connectedCallback?.insertStatements(0, 'this.onConnected();');
        const disconnectedCallback = classDeclaration.getMethod("disconnectedCallback") || classDeclaration.addMethod({
            name: "disconnectedCallback",
            isAsync: false,
            isStatic: false,
            statements: [],
            parameters: []
        });
        disconnectedCallback?.insertStatements(0, 'this.unmount?.();this._styleRef?.disconnectedCallback();this.removeEvents?.(); this.onDisconnected();');
    }

    public sendServerUpdate(fileInfo: FileInfo) {
        const now = new Date();
        utimesSync(fileInfo.path, now, now);
    }

    public async transform(code: string, id: string): Promise<string> {
        if (id.endsWith('.ts') || id.endsWith('.js') || id.endsWith('.tsx') || id.endsWith('.jsx')) {
            return await this.analyze(id, code);
        }
        else if (id.includes(StyleBuild.identifier)) {
        }
        return code;
    }

    public async isFileTemplate(filePath: string): Promise<FileInfo[]> {
        const fileInfos = [];
        const fileName = path.basename(filePath).replace(path.extname(filePath), "");
        const fileDirName = path.dirname(filePath);
        for (const fileInfo of this.files.values()) {

            if (path.dirname(fileInfo.path) == fileDirName) {
                for (const classInfo of fileInfo.classes) {
                    if (classInfo.className == fileName || classInfo.registerOptions.templateUrl == filePath) {
                        fileInfos.push(fileInfo);
                        break;
                    }
                }
            }
        }
        return fileInfos;
    }

    async watchChange(id: string, change: { event: ChangeEvent }) {
        Router.watchChange(id, change, this);
        Theme.watchChange(id, change, this);
        if (id.endsWith('.html')) {
            if (change.event != "update") {
                const fileInfos = await this.isFileTemplate(id);
                for (const fileInfo of fileInfos) {
                    this.sendServerUpdate(fileInfo);
                }
            }
        }
    }

    public static normalizePath(path: string): string {
        if (path && os.platform() == "win32")
            return path.replace(/\\/g, "/");
        return path;
    }
}