import { ClassDeclaration, Decorator, Project, SourceFile } from 'ts-morph';
import { utimesSync } from 'node:fs';
import { RegisterBuild } from '../base/Register';
import { StyleBuild } from '../base/Style';
import { FileInfo, ClassInfo, printFileInfo, ChangeEvent } from './Interfaces';
import path from 'node:path';
import { TemplateBuild } from '../base/Template';

export class ProjectBuild extends Project {

    public files: Map<string, FileInfo> = new Map<string, FileInfo>();
    public path: string;
    public stylePath: string;
    public styleCode: string = "";

    constructor() {
        super();
        this.addSourceFilesAtPaths('node_modules/typecompose/**/*.ts');
        this.path = this.getSourceFiles().find(e => e.getFilePath().includes("node_modules/typecompose-plugin"))?.getFilePath() || "";
        if (this.path != "")
            this.path = this.path.split("node_modules/typecompose-plugin/")[0] + "node_modules/typecompose-plugin/";
        this.stylePath = this.path + "public/style.scss";
    }

    public async analyze(path: string, code: string): Promise<string> {
        const sourceFile = this.createSourceFile('dummy.ts', code, { overwrite: true, scriptKind: 3 });
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
        printFileInfo(fileInfo);
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

    public getClassInofo(sourceFile: SourceFile, classDeclaration: ClassDeclaration): ClassInfo {
        const className = classDeclaration.getName();
        const extendsClause = classDeclaration.getExtends()?.getText();
        const constructors = classDeclaration.getConstructors() || [];
        if (constructors.length > 0) {
            const p = constructors[0].getParameters().map((param) => { return { name: param.getName(), type: param.getType().getText() } });
            console.log("constructor: ", p);
        }
        else
            console.log("constructors: ", constructors.length);


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
            console.log("type:extendsClause: ", extendsTypeNode?.getType()?.getText());

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
            console.log("Error: ", __);
        }
    }

    private injectFunctions(sourceFile: SourceFile, classDeclaration: ClassDeclaration) {
        // const connectedCallback = classDeclaration.getMethod("connectedCallback") || classDeclaration.addMethod({
        //     name: "connectedCallback",
        //     isAsync: false,
        //     isStatic: false,
        //     returnType: "void",
        //     statements: [],
        //     parameters: []
        // });
        // connectedCallback?.insertStatements(0, 'this.onInit();');

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

    public async transform(code: string, id: string): Promise<string> {
        if (id.endsWith('.ts') || id.endsWith('.js') || id.endsWith('.tsx') || id.endsWith('.jsx')) {

            // // code = 
            // if (id.includes("main.ts")) {
            //     // const stylePath = project.path + "public/style.scss";
            //     // console.log('transform:', stylePath, " isExists:", existsSync(stylePath));
            //     // const styleBase = `
            //     // body {
            //     //     background-color: red !important;
            //     // };
            //     // `
            //     // writeFileSync(stylePath, styleBase);
            //     // execFileSync()
            // }
            // console.log('transform:', id);
            return await this.analyze(id, code);
        }
        else if (id.includes(StyleBuild.identifier)) {
            // console.log('transform:', id);
            // const fileInfo = Array.from(project.files.values()).find(e => e.virtualFile && id.includes(e.virtualFile));
            // if (fileInfo) {
            //     // console.log('styleCode: ', project.styleCode);
            //     return fileInfo.styleCode;
            // }
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
        console.log("isFileTemplate: ", fileInfos.length);
        return fileInfos;
    }

    async watchChange(id: string, change: { event: ChangeEvent }) {
        if (id.endsWith('.html')) {
            if (change.event != "update") {
                const fileInfos = await this.isFileTemplate(id);
                for (const fileInfo of fileInfos) {
                    this.sendServerUpdate(fileInfo);
                }
            }
        }
    }
}