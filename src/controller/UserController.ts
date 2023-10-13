import { Request, response, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../helpers/api-erros";
import { jogadorRepository, organizadorRepository, userRepository } from '../repositories/UserRepository';
import bcrypt from 'bcrypt'
import  jwt  from "jsonwebtoken";
import nodemailer from 'nodemailer';
import crypto     from 'crypto';
import { resolve } from "path";
import { Perfil } from '../entities/User';
import { Blob } from "buffer";
import { DataSource } from 'typeorm';
import { Genero } from '../entities/enum/Genero';
import { Jogo } from '../entities/enum/Jogo';
import { time } from "console";




export class UserController {

//CADASTRO
async create(req: Request, res: Response){
  
    const {
      nome_usuario,
      nome_completo,
      email,
      senha,
      data_nascimento,
      genero,
      nickname,
      biografia
    } = req.body

    if(
      nome_usuario    == undefined || nome_usuario    == "" ||
      email           == undefined || email           == "" ||
      senha           == undefined || senha           == "" ||
      data_nascimento == undefined || data_nascimento == "" ||
      genero          == undefined || 
      nickname        == undefined || nickname        == "" 
      ) throw new BadRequestError('JSON invalido, Faltam Informacoes!')
    
    const userEmailExists = await userRepository.findOneBy({email})
    const usernameExists = await userRepository.findOneBy({nome_usuario})
    const nicknameExists = await userRepository.findOneBy({nickname})
    
    if(userEmailExists){
      throw new BadRequestError('Email já cadastrado!')
    }
    if(usernameExists){
      throw new BadRequestError('Nome de usuario já cadastrado!')
    }
    if(nicknameExists){
      throw new BadRequestError('Nickname já cadastrado!')
    }

    const hashSenha = await bcrypt.hash(senha, 10)

  
    const newUser = userRepository.create({
      nome_usuario,
      nome_completo,
      email,
      senha: hashSenha,
      data_nascimento,
      genero,
      nickname,
      biografia
    })

    await userRepository.save(newUser)

    const {senha: _, ...user} = newUser

    return res.status(201).json(user)
}

//LOGIN
async login(req: Request, res: Response){

    const {
      login,
      senha
    } = req.body


    const user = await userRepository.findOneBy([{ email : login },{ nome_usuario : login }])
    if(!user){
      throw new BadRequestError('Login ou senha invalidos')
    }

    const verifyPass = await bcrypt.compare(senha, user.senha)

    if(!verifyPass){
      throw new BadRequestError('Login ou senha invalidos')
    }

     const token = jwt.sign({ id: user.id}, process.env.JWT_PASS ?? '', {expiresIn: "1d", })

     const {senha:_, ...userLogin} = user

    return res.json({
      user: userLogin,
      token: token
    })
}

//PERFIL
async getProfile(req: Request, res: Response) {
    const user = req.user

    const playerProfile = await jogadorRepository.find({ relations: { perfil_id : true  }, where: { perfil_id: { id : user.id } } , select: { perfil_id: { id: false } }} )
    const orgProfile = await organizadorRepository.find({ relations: { dono_id : true }, where: { dono_id: { id : user.id } } ,select: { biografia: true, nome_organizacao:true, times: true,  dono_id: {id: false} } })


    const response = { user: user, playerProfile: playerProfile[0]? playerProfile[0] : false , orgProfile:  orgProfile[0]? orgProfile[0]: false }
    
    return res.json(response)

}

// PUXAR PELO ID 
async getProfileById(req: Request, res: Response) {

    const id = req.params.id

    const user = await userRepository.findOneBy({id: parseInt(id)})

    if(user == null){
      throw new BadRequestError('Usuario não existe!')
    }

    const {
      senha,
      ...userReturn
     } = user
    
     const playerProfile = await jogadorRepository.find({ relations: { perfil_id : true  }, where: { perfil_id: { id : user.id } } , select: { perfil_id: { id: false } }} )
     const orgProfile = await organizadorRepository.find({ relations: { dono_id : true }, where: { dono_id: { id : user.id } } ,select: { biografia: true, nome_organizacao:true, times: true, dono_id: {id: false}} })
  
    const response = { user: userReturn, playerProfile: playerProfile[0] ? playerProfile[0] : false, orgProfile: orgProfile[0] ? orgProfile[0] : false }

    return res.json(response)

}

// ATUALIZAR PERFIL
async updateProfile(req: Request, res: Response){

    const user = req.user
    const {
      id,
      nome_usuario,
      nome_completo,
      email,
      senha,
      data_nascimento,
      genero,
      nickname,
      biografia
    } = req.body

    

    let response = {
      id,
      nome_usuario,
      nome_completo,
      email,
      senha,
      data_nascimento,
      genero,
      nickname,
      biografia
    }

    if(nome_usuario){
      if(await userRepository.findOneBy({nome_usuario: nome_usuario})){
        response.nome_usuario = 'Usuario já existe!'
      }else{
        response.nome_usuario = await userRepository.update( { id: user.id }, { nome_usuario: nome_usuario})
      }
    
    }
    if(email){
      if(await userRepository.findOneBy({email: email})){
        response.email = 'Email de usuario já cadastrado!'
      }else{
        response.email = Boolean((await userRepository.update( { id: user.id }, { email: email})).affected)
      }

    }
    if(senha){
      const hashSenha = await bcrypt.hash(senha, 10)

      response.senha = Boolean((await userRepository.update( { id: user.id }, { senha: hashSenha})).affected)
      
    }
    if(data_nascimento){
      response.data_nascimento = Boolean((await userRepository.update( { id: user.id }, { data_nascimento: data_nascimento})).affected)
  
    }
    if(genero){
        response.genero = Boolean((await userRepository.update( { id: user.id }, { genero: genero})).affected)  
    }

    if(nickname){
      if(await userRepository.findOneBy({nickname: nickname})){
        response.nickname = 'Nickname de usuario já ultilizado!'
      }else{
        response.nickname = Boolean(await userRepository.update( { id: user.id }, { nickname: nickname}))
      }
    
    }

    if(biografia){
      if(await userRepository.findOneBy({biografia: biografia})){

      }else{
        response.biografia = Boolean ((await userRepository.update( { id: user.id }, { biografia: biografia})).affected)
      }
    
    }


    return res.json({
      response: response
    })


}

//VALIDACAO PARA O MOBILE
async validationMobile(req: Request, res: Response){
 
    const {
      nome_usuario,
      nome_completo,
      email,
      senha,
      data_nascimento,
      genero,
      nickname,
      biografia
    } = req.body

    if(
      nome_usuario    == undefined || nome_usuario    == "" ||
      email           == undefined || email           == "" ||
      senha           == undefined || senha           == "" ||
      data_nascimento == undefined || data_nascimento == "" ||
      genero          == undefined || 
      nickname        == undefined || nickname        == "" 
      ) throw new BadRequestError('JSON invalido, Faltam Informacoes!')
    
    const userEmailExists = await userRepository.findOneBy({email})
    const usernameExists = await userRepository.findOneBy({nome_usuario})
    
    if(userEmailExists){
      throw new BadRequestError('Email já cadastrado!')
    }
    if(usernameExists){
      throw new BadRequestError('Nome de usuario já cadastrado!')
    }

}

//POST JOGADOR 
async createPlayer(req: Request, res: Response){

  const id = req.user


  const {
    nickname,
    jogo,
    funcao,
    elo,
  } = req.body

  // console.log(jogo);
  // console.log(funcao);
  // console.log(elo);

  if(
    nickname  == undefined || nickname  == "" ||
    jogo      == undefined || jogo      == "" ||
    funcao    == undefined || funcao    == "" ||
    elo       == undefined || elo       == "" 
  ) throw new BadRequestError('JSON invalido, Faltam Informacoes!')


  const jogadorExists = await jogadorRepository.findOneBy({perfil_id: id})


  if(jogadorExists) throw new BadRequestError('Perfil Jogador já cadastrado!')

  const newJogador = jogadorRepository.create({
    nickname,
    jogo,
    funcao,
    elo,
    perfil_id: id,
  })

  await jogadorRepository.save(newJogador)

  //const {senha: _, ...user} = newUser

  return res.status(201).json(newJogador)



}

//UPDATE JOGADOR
async updatePlayer(req: Request, res: Response){

  const user = req.user

  const playerProfile = await jogadorRepository.find({ relations: { perfil_id : true  }, where: { perfil_id: { id : user.id } } , select: { perfil_id: { id: false } }} )

  const {
    nickname,
    jogo,
    funcao,
    elo,
  } = req.body

  let response = {
    nickname,
    jogo,
    funcao,
    elo
  }

if(nickname){
    response.nickname = Boolean((await jogadorRepository.update( { id: playerProfile[0].id}, { nickname: nickname})).affected)  
}

if(jogo){
    response.jogo = Boolean((await jogadorRepository.update( { id: playerProfile[0].id }, { jogo: jogo})).affected)  
}

if(funcao){
  response.jogo = Boolean((await jogadorRepository.update( { id: playerProfile[0].id }, { funcao: funcao})).affected)  
}

if(elo){
  response.jogo = Boolean((await jogadorRepository.update( { id: playerProfile[0].id }, { elo: elo})).affected)  
}

return res.json({
  response: response
})

  
}

// POST ORGANIZADOR
async createorganizer(req: Request, res: Response){

    const id = req.user
  
  
    const {
      times,
      nome_organizacao,
      biografia,
    } = req.body
  
  
    if(
      times              == undefined || times              == "" ||
      nome_organizacao   == undefined || nome_organizacao   == "" ||
      biografia          == undefined || biografia          == "" 
    ) throw new BadRequestError('JSON invalido, Faltam Informacoes!')
  
  
    const organizadorExists = await organizadorRepository.findOneBy({dono_id: id})
  
  
    if(organizadorExists) throw new BadRequestError('Perfil Organizador já cadastrado!')
  
    const newOrganizador = organizadorRepository.create({
      times,
      nome_organizacao,
      biografia,
      dono_id: id,
    })
  
    await organizadorRepository.save(newOrganizador)
  

  
    return res.status(201).json(newOrganizador)
  
  
  
  }
  

//UPDATE ORGAANIZADOR
async updateOrganizer(req: Request, res: Response){
 
    const user = req.user
  
    const orgProfile = await organizadorRepository.find({ relations: { dono_id : true  }, where: { dono_id: { id : user.id } } , select: { dono_id: { id: false } }} )
  
    const {
      times,
      nome_organizacao,
      biografia,
    } = req.body
  

    let response = {
      times,
      nome_organizacao,
      biografia,
    }

    

  if(times){
      response.times = Boolean((await organizadorRepository.update( { id: orgProfile[0].id}, { times: times})).affected)  
  }
  
  if(nome_organizacao){
      response.nome_organizacao = Boolean((await organizadorRepository.update( { id: orgProfile[0].id }, { nome_organizacao: nome_organizacao})).affected)  
  }
  
  if(biografia){
    response.biografia = Boolean((await organizadorRepository.update( { id: orgProfile[0].id }, { biografia: biografia})).affected)  
  }

  
  return res.json({
    response: response
  })
  
    
  }  
  






}
