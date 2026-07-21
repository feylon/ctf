// src/admin/file-manager.controller.ts
import { Controller, Post, Get, Delete, Param, Body, Query, UseInterceptors, UploadedFile, Req, UseGuards } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileManagerService } from './file-manager.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard'; 
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'global/types'; 
import type { Request } from 'express';

@ApiTags('Admin - File & Folder Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/file-manager')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) {}

  @Post('folders')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Yangi papka ochish' })
  async createFolder(@Body() dto: CreateFolderDto, @Req() req: any) {
    return await this.fileManagerService.createFolder(dto.name, dto.parentId, req.user?.id);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Papka ichidagi papkalar va fayllar ro‘yxatini olish (Root yoki parentId bo‘yicha)' })
  async getContents(@Query('parentId') parentId?: string) {
    return await this.fileManagerService.getFoldersAndFiles(parentId);
  }

  @Post('upload')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Maʼlum bir papkaga fayl yuklash va uning public URL manzilini olish' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yuklanadigan fayl',
        },
        folderId: {
          type: 'string',
          format: 'uuid',
          description: 'Papka UUID si (ixtiyoriy)',
          nullable: true,
        },
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @Req() req: Request,
  ) {
    return await this.fileManagerService.uploadFile(file, req, dto.folderId, (req as any).user?.id);
  }

  @Delete('files/:id')
  @Roles(Role.ADMIN, Role.MODERATOR)
  @ApiOperation({ summary: 'Faylni bazadan va diskdan o‘chirish' })
  async deleteFile(@Param('id') fileId: string) {
    return await this.fileManagerService.deleteFile(fileId);
  }
}