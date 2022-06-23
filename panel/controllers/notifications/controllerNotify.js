const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.mainNotifications = async (req,res) =>{

    //Pegando todas as 50 primeiras notificações HABILITADAS
    const allNotify = await database
    .select()
    .where({jcv_notifications_sys_create: 0})
    .table("jcv_notifications")
    .orderBy("jcv_notifications_id","DESC")
    .limit(50)
    .then( data => {return data})

    //Pegando todas as 50 primeiras notificações DESABILITADAS
    const allNotifyDesabled = await database
    .select()
    .where({jcv_notifications_sys_create: 0, jcv_notifications_enabled: 0})
    .table("jcv_notifications")
    .orderBy("jcv_notifications_id","DESC")
    .limit(50)
    .then( data => {return data})

    var page = "notifications/mainNotify";
    res.render("panel/index", {page: page, allNotify: allNotify, allNotifyDesabled: allNotifyDesabled})
}
exports.newNotifications = async (req,res) => {
    //Lista de todos os usuarios TOTAIS
    const allUsersSystem = await database
    .select("jcv_id","jcv_userNamePrimary","sys_unity_name","sys_department_name","jcv_userCassification")
    .where({jcv_userEnabled: 1})
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .join("jcv_unitys","jcv_unitys.sys_unity_id","jcv_users.jcv_userUnity")
    .join("jcv_departments","jcv_departments.sys_department_id","jcv_users.jcv_userSector")

    var page = "notifications/newNotify";
    res.render("panel/index", {page: page, allUsersSystem: allUsersSystem})
}


exports.editNotifications = async (req,res) => {
    const idNot = req.params.id

    //Pegando informações desta notificação
    const getInfoNotify = await database
    .select()
    .where({jcv_notifications_sys_create: 0, jcv_notifications_id: idNot})
    .table("jcv_notifications")
    .then( data => {return data})

    //Lista de todos os usuarios TOTAIS
    const allUsersSystem = await database
    .select("jcv_id","jcv_userNamePrimary","sys_unity_name","sys_department_name","jcv_userCassification")
    .where({jcv_userEnabled: 1})
    .table("jcv_users")
    .join("jcv_users_permissions","jcv_users_permissions.sys_perm_idUser","jcv_users.jcv_id")
    .join("jcv_unitys","jcv_unitys.sys_unity_id","jcv_users.jcv_userUnity")
    .join("jcv_departments","jcv_departments.sys_department_id","jcv_users.jcv_userSector")

    var page = "notifications/editNotify";
    res.render("panel/index", {page: page, allUsersSystem: allUsersSystem, getInfoNotify: getInfoNotify})
}

exports.saveNotifications = async (req,res) => {
    const notificationsType = req.body['newNotify-type']
    const notificationsTitle = req.body['newNotify-title']
    const notificationsMsg = req.body['textarea-newNotify-get']
    const notificationsLink = req.body['newNotify-link']
    const notificationsEnabled = req.body['newNotify-enabled']

    const usersNotifications = typeof(req.body['array-users-list'].split(',')) == 'object' ? req.body['array-users-list'].split(',').map(convertValues) : [req.body['array-users-list']].map(convertValues)

    function convertValues(value){
        return parseInt(value)
    }

    if(notificationsType != '' && notificationsTitle != '' && notificationsMsg != '' && notificationsEnabled != ''){
        database
        .insert({
            jcv_notifications_type: notificationsType,
            jcv_notifications_usersId: JSON.stringify(usersNotifications),
            jcv_notifications_users_view: '[]',
            jcv_notifications_title: notificationsTitle,
            jcv_notifications_message: notificationsMsg,
            jcv_notifications_link: notificationsLink,
            jcv_notifications_created: generateDate(),
            jcv_notifications_enabled: notificationsEnabled,
            jcv_notifications_sys_create: 0
        })
        .table("jcv_notifications")
        .then( data => {
            if(data != ''){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+notificationsTitle+"</b> criado com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${notificationsTitle}</b> criado com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/notifications/main");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao criar");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao criar","timeMsg": 3000}`);
                res.redirect("/painel/notifications/main");
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você precisa inserir mais informações");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Você precisa inserir mais informações","timeMsg": 3000}`);
        res.redirect("/painel/notifications/new");
    }
}

exports.saveEditNotifications = async (req,res) => {
    const idNotify = req.body['button-save-notify']
    
    const notificationsType = req.body['newNotify-type']
    const notificationsTitle = req.body['newNotify-title']
    const notificationsMsg = req.body['textarea-newNotify-get']
    const notificationsLink = req.body['newNotify-link']
    const notificationsEnabled = req.body['newNotify-enabled']

    const usersNotifications = typeof(req.body['array-users-list'].split(',')) == 'object' ? req.body['array-users-list'].split(',').map(convertValues) : [req.body['array-users-list']].map(convertValues)

    function convertValues(value){
        return parseInt(value)
    }

    if(notificationsType != '' && notificationsTitle != '' && notificationsMsg != '' && notificationsEnabled != ''){
        database
        .update({
            jcv_notifications_type: notificationsType,
            jcv_notifications_usersId: JSON.stringify(usersNotifications),
            jcv_notifications_title: notificationsTitle,
            jcv_notifications_message: notificationsMsg,
            jcv_notifications_link: notificationsLink,
            jcv_notifications_created: generateDate(),
            jcv_notifications_enabled: notificationsEnabled,
            jcv_notifications_sys_create: 0
        })
        .where({jcv_notifications_id: idNotify})
        .table("jcv_notifications")
        .then( data => {
            if(data != ''){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| <b>"+notificationsTitle+"</b> foi editado com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"<b>${notificationsTitle}</b> foi editado com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/notifications/main");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao editar");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao editar","timeMsg": 3000}`);
                res.redirect("/painel/notifications/main");
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Você precisa inserir mais informações");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Você precisa inserir mais informações","timeMsg": 3000}`);
        res.redirect("/painel/notifications/new");
    }
}

exports.deleteNotifications = async (req,res) => {
    const idNot = req.body['button-delete-notify']

    database
    .delete()
    .where({jcv_notifications_id: idNot})
    .table("jcv_notifications")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Notificação deletada com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Notificação deletada com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/notifications/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao excluir");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao excluir","timeMsg": 3000}`);
            res.redirect("/painel/notifications/main");
        }
    })
}

exports.resetViews = async (req,res) =>{
    const idNot = req.body['button-reset-notify']

    database
    .update({
        jcv_notifications_users_view: '[]'
    })
    .where({jcv_notifications_id: idNot})
    .table("jcv_notifications")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Notificação resetada com sucesso!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Notificação resetada com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/notifications/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao excluir");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao excluir","timeMsg": 3000}`);
            res.redirect("/painel/notifications/main");
        }
    })
}