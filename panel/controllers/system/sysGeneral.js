const database = require("../../database/database");

exports.systemLogs = async (req,res) => {
    var page = "system/logs";
    res.render("panel/index", {page: page})
}

exports.closeUpdateSingle = async (req,res) => {
    const idUpdate = parseInt(req.body['button-update-single']);
    const moduleApp = req.body['param-url-update-'+idUpdate]

    //Pegando a lista de oks deste update
    const arrayOkay = await database
    .select("sys_update_usersOkUpdate")
    .where({sys_update_idUp: idUpdate})
    .table("sys_update")
    .then( data => {return data[0]})

    let arrayUserUpdate = JSON.parse(arrayOkay.sys_update_usersOkUpdate);
    arrayUserUpdate.push(GLOBAL_DASH[0])

    database
    .update({
        sys_update_usersOkUpdate: JSON.stringify(arrayUserUpdate) 
    })
    .where({sys_update_idUp: idUpdate})
    .table("sys_update")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update lido com sucesso.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Update lido com sucesso","timeMsg": 3000}`);
            if(moduleApp != ''){
                res.redirect(moduleApp);
            }else{
                res.redirect(URL_GET_PARAMS)
            }
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Erro");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Erro","timeMsg": 3000}`);
            if(moduleApp != ''){
                res.redirect(moduleApp);
            }else{
                res.redirect(URL_GET_PARAMS)
            }
        }
    })
}

exports.listNotificationsUser = async (req,res) => {

    const allNot = await database
    .raw("SELECT * from jcv_notifications WHERE JSON_CONTAINS(jcv_notifications_usersId, '"+GLOBAL_DASH[0]+"', '$') ORDER BY jcv_notifications_id DESC LIMIT 50")
    .then( data => {return data[0]})

    //Ja atualizando e dizendo que o usuario já leu

    allNot.forEach(element => {
        let validando = JSON.parse(element.jcv_notifications_users_view).indexOf(GLOBAL_DASH[0]);
        
        //console.log(convertion)
        if(validando == -1){

            let convert = []
            if(JSON.parse(element.jcv_notifications_users_view).length == 0){
                convert = [GLOBAL_DASH[0]]
            }else{
                let arr = JSON.parse(element.jcv_notifications_users_view)
                arr.push(GLOBAL_DASH[0])
                convert = arr
            }

            //Atualizar
            database
            .update({
                jcv_notifications_users_view: JSON.stringify(convert)
            })
            .where({jcv_notifications_id: element.jcv_notifications_id, jcv_notifications_enabled: 1})
            .table("jcv_notifications")
            .then( data => {
                //console.log('aaaaa')
            }) 
        }



    });

    var page = "system/notifications";
    res.render("panel/index", {page: page, allNot: allNot})
}