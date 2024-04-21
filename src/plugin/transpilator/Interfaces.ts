import { ClassDeclaration, SourceFile } from "ts-morph";
import { RegisterOptions } from "./base/Register";
import { Debuger } from "../Debug/Log";

export type ChangeEvent = 'create' | 'update' | 'delete';


export interface FileTheme {
    path: string;
    name: string;
}

export interface ClassInfo {
    className: string | undefined;
    extends: string | undefined;
    decorators: string[];
    imports: string;
    isComponent: boolean;
    classDeclaration: ClassDeclaration;
    registerOptions: RegisterOptions;
    constructorDatas: string[];
    afterClassDatas: string[];
    styles: string[];
    isExported: boolean;
    refComponents: { name: string, id: string }[];
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
    imports: { moduleSpecifier: string, namedImports: string[] }[];
}

export function printClassInfo(classInfo: ClassInfo) {
    Debuger.log(`============ classInfo: ${classInfo.className} ============`);
    Debuger.log('extends: ', classInfo.extends);
    Debuger.log('decorators: ', classInfo.decorators);
    Debuger.log('imports: ', classInfo.imports);
    Debuger.log('isComponent: ', classInfo.isComponent);
    Debuger.log('constructorDatas: ', classInfo.constructorDatas);
    Debuger.log('styles: ', classInfo.styles);
    Debuger.log('paranet: ', classInfo.paranet);
    Debuger.log('refComponents: ', classInfo.refComponents);
    Debuger.log('registerOptions: ', classInfo.registerOptions);
}


export function printFileInfo(fileInfo: FileInfo) {
    if (fileInfo.classes.length == 0)
        return;
    Debuger.log("============ fileInfo ============");
    Debuger.log('path: ', fileInfo.path);
    Debuger.log('templatesUrl: ', fileInfo.templatesUrl);
    Debuger.log('styleCode: ', fileInfo.styleCode);
    Debuger.log('virtualFile: ', fileInfo.virtualFile);
    Debuger.log('removeDatas: ', fileInfo.removeDatas);
    Debuger.log('startDatas: ', fileInfo.startDatas);
    Debuger.log('endDatas: ', fileInfo.endDatas);
    Debuger.log('imports: ', fileInfo.imports);
}