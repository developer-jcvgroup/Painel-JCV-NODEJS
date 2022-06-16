const database = require("../../database/database");

//Sistema de emails
const emailSystemExe = require('../system/emailSystem');

exports.saveNewReport = async (req,res) => {
    const dataReport = req.body['sys-report-text'];
    //console.log(req.body['sys-report-text'])

    if(dataReport == ''){
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Você precisa inserir algo para reportar");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Você precisa inserir algo para reportar.","timeMsg": 3000}`);
        res.redirect("/painel");
    }else{
        //Pegando quem é master
        const allMasters = await database
        .select()
        .where({sys_reports_perm_admin: 1})
        .table("jcv_users_permissions")
        .join("jcv_users","jcv_users.jcv_id", "jcv_users_permissions.sys_perm_idUser")
        .then( data => {
            let array = [];
            data.forEach(element => {
                array.push(element.jcv_userEmailCorporate)
            });
            return array;
        })

        const textOne = 'Report do usuario <b>'+GLOBAL_DASH[1]+'</b>. '+GLOBAL_DASH[5];
        const textTwo = `Olá, o usuario <b>${GLOBAL_DASH[1]}</b> reportou: <br><br> <b>${dataReport}</b>`;
        emailSystemExe.sendMailExe(allMasters, 'Report System', 'Report System', 'Sistema', 'Masters', textOne, textTwo);

        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Report enviado para o administrador");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Report enviado para o administrador.","timeMsg": 3000}`);
        res.redirect("/painel");
    }
}