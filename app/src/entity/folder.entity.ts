// src/entity/folder.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn } from 'typeorm';
import { User } from './user.entity';
import { FileEntity } from './file.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string; // Papka nomi

  @Column({ nullable: true })
  parentId?: string; // Ota papka ID si (null bo'lsa - asosiy root papka)

  @ManyToOne(() => Folder, (folder) => folder.children, { onDelete: 'CASCADE', nullable: true })
  parent?: Folder;

  @OneToMany(() => Folder, (folder) => folder.parent)
  children?: Folder[];

  @OneToMany(() => FileEntity, (file) => file.folder)
  files?: FileEntity[];

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  createdBy?: User; // Kim yaratgani

  @CreateDateColumn()
  createdAt!: Date;
}