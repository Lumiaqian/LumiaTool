const unavailable = (): never => {
    throw new Error("Node.js API is unavailable in the browser");
};

export const existsSync = () => false;
export const statSync = () => ({ isFile: () => false, size: 0 });
export const readFileSync = unavailable;
export const readFile = async () => unavailable();
export const createRequire = () => unavailable;

export default {
    existsSync,
    statSync,
    readFileSync,
    readFile,
    createRequire,
};
