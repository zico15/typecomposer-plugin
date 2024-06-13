
import { existsSync } from 'node:fs';
import { dirname, join, normalize } from 'node:path';
import { ClassInfo, FileInfo } from '../Interfaces';
import { ProjectBuild } from '../ProjectBuild';
import { Debuger } from '../../Debug/Log';

export class StyleBuild {

    public static path: string = "public/style.scss";
    public static readonly identifier: string = "virtual:stylebase";

    public static read(classInfo: ClassInfo, html: string): string {
        const styles = html.match(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/g);
        classInfo.styles = [];
        let styleComponent = "";
        if (styles != undefined) {
            styles.forEach((style, index) => {
                const styleTag = style.split(">")[0];
                if (classInfo.registerOptions.tag != "" && !styleTag.includes("global")) {
                    html = html.replace(styles[index], "");
                    style = style.split(">\n")[1]
                    style = style.split("</style>")[0]
                    styleComponent += style;
                }
            });
            const regex = /\.this\s*\{([^}]*)\}/g;
            styleComponent = styleComponent.replace(regex, (match, group1) => group1.trim());
            Debuger.info("styleComponent: ", styleComponent);
        }
        if (styleComponent != "")
            classInfo.styles.push(`${classInfo.registerOptions.tag} {\n${styleComponent.trim()}\n}`.trim());
        return html;
    }

    private static async getStyleUrl(fileInfo: FileInfo, classInfo: ClassInfo, styleUrl?: string): Promise<string | undefined> {
        if (styleUrl)
            styleUrl = styleUrl?.includes("src/") ? classInfo.registerOptions.styleUrl : "src/" + classInfo.registerOptions.styleUrl;
        if (styleUrl == undefined)
            styleUrl = join(dirname(fileInfo.path), `${classInfo.className}.scss`);
        if (styleUrl == undefined)
            return undefined;
        styleUrl = ProjectBuild.normalizePath(normalize(styleUrl));
        if (styleUrl && existsSync(styleUrl))
            return styleUrl;
        styleUrl = join(dirname(fileInfo.path), `${classInfo.className}.css`);
        styleUrl = normalize(styleUrl);
        return existsSync(styleUrl) ? styleUrl : undefined;
    }
    public static async anliyze(fileInfo: FileInfo, classInfo: ClassInfo) {
        let styleUrl = await this.getStyleUrl(fileInfo, classInfo, classInfo.registerOptions?.styleUrl);
        classInfo.registerOptions.styleUrl = styleUrl;
    }

    public static getStyleCode(fileInfo: FileInfo): string {
        let styleCode = fileInfo.classes.filter(e => e.styles.length > 0);
        if (styleCode == undefined || styleCode.length == 0)
            return "";
        return styleCode.map(e => e.styles.join("\n")).join("\n");
    }

    public static async getStyleCodeAll(project: ProjectBuild): Promise<string> {
        let styleCode = "";
        for await (const fileInfo of project.files.values()) {
            styleCode += '\n' + this.getStyleCode(fileInfo);
        }
        return styleCode;
    }

    public static async build(fileInfo: FileInfo, code: string): Promise<any> {
        fileInfo.styleCode = this.getStyleCode(fileInfo);
        if (fileInfo.styleCode != "") {
            let name = fileInfo.path.split("/").pop();
            name = name?.split(".")[0] || name;
            const timestamp = Date.now();
            fileInfo.virtualFile = `virtual:stylebase${name}${timestamp}.scss`;
            code = `import "${fileInfo.virtualFile}";\n${code}`;
        }
        else
            fileInfo.virtualFile = undefined;
        for await (const classInfo of fileInfo.classes) {
            if (classInfo.registerOptions?.styleUrl && existsSync(classInfo.registerOptions.styleUrl)) {
                let url = classInfo.registerOptions.styleUrl;
                code = `import "${url}";\n${code}`;
            }
        }
        return code;
    }

}