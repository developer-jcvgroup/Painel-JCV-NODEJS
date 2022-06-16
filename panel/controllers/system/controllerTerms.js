const database = require("../../database/database");

const moment = require("moment");
const router = require("../../app");
const { text } = require("express");
moment.tz.setDefault('America/Sao_Paulo');

//Data atual
function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.moduleTerms = async (req,res) => {

    const getInfo = await database
    .select("jcv_sys_term.*","jcv_userNamePrimary")
    .orderBy("jcv_sys_term_id","DESC")
    .table("jcv_sys_term")
    .join("jcv_users","jcv_users.jcv_id","jcv_sys_term.jcv_sys_term_userId_update")
    .limit(1)
    .then( data => {
        return data
    })
    
    var page = "system/terms";
    res.render("panel/index", {page: page, getInfo: getInfo})
}

exports.termsSave = async (req,res) => {
    
    const textInsert = req.body['textarea-update-get'];

    database
    .insert({
        jcv_sys_term_termText: textInsert,
        jcv_sys_term_userId_update: GLOBAL_DASH[0],
        jcv_sys_term_term_lastUpdate: generateDate()
    })
    .table("jcv_sys_term")
    .then( data => {
        if( data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Atualização computada com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Atualização computada com sucesso!.","timeMsg": 3000}`);
            res.redirect("/painel/terms");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Erro ao computar atualização");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao computar atualização.","timeMsg": 3000}`);
            res.redirect("/painel/terms");
        }
    })
}