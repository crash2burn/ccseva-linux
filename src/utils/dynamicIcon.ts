import { nativeImage } from 'electron';
import * as zlib from 'node:zlib';
import { digitPatterns } from './digitPatterns.js';

export class DynamicTrayIcon {
  private static instance: DynamicTrayIcon;
  
  static getInstance(): DynamicTrayIcon {
    if (!DynamicTrayIcon.instance) {
      DynamicTrayIcon.instance = new DynamicTrayIcon();
    }
    return DynamicTrayIcon.instance;
  }

  private crc32(buffer: Buffer): number {
    let crc = 0xffffffff;
    for (let i = 0; i < buffer.length; i++) {
      crc = crc ^ buffer[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (0xEDB88320 * (crc & 1));
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  private createChunk(type: string, data: Buffer): Buffer {
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(data.length);
    
    const typeAndData = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.allocUnsafe(4);
    crc.writeUInt32BE(this.crc32(typeAndData));
    
    return Buffer.concat([length, typeAndData, crc]);
  }

  private getDigitPixels(digit: string): boolean[][] {
    return digitPatterns[digit] || digitPatterns[' '];
  }

  private createPngIcon(text: string, symbol: string): Electron.NativeImage {
    const width = 24 + (text.length * 10); // Dynamic width: 24px for circle + 10px per character
    const height = 24;
    
    // Create RGBA pixel data
    const pixels = new Uint8Array(width * height * 4);
    
    // Fill with transparent background
    for (let i = 0; i < pixels.length; i += 4) {
      pixels[i] = 0;     // R
      pixels[i + 1] = 0; // G
      pixels[i + 2] = 0; // B
      pixels[i + 3] = 0; // A
    }
    
    // Draw white circle (icon background)
    const centerX = 12;
    const centerY = 12;
    const radius = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius && x < 24) {
          const pixelIndex = (y * width + x) * 4;
          pixels[pixelIndex] = 255;     // R
          pixels[pixelIndex + 1] = 255; // G
          pixels[pixelIndex + 2] = 255; // B
          pixels[pixelIndex + 3] = 255; // A
        }
      }
    }
    
    // Draw symbol in circle center (full size)
    const symbolPixels = this.getDigitPixels(symbol);
    const symbolStartX = centerX - 4; // Center the 8-wide symbol
    const symbolStartY = centerY - 8; // Center the 16-tall symbol
    
    // Draw full-size symbol in circle
    for (let py = 0; py < symbolPixels.length; py++) {
      for (let px = 0; px < symbolPixels[py].length; px++) {
        if (symbolPixels[py][px]) {
          const x = symbolStartX + px;
          const y = symbolStartY + py;
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const pixelIndex = (y * width + x) * 4;
            pixels[pixelIndex] = 0;       // R - black
            pixels[pixelIndex + 1] = 0;   // G
            pixels[pixelIndex + 2] = 0;   // B
            pixels[pixelIndex + 3] = 255; // A
          }
        }
      }
    }
    
    // Draw text using full height (16 pixels tall, starting at y=4 to center in 24px height)
    let textX = 26; // Start text closer to the circle
    for (const char of text) {
      const charPixels = this.getDigitPixels(char);
      
      for (let py = 0; py < charPixels.length; py++) {
        for (let px = 0; px < charPixels[py].length; px++) {
          if (charPixels[py][px]) {
            const x = textX + px;
            const y = 4 + py; // Start at y=4 to center 16px text in 24px height
            if (x >= 0 && x < width && y >= 0 && y < height) {
              const pixelIndex = (y * width + x) * 4;
              pixels[pixelIndex] = 255;     // R - white
              pixels[pixelIndex + 1] = 255; // G
              pixels[pixelIndex + 2] = 255; // B
              pixels[pixelIndex + 3] = 255; // A
            }
          }
        }
      }
      textX += 10; // Increased character spacing for 8-wide characters
    }
    
    // Convert to PNG format
    return this.createPngFromPixels(pixels, width, height);
  }

  private createPngFromPixels(pixels: Uint8Array, width: number, height: number): Electron.NativeImage {
    // Add filter bytes (0 = no filter) to each row
    const rowSize = width * 4 + 1;
    const imageData = new Uint8Array(height * rowSize);
    
    for (let y = 0; y < height; y++) {
      const rowStart = y * rowSize;
      imageData[rowStart] = 0; // filter type
      
      const pixelRowStart = y * width * 4;
      for (let i = 0; i < width * 4; i++) {
        imageData[rowStart + 1 + i] = pixels[pixelRowStart + i];
      }
    }
    
    // Compress image data
    const compressedData = zlib.deflateSync(imageData);
    
    // Create PNG
    const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    
    // IHDR chunk
    const ihdrData = Buffer.allocUnsafe(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData[8] = 8;  // bit depth
    ihdrData[9] = 6;  // color type (RGBA)
    ihdrData[10] = 0; // compression
    ihdrData[11] = 0; // filter
    ihdrData[12] = 0; // interlace
    
    const ihdr = this.createChunk('IHDR', ihdrData);
    const idat = this.createChunk('IDAT', compressedData);
    const iend = this.createChunk('IEND', Buffer.alloc(0));
    
    const png = Buffer.concat([signature, ihdr, idat, iend]);
    
    try {
      return nativeImage.createFromBuffer(png);
    } catch (error) {
      console.error('Failed to create PNG icon:', error);
      return nativeImage.createEmpty();
    }
  }

  createPercentageIcon(percentage: number): Electron.NativeImage {
    const text = `${Math.round(percentage)}%`;
    return this.createPngIcon(text, '%');
  }

  createCostIcon(cost: number): Electron.NativeImage {
    // cost should be in whole dollars
    const text = `$${Math.round(cost)}`;
    return this.createPngIcon(text, '$');
  }

  createIcon(value: number, isPercentage: boolean): Electron.NativeImage {
    if (isPercentage) {
      return this.createPercentageIcon(value);
    } else {
      return this.createCostIcon(value);
    }
  }
}