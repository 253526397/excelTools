/**
 * 配置表加密/解密工具
 *
 * 加密流程: JSON 文本 → pako 压缩 → AES 加密 → .dat 文件
 */
import * as fs from 'fs';
import * as path from 'path';
import * as pako from 'pako';
import CryptoJS from 'crypto-js';
import { info, debug } from './logger';

/** AES 加密 */
function encryptStringAES(plainText: string, secretKey: string): string {
  return CryptoJS.AES.encrypt(plainText, secretKey).toString();
}

/** pako 压缩后转 base64 */
function compressString(input: string): string {
  const compressed = pako.deflate(input);
  return Buffer.from(compressed).toString('base64');
}

/** 压缩 + 加密 */
function secureString(input: string, secretKey: string): string {
  const compressed = compressString(input);
  return encryptStringAES(compressed, secretKey);
}

/**
 * 加密目录下所有 JSON 文件，输出为 .dat 文件
 */
export function encryptJsonFiles(directory: string, outputDirectory: string, secretKey: string): void {
  if (!fs.existsSync(directory)) {
    debug(`[crypto] 源目录不存在: ${directory}`);
    return;
  }

  fs.mkdirSync(outputDirectory, { recursive: true });

  const jsonFiles = fs.readdirSync(directory).filter(file => file.endsWith('.json'));
  if (jsonFiles.length === 0) return;

  info(`加密 ${jsonFiles.length} 个 JSON 文件...`);

  for (const jsonFile of jsonFiles) {
    const filePath = path.join(directory, jsonFile);
    const text = fs.readFileSync(filePath, 'utf-8');
    const encrypted = secureString(text, secretKey);
    const outputPath = path.join(outputDirectory, jsonFile.replace('.json', '.dat'));
    fs.writeFileSync(outputPath, encrypted, 'utf-8');
    debug(`  已加密: ${jsonFile} → ${path.basename(outputPath)}`);
  }

  info(`加密完成 → ${outputDirectory}`);
}
