import { readFileSync } from "node:fs";
import { FileInfo, ClassInfo } from "../transpilator/Interfaces";


export interface RegisterOptions {
    tag?: string;
    templateUrl?: string;
    extends?: string;
    styleUrl?: string;
}

export class RegisterBuild {

    private static converClasNameToTag(className: string | undefined): string {
        if (className == undefined)
            return `base-${Math.random().toString(36).substring(7)}-element`;
        let name = className.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/(\d+)([A-Z])/g, '$1-$2').toLowerCase()
        if (!name.includes("-"))
            name = name + "-element";
        return name
    }

    private static async readRegister(fileInfo: FileInfo, classInfo: ClassInfo) {
        const decorators = classInfo.classDeclaration.getDecorators();
        const register = decorators.find(e => e.getName() == "Register");
        const registerArgs = register?.getArguments().map(arg => arg.getText().replace(/,(?=\s*})/, '')).join(", ").replace(/(\w+):/g, '"$1":').replace(/'/g, '"');

        if (register)
            fileInfo.removeDatas.push(register.getText());
        try {
            classInfo.registerOptions = JSON.parse(registerArgs || "{}");
        } catch (error) {
            console.log("error: ", error)
        }
        if (classInfo.registerOptions?.extends == undefined)
            await this.readExtends(classInfo);
        if (classInfo.registerOptions.tag == undefined)
            classInfo.registerOptions.tag = this.converClasNameToTag(classInfo.className);
    }

    private static async readExtends(classInfo: ClassInfo) {
        if (classInfo.paranet != undefined && classInfo.paranet.path != '') {
            try {
                const conteudo = readFileSync(classInfo.paranet.path, 'utf8');
                const regex = /customElements\.define\(["'](.*?)["'].*?\)/g;
                const matches = conteudo.match(regex);
                for await (const match of matches || []) {
                    const regex2 = /customElements\.define\(["']([^"']+)["'],\s*(\w+)\s*,\s*({[^}]+})\s*\)/;
                    const match2 = match.match(regex2);

                    if (match2 && match2[2] == classInfo.paranet?.className && match2[3]) {
                        const extendsJson = match2[3].replace(/(\w+):/g, '"$1":');
                        classInfo.registerOptions.extends = JSON.parse(extendsJson).extends;
                        break;
                    }
                }
            }
            catch (error) {
                console.log("error: ", error)
            }
        }
    }

    public static async injectTag(classInfo: ClassInfo) {
        const tag = classInfo.registerOptions.tag;
        const line = `customElements.define("${tag}", ${classInfo.classDeclaration.getName()}, ${classInfo.registerOptions?.extends ? '{ extends: "' + classInfo.registerOptions.extends + '" }' : "undefined"});`;
        classInfo.afterClassDatas.push(line);
    }

    public static async anliyze(fileInfo: FileInfo) {
        for await (const classInfo of fileInfo.classes) {
            await this.readRegister(fileInfo, classInfo);
            await this.injectTag(classInfo);
        }
    }
}