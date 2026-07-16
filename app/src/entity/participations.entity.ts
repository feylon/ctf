import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";
import { ChallengeGroup } from "./challenge_groups.entity";

@Entity('participations')
export class Participation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.participations)
  user!: User;

  @ManyToOne(() => ChallengeGroup, (group) => group.participants)
  group!: ChallengeGroup;

  @CreateDateColumn()
  joinedAt!: Date;
}