const express = require("express");
const router = express.Router();
const loginFunctions = require("./controllers/login");//Funções do login

const database = require("./database/database");

//Pagina inicial
router.get("/", async (req,res)=>{

    try {
        if(req.session.cookieLogin == undefined){
            //Cookie inexistente

            if(enabledPanel == 1){
                res.redirect('/maintenance')
            }else{
        
                const linkspecial = req.query['linkspecial']
                const allAuthor = await database.select("sys_phrase_string","sys_phrase_author").where({sys_phrase_enalbed: 1}).orderBy("sys_phrase_order", "ASC").table("jcv_sys_phrase").then( data => {
                    
                    let arrFrase = '';
                    let arrAutor = '';
        
                    data.forEach(element => {
                        arrFrase += element.sys_phrase_string+'//';
                        arrAutor += element.sys_phrase_author+'//';
                    });
        
                    let arr = [arrFrase,arrAutor]
                    return arr;
                })
        
                //Pegando todas as contas que não possui uma senha
                const allAccountPass = await database
                .select("jcv_userCpf")
                .whereRaw("jcv_userPassword IS NULL OR jcv_userPassword = ''")
                .table("jcv_users")
                .then( data => {
        
                    let newArr = []
                    if(data != ''){
                        data.forEach(element => {
                            newArr.push(element.jcv_userCpf)
                        });
                    }else{
                        newArr.push('')
                    }
                    return newArr;
        
                })
        
                let PAINEL_URL_LOGIN;
                if(req.get('host') == 'localhost:8080'){
                    PAINEL_URL_LOGIN = 1;
                }else{
                    PAINEL_URL_LOGIN = 0;
                }
        
                res.render("login/index", {
                    frasesIndex: allAuthor[0], 
                    authorIndex: allAuthor[1], 
                    linkspecial: linkspecial,
                    allAccountPass: allAccountPass,
                    PAINEL_URL_LOGIN: PAINEL_URL_LOGIN
                })
            }
        }else{
            //Cookie existente então redireciona para o painel
            res.redirect('/painel')
        }
    } catch (error) {
        //Error
        console.log('error: '+error)
        res.redirect('/')
    }
})

/**********************/
router.post("/logar", loginFunctions.commandLogar)
router.post("/action/reset/pass", loginFunctions.resetPassWord)

module.exports = router;