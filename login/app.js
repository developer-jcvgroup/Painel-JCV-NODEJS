const express = require("express");
const router = express.Router();
const loginFunctions = require("./controllers/login");//Funções do login

const database = require("./database/database");

//Pagina inicial
router.get("/", async (req,res)=>{

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
        .where({jcv_userPassword: null, jcv_userPassword: ''})
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

        res.render("login/index", {
            frasesIndex: allAuthor[0], 
            authorIndex: allAuthor[1], 
            linkspecial: linkspecial,
            allAccountPass: allAccountPass
        })
    }
})

/**********************/
router.post("/logar", loginFunctions.commandLogar)
router.post("/action/reset/pass", loginFunctions.resetPassWord)

module.exports = router;