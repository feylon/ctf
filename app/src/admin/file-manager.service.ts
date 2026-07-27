// src/admin/file-manager.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Folder } from '../entity/folder.entity';
import { FileEntity } from '../entity/file.entity';
import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

@Injectable()
export class FileManagerService {
  private readonly rootDir = process.cwd();
  private readonly uploadDir = path.join(this.rootDir, 'uploads');

  constructor(
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(FileEntity) private fileRepo: Repository<FileEntity>,
  ) {
    fs.mkdirSync(this.uploadDir, { recursive: true });
  }

  // Bazadagi nisbiy yo'l uploads papkasidan tashqariga chiqmasligini kafolatlaydi
  private resolveSafe(relativePath: string) {
    const absolute = path.resolve(this.rootDir, relativePath);
    if (!absolute.startsWith(this.uploadDir + path.sep)) {
      throw new BadRequestException('Yaroqsiz fayl yo\'li');
    }
    return absolute;
  }

  private normalizeName(name: string) {
    const trimmed = name.trim();
    if (!trimmed || trimmed === '.' || trimmed === '..' || /[\\/\0]/.test(trimmed)) {
      throw new BadRequestException('Papka nomida / \\ belgilari bo\'lishi mumkin emas');
    }
    return trimmed;
  }

  private async findFolderOrFail(id: string) {
    const folder = await this.folderRepo.findOne({ where: { id } });
    if (!folder) throw new NotFoundException('Papka topilmadi');
    return folder;
  }

  // --- PAPKALAR BILAN ISHLASH ---

  async createFolder(name: string, parentId?: string, userId?: string) {
    const folderName = this.normalizeName(name);
    if (parentId) await this.findFolderOrFail(parentId);

    const duplicate = await this.folderRepo.exists({
      where: { name: folderName, parentId: parentId ? parentId : IsNull() },
    });
    if (duplicate) throw new BadRequestException('Bu nomdagi papka allaqachon mavjud');

    // Papkalar faqat bazada saqlanadi; diskda fayllar papka ID si bo'yicha joylashadi
    const folder = this.folderRepo.create({
      name: folderName,
      parentId: parentId || undefined,
      createdBy: userId ? ({ id: userId } as any) : undefined,
    });
    return await this.folderRepo.save(folder);
  }

  async renameFolder(id: string, name: string) {
    const folder = await this.findFolderOrFail(id);
    folder.name = this.normalizeName(name);
    return await this.folderRepo.save(folder);
  }

  // Papka va uning barcha ichki papka/fayllarini o'chiradi
  async deleteFolder(id: string) {
    await this.findFolderOrFail(id);

    const folderIds: string[] = [];
    const queue = [id];
    while (queue.length) {
      const current = queue.shift()!;
      folderIds.push(current);
      const children = await this.folderRepo.find({ where: { parentId: current }, select: { id: true } });
      queue.push(...children.map((c) => c.id));
    }

    let deletedFiles = 0;
    for (const folderId of folderIds) {
      const files = await this.fileRepo.find({ where: { folderId } });
      for (const file of files) {
        this.removeFromDisk(file.filePath);
        deletedFiles++;
      }
      await this.fileRepo.remove(files);
      fs.rmSync(path.join(this.uploadDir, 'files', folderId), { recursive: true, force: true });
    }

    // Ichki papkalar ON DELETE CASCADE orqali o'chadi
    await this.folderRepo.delete(id);

    return { success: true, message: `Papka o'chirildi (${folderIds.length} ta papka, ${deletedFiles} ta fayl)` };
  }

  private async getBreadcrumbs(folderId?: string) {
    const crumbs: { id: string; name: string }[] = [];
    let currentId = folderId;
    // Cheksiz sikldan himoya
    for (let depth = 0; currentId && depth < 50; depth++) {
      const folder = await this.folderRepo.findOne({ where: { id: currentId }, select: { id: true, name: true, parentId: true } });
      if (!folder) break;
      crumbs.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    }
    return crumbs;
  }

  async getFoldersAndFiles(parentId?: string) {
    if (parentId) await this.findFolderOrFail(parentId);

    const folders = await this.folderRepo.find({
      where: { parentId: parentId ? parentId : IsNull() },
      order: { name: 'ASC' },
    });

    const files = await this.fileRepo.find({
      where: { folderId: parentId ? parentId : IsNull() },
      order: { createdAt: 'DESC' },
    });

    const checkedFiles = files.map((file) => {
      let existsOnDisk = false;
      try {
        existsOnDisk = fs.existsSync(this.resolveSafe(file.filePath));
      } catch {
        existsOnDisk = false;
      }
      return {
        ...file,
        size: Number(file.size),
        existsOnDisk,
        warning: !existsOnDisk ? 'Diqqat: Fayl bazada mavjud, lekin server diskidan o‘chib ketgan!' : null,
      };
    });

    return {
      folders,
      files: checkedFiles,
      breadcrumbs: await this.getBreadcrumbs(parentId),
    };
  }

  // --- FAYLLAR BILAN ISHLASH ---

  async uploadFile(file: Express.Multer.File, folderId?: string, userId?: string) {
    if (!file) {
      throw new BadRequestException('Fayl yuborilmadi');
    }
    if (folderId) await this.findFolderOrFail(folderId);

    const subDir = path.join('uploads', 'files', folderId ?? 'root');
    fs.mkdirSync(path.join(this.rootDir, subDir), { recursive: true });

    // Kengaytma faqat xavfsiz belgilardan iborat bo'lishi kerak
    const ext = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '').slice(0, 10);
    const uniqueName = `${Date.now()}-${randomBytes(6).toString('hex')}${ext}`;
    const relativePath = path.posix.join(subDir.split(path.sep).join('/'), uniqueName);

    fs.writeFileSync(this.resolveSafe(relativePath), file.buffer);

    const newFile = this.fileRepo.create({
      // Multer nomlarni latin1 sifatida o'qiydi, UTF-8 nomlarni tiklaymiz
      originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      fileName: uniqueName,
      filePath: relativePath,
      mimetype: file.mimetype,
      size: file.size,
      // Domen proxy/frontendga bog'liq bo'lgani uchun nisbiy URL saqlanadi
      url: `/${relativePath}`,
      folderId: folderId || undefined,
      uploadedBy: userId ? ({ id: userId } as any) : undefined,
    });

    const saved = await this.fileRepo.save(newFile);
    return { ...saved, size: Number(saved.size) };
  }

  private removeFromDisk(relativePath: string) {
    try {
      const absolutePath = this.resolveSafe(relativePath);
      if (fs.existsSync(absolutePath)) fs.unlinkSync(absolutePath);
    } catch {
      // Diskda yo'q yoki yo'li yaroqsiz fayl - bazadan o'chirish davom etaveradi
    }
  }

  async deleteFile(fileId: string) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('Fayl topilmadi');
    }

    this.removeFromDisk(file.filePath);
    await this.fileRepo.remove(file);
    return { success: true, message: 'Fayl bazadan va diskdan o‘chirildi' };
  }
}
