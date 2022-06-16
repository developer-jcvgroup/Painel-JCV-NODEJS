const database = require("../../database/database");
const moment = require("moment");
const { toString } = require("qrcode");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.updatesMain = async (req,res) => {

    const allUpdates = await database
    .select()
    .where({sys_update_enabled: 1})
    .table("sys_update")
    .orderBy("sys_update_idUp","DESC")
    .limit(20)
    .then( data => {return data})

    const allUpdatesDisabled = await database
    .select()
    .where({sys_update_enabled: 0})
    .table("sys_update")
    .orderBy("sys_update_idUp","DESC")
    .then( data => {return data})

    var page = "system/updatesMain";
    res.render("panel/index", {
        page: page,
        allUpdates: allUpdates,
        allUpdatesDisabled: allUpdatesDisabled
    })
}

exports.updatesNew = async (req,res) => {
    const allUpdates = await database
    .select()
    .table("sys_update")
    .orderBy("sys_update_idUp","DESC")
    .limit(1)
    .then( data => {return data})

    var page = "system/updatesNew";
    res.render("panel/index", {page: page, allUpdates: allUpdates})
}

exports.updatesNewSave = async (req,res) => {
    const updateTitle = req.body['update-name']
    const updateVersion = req.body['update-version']
    const updateApp = req.body['update-app']
    const updateEnabled = req.body['update-enabled'];
    const updateText = req.body['textarea-update-get'];
    const updateUrl = req.body['update-url'] == '' ? null : req.body['update-url']


    if(updateTitle != '' && updateVersion != '' && updateApp != '' && updateEnabled != '' && updateText != ''){
        database
        .insert({
            sys_update_moduleUp: updateApp,
            sys_update_versionUpdate: updateVersion,
            sys_update_nameUpdate: updateTitle,
            sys_update_textUpdate: updateText,
            sys_update_urlRedirect: updateUrl,
            sys_update_enabled: updateEnabled,
            sys_update_usersOkUpdate: '[]',
            sys_update_date: generateDate()
        })
        .table("sys_update")
        .then( data => {
            if(data != ''){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update <b>"+updateTitle+"</b> criado com sucesso.");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Update <b>${updateTitle}</b> criado com sucesso","timeMsg": 3000}`);
                res.redirect("/painel/updates/main");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao criar o update <b>"+updateTitle+"</b>");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao criar o update <b>${updateTitle}</b>","timeMsg": 3000}`);
                res.redirect("/painel/updates/new");
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Existem dados essenciais para serem inseridos");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Existem dados essenciais para serem inseridos","timeMsg": 3000}`);
        res.redirect("/painel/updates/new");
    }
    
}

exports.updatesDisabled = async (req,res) => {
    const idUpdate = req.body['button-disabled-update'];
    
    database
    .update({sys_update_enabled: 0})
    .where({sys_update_idUp: idUpdate})
    .table("sys_update")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update desabilitado com sucesso.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Update desabilitado com sucesso","timeMsg": 3000}`);
            res.redirect("/painel/updates/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao desabilitar o update");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao desabilitar o update","timeMsg": 3000}`);
            res.redirect("/painel/updates/new");
        }
    })
}

exports.updatesDelete = async (req,res) => {
    const idUpdate = req.body['button-delete-update'];
    
    database
    .delete()
    .where({sys_update_idUp: idUpdate})
    .table("sys_update")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update desabilitado com sucesso.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Update desabilitado com sucesso.","timeMsg": 3000}`);
            res.redirect("/painel/updates/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao desabilitar o update");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao desabilitar o update.","timeMsg": 3000}`);
            res.redirect("/painel/updates/new");
        }
    })
}

exports.updatesEnabled = async (req,res) => {
    const idUpdate = req.body['button-enabled-update'];
    
    database
    .update({sys_update_enabled: 1})
    .where({sys_update_idUp: idUpdate})
    .table("sys_update")
    .then( data => {
        if(data != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update desabilitado com sucesso.");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Update desabilitado com sucesso.","timeMsg": 3000}`);
            res.redirect("/painel/updates/main");
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao desabilitar o update");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao desabilitar o update.","timeMsg": 3000}`);
            res.redirect("/painel/updates/new");
        }
    })
}

exports.updateEdit = async (req,res) => {
    const idUpdate = req.params.id;

    const allUpdates = await database
    .select()
    .table("sys_update")
    .orderBy("sys_update_idUp","DESC")
    .limit(1)
    .then( data => {return data})

    database
    .select()
    .where({sys_update_idUp: idUpdate})
    .table("sys_update")
    .then( data => {
        if(data != ''){

            database
            .select("jcv_id","jcv_userNamePrimary","jcv_userImageIcon")
            .table("jcv_users")
            .whereIn("jcv_id", JSON.parse(data[0].sys_update_usersOkUpdate))
            .orderBy("jcv_id","ASC")
            .then( dataUsersInfo => {

                var page = "system/updatesEdit";
                res.render("panel/index", {
                    page: page,
                    infoUpdate: data,
                    allUpdates: allUpdates,
                    dataUsersInfo: dataUsersInfo
                })  
            })
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Nenhum update encontrado");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Nenhum update encontrado.","timeMsg": 3000}`);
            res.redirect("/painel/updates/main");
        }
    })
}

exports.updateEditSave = async (req,res) => {
    const idUpdate = req.body['update-id'];

    const updateTitle = req.body['update-name']
    const updateVersion = req.body['update-version']
    const updateApp = req.body['update-app']
    const updateEnabled = req.body['update-enabled'];
    const updateText = req.body['textarea-update-get'];
    const updateUrl = req.body['update-url'] == '' ? null : req.body['update-url']


    if(updateTitle != '' && updateVersion != '' && updateApp != '' && updateEnabled != '' && updateText != ''){
        database
        .update({
            sys_update_moduleUp: updateApp,
            sys_update_versionUpdate: updateVersion,
            sys_update_nameUpdate: updateTitle,
            sys_update_textUpdate: updateText,
            sys_update_urlRedirect: updateUrl,
            sys_update_enabled: updateEnabled,
            sys_update_date: generateDate()
        })
        .where({sys_update_idUp: idUpdate})
        .table("sys_update")
        .then( data => {
            if(data != ''){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| Update <b>"+updateTitle+"</b> editado com sucesso.");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Update <b>${updateTitle}</b> editado com sucesso.","timeMsg": 3000}`);
                res.redirect("/painel/updates/edit/"+idUpdate);
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno ao editar o update <b>"+updateTitle+"</b>");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Erro interno ao editar o update <b>${updateTitle}</b>.","timeMsg": 3000}`);
                res.redirect("/painel/updates/edit/"+idUpdate);
            }
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Existem dados essenciais para serem inseridos");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Existem dados essenciais para serem inseridos.","timeMsg": 3000}`);
        res.redirect("/painel/updates/new");
    }
    
}