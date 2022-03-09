const database = require("../../database/database");

exports.systemLogs = async (req,res) => {
    var page = "system/logs";
    res.render("panel/index", {page: page})
}

exports.closeUpdateSingle = async (req,res) => {
    const idUpdate = parseInt(req.body['button-update-single']);
    const moduleApp = req.body['param-url-update-'+idUpdate]
    const concactNormal = ','+GLOBAL_DASH[0];
    
    //Informando que esta atualização ja foi vista pelo usuario
    database
    .raw("UPDATE sys_update SET sys_update_usersOkUpdate = CONCAT(COALESCE(sys_update_usersOkUpdate,''), '"+concactNormal+"') WHERE sys_update_idUp = "+idUpdate+"")
    .then( data => {
        if(data != ''){
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update lido com sucesso.");
            res.redirect('/painel'+moduleApp);
        }else{
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro");
            res.redirect('/painel'+moduleApp);
        }
    })
}

exports.closeUpdateAll = async (req,res) => {

    const moduleApp = typeof(req.body['param-url-update']) == 'object' ? req.body['param-url-update'][0] : req.body['param-url-update']
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

exports.listNotificationsUser = async (req,res) => {

    const allNot = await database
    .raw("SELECT * from jcv_notifications WHERE JSON_CONTAINS(jcv_notifications_usersId, '"+GLOBAL_DASH[0]+"', '$') ORDER BY jcv_notifications_id DESC LIMIT 50")
    .then( data => {return data[0]})

    var page = "system/notifications";
    res.render("panel/index", {page: page, allNot: allNot})
}