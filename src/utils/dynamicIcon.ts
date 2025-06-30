import { app, nativeImage } from 'electron';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { PNG } from 'pngjs';
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

  private loadClaudeIcon(): Electron.NativeImage | null {
    try {
      // Use app.getAppPath() to get the correct base path
      const appPath = app.getAppPath();
      const iconPath = path.join(appPath, 'assets', 'icon.iconset', 'icon_32x32.png');
      console.log('Trying to load icon from:', iconPath);
      
      const icon = nativeImage.createFromPath(iconPath);
      
      if (!icon.isEmpty()) {
        return icon.resize({ width: 24, height: 24 });
      } else {
        console.error('Icon is empty at path:', iconPath);
      }
    } catch (error) {
      console.error('Failed to load Claude icon:', error);
    }
    return null;
  }

  private createPngIcon(text: string, symbol: string): Electron.NativeImage {
    const claudeIcon = this.loadClaudeIcon();
    
    // If we have text and the Claude icon loaded successfully, create a composite
    if (claudeIcon && text.length > 0) {
      const iconWidth = 24;
      const textWidth = text.length * 10;
      const gap = 2;
      const totalWidth = iconWidth + gap + textWidth;
      const height = 24;
      
      // Create composite pixels
      const pixels = new Uint8Array(totalWidth * height * 4);
      
      // Fill with transparent background
      for (let i = 0; i < pixels.length; i += 4) {
        pixels[i] = 0;     // R
        pixels[i + 1] = 0; // G
        pixels[i + 2] = 0; // B
        pixels[i + 3] = 0; // A
      }
      
      // Extract pixels from the Claude icon and composite them
      const iconPixels = this.extractPixelsFromNativeImage(claudeIcon);
      
      if (iconPixels) {
        // Composite the Claude icon pixels into the left part of our image
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < iconWidth; x++) {
            const srcIndex = (y * iconWidth + x) * 4;
            const destIndex = (y * totalWidth + x) * 4;
            
            // Copy Claude icon pixels
            pixels[destIndex] = iconPixels[srcIndex];         // R
            pixels[destIndex + 1] = iconPixels[srcIndex + 1]; // G
            pixels[destIndex + 2] = iconPixels[srcIndex + 2]; // B
            pixels[destIndex + 3] = iconPixels[srcIndex + 3]; // A
          }
        }
      } else {
        // Fallback: Draw a placeholder if pixel extraction fails
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < iconWidth; x++) {
            const pixelIndex = (y * totalWidth + x) * 4;
            pixels[pixelIndex] = 200;     // R - light gray placeholder
            pixels[pixelIndex + 1] = 200; // G
            pixels[pixelIndex + 2] = 200; // B
            pixels[pixelIndex + 3] = 255; // A
          }
        }
      }
      
      // Draw text portion
      let textX = iconWidth + gap;
      for (const char of text) {
        const charPixels = this.getDigitPixels(char);
        
        for (let py = 0; py < charPixels.length; py++) {
          for (let px = 0; px < charPixels[py].length; px++) {
            if (charPixels[py][px]) {
              const x = textX + px;
              const y = 4 + py; // Center 16px text in 24px height
              if (x >= 0 && x < totalWidth && y >= 0 && y < height) {
                const pixelIndex = (y * totalWidth + x) * 4;
                pixels[pixelIndex] = 255;     // R - white
                pixels[pixelIndex + 1] = 255; // G
                pixels[pixelIndex + 2] = 255; // B
                pixels[pixelIndex + 3] = 255; // A
              }
            }
          }
        }
        textX += 10;
      }
      
      // Return the composite image
      return this.createPngFromPixels(pixels, totalWidth, height);
    }
    
    // Fallback: Original implementation with white circle
    const width = 24 + (text.length * 10);
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
    
    // Draw symbol in circle center
    const symbolPixels = this.getDigitPixels(symbol);
    const symbolStartX = centerX - 4;
    const symbolStartY = centerY - 8;
    
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
    
    // Draw text
    let textX = 26;
    for (const char of text) {
      const charPixels = this.getDigitPixels(char);
      
      for (let py = 0; py < charPixels.length; py++) {
        for (let px = 0; px < charPixels[py].length; px++) {
          if (charPixels[py][px]) {
            const x = textX + px;
            const y = 4 + py;
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
      textX += 10;
    }
    
    // Convert to PNG format
    return this.createPngFromPixels(pixels, width, height);
  }

  private extractPixelsFromNativeImage(image: Electron.NativeImage): Uint8Array | null {
    try {
      // Read the original PNG file directly and decode it using pngjs
      const appPath = app.getAppPath();
      const iconPath = path.join(appPath, 'assets', 'icon.iconset', 'icon_32x32.png');
      
      if (fs.existsSync(iconPath)) {
        const pngBuffer = fs.readFileSync(iconPath);
        const png = PNG.sync.read(pngBuffer);
        
        // Resize to 24x24 if needed
        if (png.width === 24 && png.height === 24) {
          // Already the right size, return the data directly
          return new Uint8Array(png.data);
        } else {
          // Need to resize - use a simple nearest neighbor scaling
          const resized = this.resizeImageData(png.data, png.width, png.height, 24, 24);
          return resized;
        }
      }
      
      console.log('Could not find PNG file, using fallback');
      return null;
    } catch (error) {
      console.error('Error extracting pixels from PNG file:', error);
      return null;
    }
  }

  private resizeImageData(
    data: Buffer, 
    srcWidth: number, 
    srcHeight: number, 
    destWidth: number, 
    destHeight: number
  ): Uint8Array {
    const resized = new Uint8Array(destWidth * destHeight * 4);
    
    for (let y = 0; y < destHeight; y++) {
      for (let x = 0; x < destWidth; x++) {
        // Simple nearest neighbor scaling
        const srcX = Math.floor((x / destWidth) * srcWidth);
        const srcY = Math.floor((y / destHeight) * srcHeight);
        
        const srcIndex = (srcY * srcWidth + srcX) * 4;
        const destIndex = (y * destWidth + x) * 4;
        
        resized[destIndex] = data[srcIndex];         // R
        resized[destIndex + 1] = data[srcIndex + 1]; // G
        resized[destIndex + 2] = data[srcIndex + 2]; // B
        resized[destIndex + 3] = data[srcIndex + 3]; // A
      }
    }
    
    return resized;
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
    }
    return this.createCostIcon(value);
  }

  createStaticIcon(): Electron.NativeImage {
    const claudeIcon = this.loadClaudeIcon();
    
    if (claudeIcon) {
      return claudeIcon;
    }
    
    // Fallback: Create a simple 'C' icon if loading fails
    const width = 24;
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
    
    // Draw white circle
    const centerX = 12;
    const centerY = 12;
    const radius = 10;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - centerX;
        const dy = y - centerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance <= radius) {
          const pixelIndex = (y * width + x) * 4;
          pixels[pixelIndex] = 255;     // R
          pixels[pixelIndex + 1] = 255; // G
          pixels[pixelIndex + 2] = 255; // B
          pixels[pixelIndex + 3] = 255; // A
        }
      }
    }
    
    // Draw 'C' in circle center
    const symbolPixels = this.getDigitPixels('C');
    const symbolStartX = centerX - 4;
    const symbolStartY = centerY - 8;
    
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
    
    // Convert to PNG format
    return this.createPngFromPixels(pixels, width, height);
  }
}