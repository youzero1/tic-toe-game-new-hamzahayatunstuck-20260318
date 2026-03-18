import 'reflect-metadata';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity()
export class GameResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  winner!: string;

  @CreateDateColumn()
  datePlayed!: Date;
}
