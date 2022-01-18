const database = require("../../database/database");

exports.systemLogs = async (req,res) => {
    var page = "system/logs";
    res.render("panel/index", {page: page})
}

exports.closeUpdateSingle = async (req,res) => {
    const idUpdate = parseInt(req.body['button-update-single']);
    const concactNormal = ','+GLOBAL_DASH[0];
    
    //Informando que esta atualização ja foi vista pelo usuario
    database
    .raw("UPDATE sys_update SET sys_update_usersOkUpdate = CONCAT(COALESCE(sys_update_usersOkUpdate,''), '"+concactNormal+"') WHERE sys_update_idUp = "+idUpdate+"")
    .then( data => {
        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update lido com sucesso.");
            res.redirect('/painel');
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro");
            res.redirect('/painel');
        }
    })
}

exports.closeUpdateAll = async (req,res) => {

    const idsAll = req.body['button-update-all'];
    
    //Informando que TODAS atualização ja foi vista pelo usuario
    database
    .raw("UPDATE sys_update SET sys_update_usersOkUpdate = CONCAT(COALESCE(sys_update_usersOkUpdate,''), ',"+GLOBAL_DASH[0]+"') WHERE sys_update_idUp IN ("+idsAll+") ")
    .then( data => {
        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update lido com sucesso.");
            res.redirect('/painel');
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro");
            res.redirect('/painel');
        }
    })
}