const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.encurtadorMain = async (req,res) => {

    //Encurtadores ativos
    const getAllShorts = await database
    .select()
    .where({jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0], jcv_sys_shortener_link_active: 1})
    .table("jcv_sys_shortener")
    .orderBy("jcv_sys_shortener_id", "DESC")
    .then( data => {
        return data
    })

    //Encurtadores inativos
    const getAllShortsInative = await database
    .select()
    .where({jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0], jcv_sys_shortener_link_active: 0})
    .table("jcv_sys_shortener")
    .orderBy("jcv_sys_shortener_id", "DESC")
    .limit(30)
    .then( data => {
        return data
    })

    var page = "encurtador/encurtadorMain";
    res.render("panel/index", {page: page, getAllShorts: getAllShorts, getAllShortsInative: getAllShortsInative})
}

exports.encurtadorEdit = async (req,res) => {

    const idEncurtador = req.params.id;

    //Validando se o link existe e se é deste usuario
    const validateGet = await database
    .select()
    .where({jcv_sys_shortener_id: idEncurtador, jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0]})
    .table("jcv_sys_shortener")
    .then( data => {
        return data;
    })

    if(validateGet != ''){
        var page = "encurtador/encurtadorEdit";
        res.render("panel/index", {page: page, validateGet: validateGet})
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Link encurtado inexistente");
            res.redirect("/painel/encurtador/main");
    }
    
}

exports.encurtadorNew = async (req,res) => {
    var page = "encurtador/encurtadorNew";
    res.render("panel/index", {page: page})
}

exports.encurtadorNewSave = async (req,res) => {
    const linkTitle = req.body['encurtador-url-title'];
    const linkOriginal = req.body['encurtador-url-original'];
    const linkShort = req.body['encurtador-url-short'];
    const linkactive = req.body['encurtador-url-active']

    if(linkTitle == '' || linkOriginal == '' || linkShort == ''){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Alguns parametros faltantes!");
        res.redirect("/painel/encurtador/new");
    }else{
        //Validando se não existe uma url com este link
        database
        .select("jcv_sys_shortener.*","jcv_users.jcv_id","jcv_users.jcv_userNamePrimary")
        .where({jcv_sys_shortener_link_short: linkShort})
        .join("jcv_users","jcv_users.jcv_id","jcv_sys_shortener.jcv_sys_shortener_link_createdUser")
        .table("jcv_sys_shortener")
        .then( data => {
            if(data != ''){
                //Link igual
                res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| O link encurtado <b>"+linkShort+"</b> já existe! (criado por: <b>"+data[0].jcv_userNamePrimary+"</b>)");
                res.redirect("/painel/encurtador/new");
            }else{
                //Link disponivel
                database
                .insert({
                    jcv_sys_shortener_link_title: linkTitle,
                    jcv_sys_shortener_link_created_date: generateDate(),
                    jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0],
                    jcv_sys_shortener_link_original: linkOriginal,
                    jcv_sys_shortener_link_short: linkShort,
                    jcv_sys_shortener_link_active: linkactive,
                    jcv_sys_shortener_link_clicks: 0
                })
                .table("jcv_sys_shortener")
                .then(data => {
                    if(data != ''){
                        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Encurtador <b>"+linkTitle+"</b> criado com sucesso!");
                        res.redirect("/painel/encurtador/main");
                    }else{
                        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao criar o encurtador <b>"+linkTitle+"</b>");
                        res.redirect("/painel/encurtador/new");
                    }
                })
            }
        })

    }
}

exports.encurtadorEditSave = async (req,res) => {
    const idUrl = req.body['encurtador-edit-url-id']

    const linkTitle = req.body['encurtador-edit-url-title'];
    const linkOriginal = req.body['encurtador-edit-url-original'];
    const linkShort = req.body['encurtador-edit-url-short'];
    const linkactive = req.body['encurtador-edit-url-active']

    if(linkTitle == '' || linkOriginal == '' || linkShort == ''){
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Alguns parametros faltantes!");
        res.redirect("/painel/encurtador/new");
    }else{
        //Validando se não existe uma url com este link
        database
        .select()
        .where({jcv_sys_shortener_link_short: linkShort})
        .table("jcv_sys_shortener")
        .then( data => {

            if(data != ''){
                if(data[0].jcv_sys_shortener_link_active == 1 && data[0].jcv_sys_shortener_id == linkShort){
                    //Link igual
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| O link encurtado <b>"+linkShort+"</b> já existe!");
                    res.redirect("/painel/encurtador/edit/"+idUrl);
                }else{
                    //Link disponivel
                    database
                    .update({
                        jcv_sys_shortener_link_title: linkTitle,
                        jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0],
                        jcv_sys_shortener_link_original: linkOriginal,
                        jcv_sys_shortener_link_short: linkShort,
                        jcv_sys_shortener_link_active: linkactive
                    })
                    .where({jcv_sys_shortener_id: idUrl})
                    .table("jcv_sys_shortener")
                    .then(data => {
                        if(data == 1){
                            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Encurtador <b>"+linkTitle+"</b> editado com sucesso!");
                            res.redirect("/painel/encurtador/main");
                        }else{
                            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao editar o encurtador <b>"+linkTitle+"</b>");
                            res.redirect("/painel/encurtador/new");
                        }
                    })
                }
            }else{
                //Link disponivel
                database
                .update({
                    jcv_sys_shortener_link_title: linkTitle,
                    jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0],
                    jcv_sys_shortener_link_original: linkOriginal,
                    jcv_sys_shortener_link_short: linkShort,
                    jcv_sys_shortener_link_active: linkactive
                })
                .where({jcv_sys_shortener_id: idUrl})
                .table("jcv_sys_shortener")
                .then(data => {
                    if(data == 1){
                        res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Encurtador <b>"+linkTitle+"</b> editado com sucesso!");
                        res.redirect("/painel/encurtador/main");
                    }else{
                        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao editar o encurtador <b>"+linkTitle+"</b>");
                        res.redirect("/painel/encurtador/new");
                    }
                })
            }

            
        })

    }

}

exports.encurtadorDelete = async (req,res) => {
    const idEncurtador = req.body['button-delete-encurtador']

    database
    .delete()
    .where({jcv_sys_shortener_id: idEncurtador, jcv_sys_shortener_link_createdUser: GLOBAL_DASH[0]})
    .table("jcv_sys_shortener")
    .then(data => {
        if(data == 1){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Encurtador deletado com sucesso!");
            res.redirect("/painel/encurtador/main");
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro interno ao deltar o encurtador");
            res.redirect("/painel/encurtador/main");
        }
    })
}