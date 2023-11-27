import { Request, response, Response } from "express";
import { BadRequestError, UnauthorizedError } from "../helpers/api-erros";
import { jogadorRepository, userRepository, postagemRepository, highlightRepository} from '../repositories/UserRepository';
import { log } from "console";
import { TIMEOUT } from "dns";
import { Highlight } from "../entities/User";


export class HighlightController{


//POST
async postHighlight(req: Request, res: Response){

    const id = req.user

    const {

        titulo

    } = req.body

    if(
        titulo  == undefined || titulo == "" 

    ) throw new BadRequestError('JSON invalido, Faltam Informacoes!')

    const newPost = highlightRepository.create({

      titulo,
      dono: id
      
    })
    console.log(newPost);
    
    
    return res.status(201).json(newPost)
  

}


//GET
async getHighlight(req: Request, res: Response){

   
    const id = req.user

    const highlight = await highlightRepository.find({relations: { dono : true  }} )

    
    const response = { highlight: highlight }
    console.log(highlight);
    
    return res.json(response)

}

//PUT
async putHighlight(req: Request, res: Response){

    const id = req.user

    const highlight = await highlightRepository.findOne({ where: { dono: id} })


    if(highlight){

  const {

        titulo

    } = req.body

      
    let response = {
        titulo
      }
    
  
      if(titulo){
        response.titulo = Boolean((await highlightRepository.update( { id: highlight.id }, { titulo: titulo})).affected)
      }


      return res.json({
        response: highlight
      })
    }
  
    
    
  

}

//DELETE
async deleteHighlight(req: Request, res: Response){

    const idPost = req.params.id
  
    if(idPost){
      
      const post = await highlightRepository.delete(idPost)
  
    }else{
      throw new BadRequestError('!!!')
    }
  
  return res.json({
    response: true
  })
 

}




} 