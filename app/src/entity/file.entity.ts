// src/entity/file.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Folder } from './folder.entity';
import { User } from './user.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  originalName!: string; // Asl nomi (masalan: exploit.zip)

  @Column()
  fileName!: string; // Serverdagi unikal nomi (masalan: 17123456-exploit.zip)

  @Column()
  filePath!: string; // Serverdagi to'liq yo'li (uploads/challenges/...)

  @Column()
  mimetype!: string; // Fayl turi (application/zip, image/png, va h.k.)

  @Column({ type: 'bigint' })
  size!: number; // Baytlarda hajmi

  @Column()
  url!: string; // Frontend uchun tayyor public URL (nusxalash uchun)

  @Column({ nullable: true })
  folderId?: string; // Qaysi papkaga tegishliligi

  @ManyToOne(() => Folder, (folder) => folder.files, { onDelete: 'CASCADE', nullable: true })
  folder?: Folder;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  uploadedBy?: User; // Kim yuklagani

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}