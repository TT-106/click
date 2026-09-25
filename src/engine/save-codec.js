import codec from '../vendor/lz-string-1.3.3.js';

/** 存档契约固定为 LZ-string 1.3.3 的 Base64 编码，升级依赖前必须跑兼容测试。 */
export const compress = value => codec.compressToBase64(value);
export const decompress = value => codec.decompressFromBase64(value);
export default { compress, decompress };
