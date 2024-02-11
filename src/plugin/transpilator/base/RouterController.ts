
import path, { basename } from 'node:path';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { ChangeEvent } from '../Interfaces';
import { ProjectBuild } from '../ProjectBuild';
import {platform} from "node:os";

export namespace Router {

    export function isRouterFile(file: string): boolean {
        return file === 'router.ts' || file === 'router.js' || file === 'Router.js' || file === 'Router.ts';
    }

    export async function findRouterTsFiles(directory: string): Promise<string[]> {
        const routerTsFiles: string[] = [];
        function searchRecursively(dir: string) {
            const files = readdirSync(dir);
            files.forEach((file: string) => {
                const filePath = path.join(dir, file);
                const isDirectory = statSync(filePath).isDirectory();
                if (isDirectory) {
                    searchRecursively(filePath);
                } else if (isRouterFile(file)) {
                    routerTsFiles.push(filePath);
                }
            });
        }
        searchRecursively(directory);
        return routerTsFiles;
    }

    export async function updateRouterFiles(routerPath: string, indexPath: string): Promise<void> {
        const regex = /<script(?:\s[^>]*)?\srouter(?:\s[^>]*)?>\s*<\/script>/g;
        const operatingSystem = platform();

        console.log("Router path: ", routerPath);
        console.log("os: ", operatingSystem);
        if (operatingSystem == "win32") {
            console.log("entrou aqui");
            routerPath = routerPath.replace(/\\/g, '/');
            console.log("Router path: ", routerPath);
        }
        if (routerPath.includes('/src'))
            routerPath = '/src' + routerPath.split('/src')[1];
        if (routerPath)
            routerPath = `src="${routerPath}"`;
        let html = readFileSync(indexPath, 'utf-8');
        const resul = html.match(regex);
        if (resul) {
            html = html.replace(resul[0], `<script router type="module" ${routerPath} ></script>`);
            writeFileSync(indexPath, html);
        }
        else {
            html = html.replace("<head>", `<head>
            <script router type="module"  ${routerPath} ></script>`);
            writeFileSync(indexPath, html);
        }
    }

    export async function watchChange(id: string, change: { event: ChangeEvent }, project: ProjectBuild) {
        if (change.event != "update" && (id.endsWith('.ts') || id.endsWith('.js')) && Router.isRouterFile(basename(id))) {
            console.log("Router file changed: ", id);
            const routers = await Router.findRouterTsFiles(project.projectDir);
            if (routers.length > 0) {
                project.routerPath = routers[0];
                await Router.updateRouterFiles(project.routerPath, project.indexPath);
            }
            else {
                project.routerPath = "";
                await Router.updateRouterFiles("", project.indexPath);
            }
        }
    }
}