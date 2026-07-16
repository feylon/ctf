import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('login_history')
export class LoginHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ipAddress!: string;

  @Column({ nullable: true })
  location!: string; // Yoki API orqali aniqlangan shahar/davlat

  @Column()
  status!: 'success' | 'failed';

  @ManyToOne(() => User, (user) => user.loginHistories, { onDelete: 'CASCADE' })
  user?: User;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}