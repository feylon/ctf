import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('problems')
export class Problem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code!: string; 

  @Column({ type: 'varchar', length: 255 })
  title!: string; 

  @Column({ type: 'text' })
  description!: string; 

  // --- YANGI QO'SHILGAN QISM ---
  @Column({ type: 'varchar', nullable: true, select: false }) // select: false orqali API da javob ketib qolishining oldi olinadi
  flagHash!: string; // Masalaning to'g'ri javobi (hashlangan holatda)
  // -----------------------------

  @Column({ type: 'int', default: 0 })
  difficulty!: number; 

  @Column({ type: 'varchar', length: 100 })
  category!: string; 

  @Column({ type: 'float', default: 0.0 })
  rating!: number; 

  @Column({ type: 'int', default: 0 })
  points!: number; 

  @Column({ type: 'int', default: 0 })
  solvedCount!: number; 

  @Column({ type: 'int', default: 0 })
  totalTries!: number; 

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}