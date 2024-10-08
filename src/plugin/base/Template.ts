import { PropertyDeclaration } from 'ts-morph';
import { StyleBuild } from "./Style";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";
import { FileInfo, ClassInfo } from '../transpilator/Interfaces';


export interface RefComponentOptions {
    ref: string,
    name: string;
}


export class TemplateBuild {

    private static bases: string[] = ["div", "p", "a", "img", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6", "span", "strong", "em", "br", "hr", "table", "tr", "th", "td", "form", "input", "button", "textarea", "label", "select", "iframe", "audio", "video", "canvas", "svg", "footer", "header", "nav", "main", "section", "article", "details", "summary"];

    private static replace_html_tags(html: string): string {
        for (let i = 0; i < TemplateBuild.bases.length; i++) {
            const base = TemplateBuild.bases[i];
            html = html.replaceAll(`<${base} `, `<${base} is="base-${base}-element" `);
            html = html.replaceAll(`<${base}>`, `<${base} is="base-${base}-element" `);
        }
        return html.replace(/<!--[\s\S]*?-->/g, '');
    }

    private static getTemplateUrl(fileInfo: FileInfo, classInfo: ClassInfo, templateUrl?: string): string | undefined {
        if (templateUrl)
            templateUrl = templateUrl?.includes("src/") ? classInfo.registerOptions.templateUrl : "src/" + classInfo.registerOptions.templateUrl;
        if (templateUrl == undefined)
            templateUrl = join(dirname(fileInfo.path), `${classInfo.className}.html`);
        if (templateUrl == undefined)
            return undefined;
        templateUrl = normalize(templateUrl);
        // console.log("normalize: ", normalize(templateUrl), " => ", existsSync(templateUrl));
        if (templateUrl == undefined || !existsSync(templateUrl))
            return undefined;
        return templateUrl;
    }

    private static async readHtml(fileInfo: FileInfo, classInfo: ClassInfo, templateUrl?: string) {
        if (templateUrl == undefined)
            return;
        try {
            let html = readFileSync(templateUrl, 'utf-8');
            html = TemplateBuild.replace_html_tags(html);
            html = StyleBuild.read(classInfo, html).trim();
            classInfo.constructorDatas.push(`this.innerHTML = \`${html}\`;`);
            templateUrl = resolve(templateUrl);
            fileInfo.templatesUrl.push(templateUrl);
            return html.trim();
        } catch (error) {
            classInfo.registerOptions.templateUrl = undefined;
            return undefined;
        }
    }

    private static async readRefComponent(fileInfo: FileInfo, classInfo: ClassInfo, templateUrl?: string) {
        const propertyDeclarations: PropertyDeclaration[] = classInfo.classDeclaration.getProperties();
        let variables = classInfo.classDeclaration.getProperties().filter(prop => prop.getText().includes("!") && !prop.getText().includes("="));
        for (let i = 0; i < propertyDeclarations.length; i++) {
            const property = propertyDeclarations[i];
            const propertyDecorators = [...property.getDecorators()];
            propertyDecorators.forEach(decorator => {
                if ("RefComponent" == decorator.getName()) {
                    if (templateUrl != undefined) {
                        let ref = decorator.getArguments().map(arg => arg.getText()).join(", ").replace(/(\w+):/g, '"$1":');
                        if (ref.includes("{") && ref.includes("}"))
                            ref = JSON.parse(ref)?.id || property.getName();
                        else
                            ref = ref.replace(/"/g, "") || property.getName();
                        const name = property.getName();
                        variables = variables.filter(prop => prop.getName() != name);
                        classInfo.refComponents.push({ name: name, id: ref });
                        classInfo.constructorDatas.push(`this.${name} = this.querySelector("#${ref}");`);
                    }
                    fileInfo.removeDatas.push(decorator.getText());
                }
            });
        }
        if (templateUrl == undefined)
            return;
        console.log("variaveis: ", variables.map(prop => prop.getText()));
        for (let i = 0; i < variables.length; i++) {
            const variable = variables[i];
            const name = variable.getName();
            classInfo.refComponents.push({ name: name, id: name });
            classInfo.constructorDatas.push(`this.${name} = this.querySelector("#${name}");`);
        }
    }

    public static async anliyze(fileInfo: FileInfo) {
        for await (const classInfo of fileInfo.classes) {
            classInfo.registerOptions.templateUrl = this.getTemplateUrl(fileInfo, classInfo, classInfo.registerOptions?.templateUrl);
            await StyleBuild.anliyze(fileInfo, classInfo);
            await this.readHtml(fileInfo, classInfo, classInfo.registerOptions?.templateUrl);
            await this.readRefComponent(fileInfo, classInfo, classInfo.registerOptions?.templateUrl);
            // if (classInfo.className == "CardDescription") {
            //     // console.log("classInfo: ", classInfo);
            //     // Variable in class
            //     // console.log("Variable in class");
            //     // classInfo.classDeclaration.getProperties().forEach((variavel) => {
            //     //     console.log("Nome da variável:", variavel.getName());
            //     //     console.log("Tipo da variável:", variavel.getType().getText());
            //     // });
            // }
        }
    }



}