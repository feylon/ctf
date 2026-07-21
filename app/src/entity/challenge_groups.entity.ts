import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Challenge } from "./challenge.entity";
import { Participation } from "./participations.entity";
import { Team } from "./team.entity";

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


    @ManyToMany(() => Team, (team) => team.challengeGroups)
    @JoinTable({
        name: 'challenge_group_teams',
        joinColumn: { name: 'challengeGroupId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'teamId', referencedColumnName: 'id' },
    })
    teams!: Team[];
}