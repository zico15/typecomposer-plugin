


export namespace Debuger {

    export let isDebug = true;

    export function log(message: string, ...optional: any[]) {
        if (isDebug) console.log(message, ...optional);
    }

    export function error(message: string, ...optional: any[]) {
        if (isDebug) console.error(message, ...optional);
    }

    export function warn(message: string, ...optional: any[]) {
        if (isDebug) console.warn(message, ...optional);
    }

    export function info(message: string, ...optional: any[]) {
        if (isDebug) console.info(message, ...optional);
    }


}