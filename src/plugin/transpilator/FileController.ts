import chokidar from 'chokidar';

export class FileController {

    private watcher = chokidar.watch('./caminho/do/seu/arquivo');

    constructor(path: string) {
        this.watcher = chokidar.watch(path);
    }

    public close(): void {
        this.watcher.close();
    }
}
