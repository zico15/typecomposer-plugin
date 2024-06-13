import AdmZip from 'adm-zip';
import { readdir } from 'node:fs';
import { basename, join } from 'node:path';
import type { Plugin } from 'vite'
import { ProjectBuild } from '../transpilator/ProjectBuild';



export namespace Android {

	//async function copyFile(src: string, dest: string): Promise<string> {

	//	console.log(`Copiando arquivo ${src} para ${distApkFilePath}`);
	//	copyFileSync(src, distApkFilePath);
	//	return distApkFilePath;
	//}


	// Função para extrair arquivos de um APK
	export async function build(apkFilePath: string, distPath: string) {
		try {
			const apkFileName = basename(apkFilePath);
			const distFileName = basename(distPath);
			const distApkFilePath = join(distPath.replace(distFileName, "android"), apkFileName);
			console.log(`Apk: ${apkFilePath}`);
			// copiar o apk para pasta dist

			const zip = new AdmZip(apkFilePath);
			const zipEntries = zip.getEntries();
			// arquivo encontrado: AndroidManifest.xml
			const androidManifest = zipEntries.find((zipEntry) => zipEntry.entryName === 'AndroidManifest.xml');
			if (androidManifest) {
				console.log(`manifest: ${androidManifest.entryName}`);
				//const androidManifestContent = zip.readAsText(androidManifest);
				//console.log(`Conteúdo do arquivo: ${androidManifestContent}`);
			}
			//deixa a a pasta assets limpar dentro do zip

			let assets = zipEntries.filter((zipEntry) => zipEntry.entryName.startsWith('assets/'));

			for (const zipEntry of assets) {
				zip.deleteFile(zipEntry);
			}

			assets = zipEntries.filter((zipEntry) => zipEntry.entryName.startsWith('assets/'));
			console.log('assets:', assets);
			//  copiar a pasta dist para dentro do zip com o nome de assets
			zip.addLocalFolder(distPath, 'assets');
			for (const zipEntry of assets) {
				console.log(`assets/ ${zipEntry.entryName}`);
				//const assetContent = zip.readAsText(asset);
				//console.log(`Conteúdo do arquivo: ${assetContent}`);
			}
			// Salva as alterações no arquivo APK
			zip.writeZip(distApkFilePath);
		}
		catch (error) {
			console.error('Erro ao extrair arquivos do APK:', error);
		}
	}

	//// Caminho para o diretório de saída onde os arquivos serão extraídos
	//const outputDirectory = 'caminho/do/seu/diretorio/saida';

	//// Verifica se o arquivo APK existe
	//if (fs.existsSync(apkFilePath)) {
	//	// Extrai os arquivos do APK para o diretório de saída
	//	extractApkFiles(apkFilePath, outputDirectory);
	//} else {
	//	console.error('O arquivo APK não foi encontrado.');
	//}

	export function plugin(project: ProjectBuild): Plugin {

		return {
			name: 'typecompose:android',
			enforce: 'post',
			apply: 'build',
			transformIndexHtml: {
				order: 'post',
				handler(html) {
				},
				enforce: 'post', // deprecated since Vite 4
				async transform(html) { // deprecated since Vite 4
				},
			},
			configResolved(_config) {

			},
			generateBundle(n, bundle) {

			},
			closeBundle: {
				sequential: true,
				order: 'post',
				async handler() {
					//lista de arquivos no project.outputDir
					console.log('closeBundle');
					const outputDir = project.outputDir;
					readdir(outputDir, (err, files) => {
						console.log('closeBundle:', files);
					})
					//Android.build(project.options.apkUrl || "", project.outputDir);

				},
			},
			async buildEnd(error) {
				if (error)
					throw error
				console.log('buildEnd');
				const outputDir = project.outputDir;
				readdir(outputDir, (err, files) => {
					console.log('buildEnd:', files);
				})
			},
		}
	}
}