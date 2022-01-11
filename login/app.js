const express = require("express");
const router = express.Router();
const loginFunctions = require("./controllers/login");//Funções do login

const database = require("./database/database");

//Pagina inicial
router.get("/", async (req,res)=>{

    const linkspecial = req.query['linkspecial']



    //input-link-special

    const allAuthor = await database.select("sys_phrase_string","sys_phrase_author").where({sys_phrase_enalbed: 1}).table("jcv_sys_phrase").then( data => {
        
        let arrFrase = '';
        let arrAutor = '';

        data.forEach(element => {
            arrFrase += element.sys_phrase_string+'//';
            arrAutor += element.sys_phrase_author+'//';
        });

        let arr = [arrFrase,arrAutor]
        return arr;
    })

    res.render("login/index", {frasesIndex: allAuthor[0], authorIndex: allAuthor[1], linkspecial: linkspecial})
})

/**********************/
router.post("/logar", loginFunctions.commandLogar)
router.post("/action/reset/pass", loginFunctions.resetPassWord)

module.exports = router;