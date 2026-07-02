import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

@Injectable()
export class TemporaryFileManagerService implements OnModuleDestroy {
  private readonly baseDir = path.join(os.tmpdir(), 'colgnss-rinex');
  private readonly activeSessions = new Set<string>();

  private sessionDir(sessionId: string): string {
    return path.join(this.baseDir, sessionId);
  }

  createSession(sessionId: string): string {
    const dir = this.sessionDir(sessionId);
    fs.mkdirSync(dir, { recursive: true });
    this.activeSessions.add(sessionId);
    return dir;
  }

  saveFile(sessionId: string, file: Express.Multer.File): string {
    const dir = this.sessionDir(sessionId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.activeSessions.add(sessionId);
    }
    const filePath = path.join(dir, file.originalname);
    fs.writeFileSync(filePath, file.buffer);
    return filePath;
  }

  saveBuffer(sessionId: string, buffer: Buffer, fileName: string): string {
    const dir = this.sessionDir(sessionId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.activeSessions.add(sessionId);
    }
    const filePath = path.join(dir, fileName);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  getFilePath(sessionId: string): string | null {
    const dir = this.sessionDir(sessionId);
    if (!fs.existsSync(dir)) return null;
    const files = fs.readdirSync(dir).filter(f => !f.startsWith('.'));
    return files.length > 0 ? path.join(dir, files[0]) : null;
  }

  readFile(sessionId: string): Buffer | null {
    const filePath = this.getFilePath(sessionId);
    if (!filePath) return null;
    return fs.readFileSync(filePath);
  }

  readFileAsString(sessionId: string): string | null {
    const buf = this.readFile(sessionId);
    return buf ? buf.toString('utf-8') : null;
  }

  deleteSession(sessionId: string): void {
    const dir = this.sessionDir(sessionId);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    this.activeSessions.delete(sessionId);
  }

  sessionExists(sessionId: string): boolean {
    return fs.existsSync(this.sessionDir(sessionId));
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  cleanupExpired(): void {
    if (!fs.existsSync(this.baseDir)) return;
    const now = Date.now();
    const maxAge = 2 * 60 * 60 * 1000; // 2 hours
    const dirs = fs.readdirSync(this.baseDir);
    for (const dir of dirs) {
      const fullPath = path.join(this.baseDir, dir);
      try {
        const stat = fs.statSync(fullPath);
        if (now - stat.mtimeMs > maxAge) {
          fs.rmSync(fullPath, { recursive: true, force: true });
          this.activeSessions.delete(dir);
        }
      } catch {}
    }
  }

  onModuleDestroy(): void {
    for (const sessionId of this.activeSessions) {
      this.deleteSession(sessionId);
    }
    if (fs.existsSync(this.baseDir)) {
      try {
        fs.rmSync(this.baseDir, { recursive: true, force: true });
      } catch {}
    }
  }
}
