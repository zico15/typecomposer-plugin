import { ClassInfo, FileInfo } from './ProjectBuild';

export class StyleBuild {

    public static path: string = "public/style.scss";

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
            console.log("class: ", classInfo.className, ' styles', classInfo.styles);
        }
        if (styleComponent != "")
            classInfo.styles.push(`${classInfo.registerOptions.tag} {${styleComponent}}`);
        return html;
    }

    public static getStyleCode(fileInfo: FileInfo): string {
        let styleCode = fileInfo.classes.filter(e => e.styles.length > 0);
        if (styleCode == undefined || styleCode.length == 0)
            return "";
        return styleCode.map(e => e.styles.join("\n")).join("\n");
    }

    public static async build(fileInfo: FileInfo, code: string): Promise<any> {
        fileInfo.styleCode = this.getStyleCode(fileInfo);
        if (fileInfo.styleCode != "") {
            let name = fileInfo.path.split("/").pop();
            name = name?.split(".")[0] || name;
            const timestamp = Date.now();
            fileInfo.virtualFile = `virtual:stylebase${name}${timestamp}.scss`;
        }
        else
            fileInfo.virtualFile = undefined;
        return code;
    }

}
