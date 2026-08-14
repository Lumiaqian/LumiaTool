import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { platform } from "node:os";

const root = resolveRoot();
const releasePath = join(root, "_release");
const bundlePath = join(root, "apps/desktop/src-tauri/target/release/bundle");

function resolveRoot() {
    return join(import.meta.dirname, "..");
}

const initialize = () => {
    rmSync(releasePath, { recursive: true, force: true });
    mkdirSync(releasePath, { recursive: true });
};

const firstFile = (directory, extension) => {
    if (!existsSync(directory)) {
        return "";
    }
    return (
        readdirSync(directory)
            .map(name => join(directory, name))
            .find(path => statSync(path).isFile() && path.endsWith(extension)) || ""
    );
};

const copyArtifact = (directory, extension, name) => {
    const source = firstFile(directory, extension);
    if (source) {
        cpSync(source, join(releasePath, name));
    }
};

const collect = () => {
    mkdirSync(releasePath, { recursive: true });
    if (platform() === "darwin") {
        copyArtifact(join(bundlePath, "dmg"), ".dmg", "lumiatool_macos.dmg");
    } else if (platform() === "win32") {
        copyArtifact(join(bundlePath, "msi"), ".msi", "lumiatool_windows.msi");
        copyArtifact(join(bundlePath, "nsis"), ".exe", "lumiatool_windows_setup.exe");
    } else {
        copyArtifact(join(bundlePath, "deb"), ".deb", "lumiatool_linux.deb");
        copyArtifact(join(bundlePath, "appimage"), ".AppImage", "lumiatool_linux.AppImage");
        copyArtifact(join(bundlePath, "rpm"), ".rpm", "lumiatool_linux.rpm");
    }

    const files = readdirSync(releasePath)
        .filter(name => statSync(join(releasePath, name)).isFile())
        .map(name => `./_release/${name}`);
    writeFileSync(join(root, "_release_files"), files.join("\n"));
    console.log(files.join("\n"));
};

const command = process.argv[2] || "init";
if (command === "init") {
    initialize();
} else if (command === "collect") {
    collect();
} else {
    throw new Error("usage: node scripts/release.mjs [init|collect]");
}
