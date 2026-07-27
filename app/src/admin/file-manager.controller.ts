// src/admin/file-manager.controller.ts
import {
  Controller, Post, Get, Delete, Patch, Param, Body, Query,
  UseInterceptors, UploadedFile, UseGuards,
  ParseFilePipe, MaxFileSizeValidator, ParseUUIDPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileManagerService } from './file-manager.service';
import { CreateFolderDto, FolderQueryDto, RenameFolderDto } from './dto/create-folder.dto';
import { UploadFileDto } from './dto/upload-file.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { Role } from 'src/entity/user.entity';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { AuthUser } from 'src/common/types/auth-user';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

@ApiTags('Admin - File & Folder Manager')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.MODERATOR)
@Controller('admin/file-manager')
export class FileManagerController {
  constructor(private readonly fileManagerService: FileManagerService) { }

  @Post('folders')
  @ApiOperation({ summary: 'Yangi papka ochish' })
  async createFolder(@Body() dto: CreateFolderDto, @CurrentUser() user: AuthUser) {
    return await this.fileManagerService.createFolder(dto.name, dto.parentId, user.id);
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Papka nomini o‘zgartirish' })
  async renameFolder(@Param('id', ParseUUIDPipe) id: string, @Body() dto: RenameFolderDto) {
    return await this.fileManagerService.renameFolder(id, dto.name);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Papkani ichidagi barcha fayllar bilan o‘chirish' })
  async deleteFolder(@Param('id', ParseUUIDPipe) id: string) {
    return await this.fileManagerService.deleteFolder(id);
  }

  @Get()
  @ApiOperation({ summary: 'Papka ichidagi papkalar va fayllar ro‘yxatini olish (Root yoki parentId bo‘yicha)' })
  async getContents(@Query() query: FolderQueryDto) {
    return await this.fileManagerService.getFoldersAndFiles(query.parentId);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE + 1 } }))
  @ApiOperation({ summary: 'Maʼlum bir papkaga fayl yuklash (Maksimal hajm: 10 MB)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Yuklanadigan fayl (Maks: 10MB)',
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
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: MAX_FILE_SIZE,
            message: 'Fayl hajmi 10 MB dan oshmasligi kerak!',
          }),
        ],
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadFileDto,
    @CurrentUser() user: AuthUser,
  ) {
    return await this.fileManagerService.uploadFile(file, dto.folderId, user.id);
  }

  @Delete('files/:id')
  @ApiOperation({ summary: 'Faylni bazadan va diskdan o‘chirish' })
  async deleteFile(@Param('id', ParseUUIDPipe) fileId: string) {
    return await this.fileManagerService.deleteFile(fileId);
  }
}
