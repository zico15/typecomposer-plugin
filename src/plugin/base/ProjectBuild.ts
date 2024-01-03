import { ClassDeclaration, Decorator, Project, SourceFile } from 'ts-morph';
import { RegisterBuild, RegisterOptions } from './Register';
import { TemplateBuild } from './Template';
import { StyleBuild } from './Style';
import { utimesSync } from 'node:fs';

export interface ClassInfo {
    className: string | undefined;
    extends: string | undefined;
    decorators: string[];
    imports: string;
    isComponent: boolean;
    classDeclaration: ClassDeclaration;
    registerOptions: RegisterOptions;
    constructorDatas: string[];
    styles: string[];
    paranet: {
        path: string;
        className: string;
    } | undefined;
}

export interface FileInfo {
    path: string;
    sourceFile: SourceFile;
    classes: ClassInfo[];
    templatesUrl: string[];
    styleCode?: string;
    virtualFile?: string;
    removeDatas: string[];
    startDatas: string[];
    endDatas: string[];
}

export class ProjectBuild extends Project {

    public files: Map<string, FileInfo> = new Map<string, FileInfo>();
    public path: string;
    public stylePath: string;
    public styleCode: string = "";

    constructor() {
        super();
        this.addSourceFilesAtPaths('**/*.ts');
        this.path = this.getSourceFiles().find(e => e.getFilePath().includes("node_modules/typecompose-plugin"))?.getFilePath() || "";
        if (this.path != "")
            this.path = this.path.split("node_modules/typecompose-plugin/")[0] + "node_modules/typecompose-plugin/";
        this.stylePath = this.path + "public/style.scss";
    }

    public async analyze(path: string, code: string): Promise<string> {
        const sourceFile = this.createSourceFile('dummy.ts', code, { overwrite: true });
        const fileInfo: FileInfo = this.files.get(path) || { sourceFile: sourceFile, classes: [], removeDatas: [], path: path, templatesUrl: [], startDatas: [], endDatas: [] };
        const classes = sourceFile.getClasses();
        fileInfo.sourceFile = sourceFile;
        fileInfo.removeDatas = [];
        fileInfo.startDatas = [];
        fileInfo.endDatas = [];
        fileInfo.path = path;
        fileInfo.templatesUrl = [];
        fileInfo.classes = classes.map((classDeclaration: ClassDeclaration) => {
            return this.getClassInofo(sourceFile, classDeclaration);
        }).filter((classInfo: ClassInfo) => classInfo.isComponent);
        await RegisterBuild.anliyze(fileInfo);
        await TemplateBuild.anliyze(fileInfo);
        this.files.set(path, fileInfo);
        // console.log('Analyze:', fileInfo);
        return await this.build(fileInfo);
    }

    private async build(fileInfo: FileInfo) {
        for await (const classInfo of fileInfo.classes) {
            this.insertConstructorDatas(classInfo);
            this.injectFunctions(fileInfo.sourceFile, classInfo.classDeclaration);
            RegisterBuild.injectTag(fileInfo, classInfo);
        }
        let code = fileInfo.sourceFile.getFullText();
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

    public getClassInofo(sourceFile: SourceFile, classDeclaration: ClassDeclaration): ClassInfo {
        const className = classDeclaration.getName();
        const extendsClause = classDeclaration.getExtends()?.getText();
        const decorators = classDeclaration.getDecorators()?.map((decorator: Decorator) => decorator.getText()) || [];
        const { isComponent, paranet } = this.checkIsComponent(classDeclaration);
        return {
            className,
            extends: extendsClause,
            decorators: decorators,
            imports: JSON.stringify(this.getImportInfo(sourceFile)),
            isComponent: isComponent,
            classDeclaration: classDeclaration,
            registerOptions: {},
            constructorDatas: [],
            styles: [],
            paranet: paranet
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
            if (i.includes("node_modules/typecompose"))
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
            if (injectedLine != "")
                constructorDeclaration.insertStatements(1, writer => {
                    writer.write(injectedLine);
                });
        }
        catch (__) {
            console.log("Error: ", __);
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
        connectedCallback?.insertStatements(0, 'this.oninit();');

        const disconnectedCallback = classDeclaration.getMethod("disconnectedCallback") || classDeclaration.addMethod({
            name: "disconnectedCallback",
            isAsync: false,
            isStatic: false,
            returnType: "void",
            statements: [],
            parameters: []
        });
        disconnectedCallback?.insertStatements(0, 'this.unmount?.(); this?.destructor(); this._styleRef?.disconnectedCallback();this.removeEvents?.();');
    }

    public sendServerUpdate(fileInfo: FileInfo) {
        const now = new Date();
        utimesSync(fileInfo.path, now, now);
    }
}