import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Genero } from "./enum/Genero";
import { Jogo } from "./enum/Jogo";
import { Funcao } from "./enum/Funcao";





@Entity('tbl_perfil')
export class Perfil {
  @PrimaryGeneratedColumn()
  id: number
  @Column({length: 100, unique: true})
  nome_usuario: string
  @Column({length: 100})
  nome_completo?: string
  @Column({length: 255, unique: true})
  email: string
  @Column({type : 'text'})
  senha: string
  @Column({type : 'date'})
  data_nascimento: Date
  @Column({type : 'int'})
  genero: Genero
}




@Entity('tbl_jogador')
export class Jogador {
  @PrimaryGeneratedColumn()
  id: number
  @OneToOne(() => Perfil)
  @JoinColumn()
  perfil: Perfil
  @Column({length: 100})
  nickname: string
  @Column({length: 255})
  biografia: string
  @Column()
  jogo: Jogo
  @Column()
  funcao: Funcao
}

@Entity('tbl_organizador')
export class Organizador{
  @PrimaryGeneratedColumn()
  id: number
  @OneToOne(() => Perfil)
  @JoinColumn()
  perfil: Perfil
  @Column({length: 100})
  nome_organizacao: string
  @Column({type: 'text'})
  biografia: string
}