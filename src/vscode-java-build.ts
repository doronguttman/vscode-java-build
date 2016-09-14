import * as fs from "fs";
import * as path from "path";
import * as childProcess from "child_process";

namespace VsCodeJavaBuild {
    const SOURCE_FILE_NAME = "sourceFiles.txt";
    const args = process.argv;

    var sourceFolder = path.normalize(args[2]);
    var destFolder = path.normalize(args[3]);
    var verbose = args.length > 4 && args[4].toLowerCase() === "--verbose";

    namespace Helpers {
        const SLASH_REGEX: RegExp = /\\/g;

        // export function getFilesRecursive(baseFolder: string) {
        //     var baseItems = fs.readdirSync(baseFolder)
        //         .map(item => path.join(baseFolder, item))
        //         .map(item => path.normalize(item));
        //     if (!baseItems || baseItems.length === 0) return [];
        //     var subItems: string[] = [];
        //     baseItems.forEach(item => {
        //         if (!fs.statSync(item).isDirectory()) return;
        //         subItems = subItems.concat(getFilesRecursive(item));
        //     });
        //     baseItems = baseItems.concat(subItems);
        //     return baseItems;
        // }

        export function exists(path: string): boolean {
            try {
                fs.accessSync(path, fs.constants.F_OK);
                return true;
            } catch (e) {
                return false;
            }
        }

        export function execDir(path: string): string[] {
            var output = run(`dir /s /b "${path}"`);
            if (!output) return [];
            var files = output.split("\r\n")
                .filter(item => !!item && item.length > 0);
            return files;
        }

        export function getSourceFileString(files: string[]): string {
            var rslt = files.map(file => `"${file.replace(SLASH_REGEX, "\\\\")}"`)
                .join("\r\n");
            return rslt;
        }

        export function run(command: string): string {
            try {
                var rslt = childProcess.execSync(command).toString("utf8");
                return rslt;
            } catch (e) {
                return null;
            }
        }
    }

    function print(message: string, ...opitonalParams: any[]) {
        arguments[0] = `java-build: ${arguments[0]}`;
        console.log.apply(console, arguments);
    }

    function debug(message: string, ...opitonalParams: any[]) { if (verbose) print.apply(this, arguments); }

    export function execute() {
        var buildCommand = `javac ${verbose ? "-verbose" : ""} -g -d "${destFolder}" @"${destFolder}\\${SOURCE_FILE_NAME}"`;

        print(`'${sourceFolder}' -> '${destFolder}'`);

        //if (!Helpers.exists(sourceFolder)) throw new Error("Source folder does not exist");
        if (!Helpers.exists(destFolder)) fs.mkdirSync(destFolder);

        var files = Helpers.execDir(sourceFolder);
        files.sort();
        if (files.length === 0) {
            print("No files found");
            return;
        } else {
            debug(`Found the following files:\r\n${files.join(`\r\n`)}`);
        }

        fs.writeFileSync(path.join(destFolder, SOURCE_FILE_NAME), Helpers.getSourceFileString(files), { encoding: "utf8" });

        print(`executing: ${buildCommand}`);
        console.log("", Helpers.run(buildCommand));

        print("done!");
        process.exit(0);
    }
}
VsCodeJavaBuild.execute();