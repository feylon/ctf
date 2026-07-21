// src/entity/tournament-settings.entity.ts
import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('tournament_settings')
export class TournamentSettings {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ default: true })
  isLive!: boolean; // Musobaqa aktivmi yoki to'xtatib qo'yilganmi

  @Column({ type: 'timestamptz', nullable: true })
  globalStartTime?: Date; // Global boshlanish vaqti

  @Column({ type: 'timestamptz', nullable: true })
  globalEndTime?: Date; // Global tugash vaqti

  @UpdateDateColumn()
  updatedAt!: Date;
}