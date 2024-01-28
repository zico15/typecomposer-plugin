import { ClassDeclaration, SourceFile } from "ts-morph";
import { RegisterOptions } from "../base/Register";

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
}

export function printClassInfo(classInfo: ClassInfo) {
    console.log(`============classInfo: ${classInfo.className}============`);
    console.log('extends: ', classInfo.extends);
    console.log('decorators: ', classInfo.decorators);
    console.log('imports: ', classInfo.imports);
    console.log('isComponent: ', classInfo.isComponent);
    console.log('constructorDatas: ', classInfo.constructorDatas);
    console.log('styles: ', classInfo.styles);
    console.log('paranet: ', classInfo.paranet);
    console.log('refComponents: ', classInfo.refComponents);
    console.log('registerOptions: ', classInfo.registerOptions);
}

export function printFileInfo(fileInfo: FileInfo) {
    if (fileInfo.classes.length == 0)
        return;
    console.log("============fileInfo============");
    console.log('path: ', fileInfo.path);
    console.log('templatesUrl: ', fileInfo.templatesUrl);
    console.log('styleCode: ', fileInfo.styleCode);
    console.log('virtualFile: ', fileInfo.virtualFile);
    console.log('removeDatas: ', fileInfo.removeDatas);
    console.log('startDatas: ', fileInfo.startDatas);
    console.log('endDatas: ', fileInfo.endDatas);
    for (const classInfo of fileInfo.classes) {
        printClassInfo(classInfo);
    }
}