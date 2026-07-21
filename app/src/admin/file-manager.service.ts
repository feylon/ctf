// src/admin/file-manager.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../entity/folder.entity';
import { FileEntity } from '../entity/file.entity';
import * as fs from 'fs';
import type { Request } from 'express';
import * as path from 'path';

@Injectable()
export class FileManagerService {
  private readonly uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor(
    @InjectRepository(Folder) private folderRepo: Repository<Folder>,
    @InjectRepository(FileEntity) private fileRepo: Repository<FileEntity>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // --- PAPKALAR BILAN ISHLASH ---

  async createFolder(name: string, parentId?: string, userId?: string) {
    const folder = this.folderRepo.create({
      name,
      parentId: parentId || undefined,
      createdBy: userId ? ({ id: userId } as any) : undefined,
    });
    return await this.folderRepo.save(folder);
  }

  async getFoldersAndFiles(parentId?: string) {
    // Berilgan papka ichidagi sub-papkalar va fayllarni qaytaradi
    const folders = await this.folderRepo.find({
      where: { parentId: parentId || undefined },
      order: { createdAt: 'DESC' },
    });

    const files = await this.fileRepo.find({
      where: { folderId: parentId || undefined },
      order: { createdAt: 'DESC' },
    });

    return { folders, files };
  }

  // --- FAYLLAR BILAN ISHLASH ---

  async uploadFile(file: Express.Multer.File, req: Request, folderId?: string, userId?: string) {
    if (!file) {
      throw new NotFoundException('Fayl yuborilmadi');
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const relativePath = path.join('uploads', uniqueName);
    const absolutePath = path.join(this.uploadDir, uniqueName);

    fs.writeFileSync(absolutePath, file.buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    const fileUrl = `${protocol}://${host}/uploads/${uniqueName}`;

    const newFile = this.fileRepo.create({
      originalName: file.originalname,
      fileName: uniqueName,
      filePath: relativePath,
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl, // Shu URL ni admin bir tugma bosib copy qiladi
      folderId: folderId || undefined,
      uploadedBy: userId ? ({ id: userId } as any) : undefined,
    });

    return await this.fileRepo.save(newFile);
  }

  async deleteFile(fileId: string) {
    const file = await this.fileRepo.findOne({ where: { id: fileId } });
    if (!file) {
      throw new NotFoundException('Fayl topilmadi');
    }

    const absolutePath = path.join(__dirname, '..', '..', file.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath); // Diskdan o'chirish
    }

    await this.fileRepo.remove(file);
    return { success: true, message: 'Fayl bazadan va jamg‘armadan o‘chirildi' };
  }
}