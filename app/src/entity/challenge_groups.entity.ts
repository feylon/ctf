import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Challenge } from "./challenge.entity";
import { Participation } from "./participations.entity";

@Entity('challenge_groups')
export class ChallengeGroup {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column()
    name!: string;

    @OneToMany(() => Challenge, (challenge) => challenge.group)
    challenges!: Challenge[];

    @OneToMany(() => Participation, (participation) => participation.group)
    participants!: Participation[];
}