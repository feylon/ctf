// src/admin/file-manager.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Folder } from '../entity/folder.entity';
import { FileEntity } from '../entity/file.entity';
import * as fs from 'fs';
import * as path from 'path';
import type { Request } from 'express';

@Injectable()
export class FileManagerService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

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
    let folderPath = this.uploadDir;

    // Agar ota papkasi bo'lsa, uning diskdagi yo'lini topib, ichida yangi papka ochamiz
    if (parentId) {
      const parentFolder = await this.folderRepo.findOne({ where: { id: parentId } });
      if (parentFolder) {
        // Papka nomlarini xavfsiz qilish uchun trim qilamiz
        folderPath = path.join(process.cwd(), 'uploads', parentFolder.name, name);
      } else {
        folderPath = path.join(this.uploadDir, name);
      }
    } else {
      folderPath = path.join(this.uploadDir, name);
    }

    // Diskda haqiqiy papka hosil qilamiz
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const folder = this.folderRepo.create({
      name,
      parentId: parentId || undefined,
      createdBy: userId ? ({ id: userId } as any) : undefined,
    });
    return await this.folderRepo.save(folder);
  }

  async getFoldersAndFiles(parentId?: string) {
    const folders = await this.folderRepo.find({
      where: { parentId: parentId || undefined },
      order: { createdAt: 'DESC' },
    });

    const files = await this.fileRepo.find({
      where: { folderId: parentId || undefined },
      order: { createdAt: 'DESC' },
    });

    const checkedFiles = files.map((file) => {
      const absolutePath = path.join(process.cwd(), file.filePath);
      const existsOnDisk = fs.existsSync(absolutePath);
      return {
        ...file,
        existsOnDisk,
        warning: !existsOnDisk ? 'Diqqat: Fayl bazada mavjud, lekin server diskidan o‘chib ketgan!' : null,
      };
    });

    return { folders, files: checkedFiles };
  }

  // --- FAYLLAR BILAN ISHLASH ---

  async uploadFile(file: Express.Multer.File, req: Request, folderId?: string, userId?: string) {
    if (!file) {
      throw new NotFoundException('Fayl yuborilmadi');
    }

    let targetDir = this.uploadDir;
    let dbRelativeSubPath = 'uploads';

    // Agar fayl ma'lum bir papkaga yuklanayotgan bo'lsa, o'sha papka diskda borligini tekshiramiz
    if (folderId) {
      const folder = await this.folderRepo.findOne({ where: { id: folderId } });
      if (folder) {
        targetDir = path.join(this.uploadDir, folder.name);
        dbRelativeSubPath = path.join('uploads', folder.name);
        
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
      }
    }

    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    
    const relativePath = path.join(dbRelativeSubPath, uniqueName);
    const absolutePath = path.join(targetDir, uniqueName);

    // Faylni tegishli papkaga yozamiz
    fs.writeFileSync(absolutePath, file.buffer);

    const protocol = req.protocol;
    const host = req.get('host');
    // URL manzili to'g'ri shakllanishi uchun
    const fileUrl = `${protocol}://${host}/${relativePath.replace(/\\/g, '/')}`;

    const newFile = this.fileRepo.create({
      originalName: file.originalname,
      fileName: uniqueName,
      filePath: relativePath.replace(/\\/g, '/'),
      mimetype: file.mimetype,
      size: file.size,
      url: fileUrl,
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

    const absolutePath = path.join(process.cwd(), file.filePath);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await this.fileRepo.remove(file);
    return { success: true, message: 'Fayl bazadan va diskdan o‘chirildi' };
  }
}