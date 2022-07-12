const database = require("../../database/database");
const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

const monthReference = moment().add(1, 'M').format('MM-YYYY');

//Sistema de emails
const emailSystemExe = require('./emailSystem');

//Scripts dos usuarios
const usersScript = require('./scripts-users');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.listAllinformations = async (req,res) =>{

    //Listando os usuarios
    
    const allUsers = await database.raw(`

    SELECT c1.*, c2.jcv_userNameSecundary, j1.*, j2.*, j3.*
    FROM (jcv_users c1, jcv_users c2)

    JOIN jcv_unitys j1 ON c1.jcv_userUnity = j1.sys_unity_id
    JOIN jcv_users_permissions j2 ON c1.jcv_id = j2.sys_perm_idUser
    JOIN jcv_departments j3 ON c1.jcv_userSector = j3.sys_department_id

    WHERE c1.jcv_userManager = c2.jcv_id AND c1.jcv_userEnabled = 1 ORDER BY c1.jcv_id ASC
    
    `).then( data => {return data[0]})


    const allUsersDisabled = await database.raw(`

    SELECT c1.*, c2.jcv_userNameSecundary, j1.*, j2.*, j3.*
    FROM (jcv_users c1, jcv_users c2)

    JOIN jcv_unitys j1 ON c1.jcv_userUnity = j1.sys_unity_id
    JOIN jcv_users_permissions j2 ON c1.jcv_id = j2.sys_perm_idUser
    JOIN jcv_departments j3 ON c1.jcv_userSector = j3.sys_department_id

    WHERE c1.jcv_userManager = c2.jcv_id AND c1.jcv_userEnabled = 0 ORDER BY c1.jcv_id ASC
    
    `).then( data => {return data[0]})

    //Listando todos os gestores e representantes
    const allManager = await database.select().whereIn('jcv_userCassification', [1,2,4]).table("jcv_users").then( data => {
        return data;
    })

    //Listando todas as unidades
    const allUnitys = await database.select().where({sys_unity_enabled: 1}).table("jcv_unitys").then( data => {
        return data;
    })

    //Listando todos os departamentos
    const allDepto = await database.select().where({sys_department_enabled: 1}).table("jcv_departments").then( data => {
        return data;
    })
    
    var page = "system/users";
    res.render("panel/index", {page: page, allUsers: allUsers, allUsersDisabled: allUsersDisabled, allManager: allManager, allUnitys: allUnitys, allDepto})
}

exports.saveNewUser = async (req,res) => {
    
    let userCPF = parseInt(req.body['save-new-cpf'].split('.').join("").split('-').join(""));

    function pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }
    userCPF = pad(userCPF,11)

    if(userCPF.length == 11 || req.body['save-new-setor'] != ''){


        const validationCPF = await database
        .select("jcv_userCpf")
        .where({jcv_userCpf: userCPF})
        .table("jcv_users")
        .then( data => {return data;})


        if(validationCPF != ''){
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| CPF já cadastrado!");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"CPF já cadastrado!","timeMsg": 3000}`);
            res.redirect("/painel/system/users");
        }else{

            const userName = req.body['save-new-name'];
            const userUnidade = req.body['save-new-unidade'];
            const userGestor = req.body['save-new-gestor'];
            const userEmailCorporativo = null;
            const userEmailPessoal = null;
            const userRamal = req.body['save-new-ramal'];
            const userSetor = req.body['save-new-setor'];
    
            const userSYSrequisitorUse = req.body['save-new-sys-requsitor-use'] == 'on' ? 1 : 0;
            //const userSYSrequisitorManager = req.body['save-new-sys-requsitor-manager'] == 'on' ? 1 : 0;
            const userSYSrequisitorAdmin = req.body['save-new-sys-requsitor-admin'] == 'on' ? 1 : 0;
    
            const userSYSbelezaUse = req.body['save-new-sys-beleza-use'] == 'on' ? 1 : 0;
            const userSYSbelezaManager = req.body['save-new-sys-beleza-manager'] == 'on' ? 1 : 0;
            const userSYSbelezaAdmin = req.body['save-new-sys-beleza-admin'] == 'on' ? 1 : 0;
    
            const userSYScalendarUse = req.body['save-new-sys-calendar-use'] == 'on' ? 1 : 0;
            //const userSYScalendarManager = req.body['save-new-sys-calendar-manager'] == 'on' ? 1 : 0;
            const userSYScalendarAdmin = req.body['save-new-sys-calendar-admin'] == 'on' ? 1 : 0;

            const userSYStradeUse = req.body['save-new-sys-trade-use'] == 'on' ? 1 : 0;
            const userSYStradeAdmin = req.body['save-new-sys-trade-admin'] == 'on' ? 1 : 0;
            const userSYStradeawarduse = req.body['save-edit-sys-trade-award-use'] == 'on' ? 1 : 0;
            const userSYStradeawardadmin = req.body['save-edit-sys-trade-award-admin'] == 'on' ? 1 : 0;
    
            const userType = parseInt(req.body['save-new-sys-type-user']);
            const userSYSemail = 1;
            const userAtivo = parseInt(req.body['save-new-active']);

            const userFormsAdmin = req.body['save-new-sys-forms-admin'] == 'on' ? 1 : 0;
            const userNotifyAdmin = req.body['save-new-sys-notify-admin'] == 'on' ? 1 : 0;
            const userReportAdmin = req.body['save-new-sys-report-admin'] == 'on' ? 1 : 0;

            const useEncurtador = req.body['save-new-sys-enc-use'] == 'on' ? 1 : 0;

            const adminCourses = req.body['save-new-sys-course-admin'] == 'on' ? 1 : 0;
            const managerCourses = req.body['save-new-sys-course-manager'] == 'on' ? 1 : 0;
    
            database.insert({
    
                jcv_userNamePrimary: userName,
                jcv_userNameSecundary: userName,
                jcv_userCpf: userCPF,
                jcv_userPassword: null,
                jcv_userEmailCorporate: userEmailCorporativo,
                jcv_userEmailFolks: userEmailPessoal,
                jcv_userSector: userSetor,
                jcv_userUnity: userUnidade,
                jcv_userExtension: userRamal,
                jcv_userManager: userGestor,
                jcv_userCassification: userType,
                jcv_userEnabled: userAtivo,
                jcv_sysEmail: userSYSemail,
    
            }).table("jcv_users").then(data => { 
                database.insert({
    
                    sys_perm_idUser: data,
                    sys_blz_perm_use: userSYSbelezaUse,
                    sys_blz_perm_manager: userSYSbelezaManager,
                    sys_blz_perm_admin: userSYSbelezaAdmin,
                    sys_req_perm_use: userSYSrequisitorUse,
                    //sys_req_perm_manager: userSYSrequisitorManager,
                    sys_req_perm_admin: userSYSrequisitorAdmin,
                    sys_cal_perm_use: userSYScalendarUse,
                    //sys_cal_perm_manager: userSYScalendarManager,
                    sys_cal_perm_admin: userSYScalendarAdmin,
                    sys_tra_perm_use: userSYStradeUse,
                    sys_tra_perm_admin: userSYStradeAdmin,

                    sys_forms_perm_admin: userFormsAdmin,
                    sys_notify_perm_admin: userNotifyAdmin,

                    sys_reports_perm_admin: userReportAdmin,
                    sys_enc_perm_use: useEncurtador,

                    sys_courses_perm_admin: adminCourses,
                    sys_courses_perm_manager: managerCourses,

                    sys_tra_premiation_use: userSYStradeawarduse,
                    sys_tra_premiation_admin: userSYStradeawardadmin
    
                }).table("jcv_users_permissions").then(data => {
                    if(data != ''){
    
    
                        //Sistema de email
                        const textOne = 'Conta criada com sucesso!';
                        const textTwo = `Sua conta foi criada com sucesso. Ao fazer o login uma tela será exibida para cadastrar sua nova senha.`;
                        emailSystemExe.sendMailExe(userEmailCorporativo, 'Conta Criada', 'Conta Criada', 'Sistema JCV', userName, textOne, textTwo);
    
    
                        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O usuario '"+userName+"' foi cadastrado com sucesso, um e-mail de confirmação foi enviado!");
                        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"O usuario <b>${userName}</b> foi cadastrado com sucesso, um e-mail de confirmação foi enviado!","timeMsg": 3000}`);
                        res.redirect("/painel/system/users");
                    }
                })
    
            })

        }

        
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| O CPF precisa ter no minimo <b>11</b> caracteres, ou o setor não foi definido!");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"O CPF precisa ter no minimo <b>11</b> caracteres, ou o setor não foi definido!","timeMsg": 3000}`);
        res.redirect("/painel/system/users");
    }
}

exports.editSaveUser = async (req,res) => {

    const idUser = req.body['user-action-save-edit'];


    let userCPF = parseInt(req.body['save-edit-cpf-'+idUser].split('.').join("").split('-').join(""));

    function pad(num, size) {
        num = num.toString();
        while (num.length < size) num = "0" + num;
        return num;
    }
    userCPF = pad(userCPF,11)

    if(userCPF.length == 11){

        const userName = req.body['save-edit-name-'+idUser];
        const userUnidade = req.body['save-edit-unidade-'+idUser];
        const userGestor = req.body['save-edit-gestor-'+idUser];
        const userEmailCorporativo = req.body['save-edit-email-corp-'+idUser];
        const userEmailPessoal = req.body['save-edit-email-folks-'+idUser];
        const userRamal = req.body['save-edit-ramal-'+idUser];
        const userSetor = req.body['save-edit-setor-'+idUser];

        const userSYSrequisitorUse = req.body['save-edit-sys-requsitor-use-'+idUser] == 'on' ? 1 : 0;
        //const userSYSrequisitorManager = req.body['save-edit-sys-requsitor-manager-'+idUser] == 'on' ? 1 : 0;
        const userSYSrequisitorAdmin = req.body['save-edit-sys-requsitor-admin-'+idUser] == 'on' ? 1 : 0;

        const userSYSbelezaUse = req.body['save-edit-sys-beleza-use-'+idUser] == 'on' ? 1 : 0;
        const userSYSbelezaManager = req.body['save-edit-sys-beleza-manager-'+idUser] == 'on' ? 1 : 0;
        const userSYSbelezaAdmin = req.body['save-edit-sys-beleza-admin-'+idUser] == 'on' ? 1 : 0;

        const userSYScalendarUse = req.body['save-edit-sys-calendar-use-'+idUser] == 'on' ? 1 : 0;
        //const userSYScalendarManager = req.body['save-edit-sys-calendar-manager-'+idUser] == 'on' ? 1 : 0;
        const userSYScalendarAdmin = req.body['save-edit-sys-calendar-admin-'+idUser] == 'on' ? 1 : 0;

        const userSYStradeUse = req.body['save-edit-sys-trade-use-'+idUser] == 'on' ? 1 : 0;
        const userSYStradeAdmin = req.body['save-edit-sys-trade-admin-'+idUser] == 'on' ? 1 : 0;
        const userSYStradeawarduse = req.body['save-edit-sys-trade-award-use-'+idUser] == 'on' ? 1 : 0;
        const userSYStradeawardadmin = req.body['save-edit-sys-trade-award-admin-'+idUser] == 'on' ? 1 : 0;

        const userFormsAdmin = req.body['save-edit-sys-forms-use-'+idUser] == 'on' ? 1 : 0;
        const userNotifyAdmin = req.body['save-edit-sys-notify-use-'+idUser] == 'on' ? 1 : 0;
        const userReportAdmin = req.body['save-edit-sys-report-use-'+idUser] == 'on' ? 1 : 0;

        const useEncurtador = req.body['save-edit-sys-enc-use-'+idUser] == 'on' ? 1 : 0;

        const adminCourses = req.body['save-edit-sys-course-admin-'+idUser] == 'on' ? 1 : 0;
        const managerCourses = req.body['save-edit-sys-course-manager-'+idUser] == 'on' ? 1 : 0;


        const userType = parseInt(req.body['save-edit-sys-type-user-'+idUser]);
        //const userSYSemail = parseInt(req.body['save-edit-sys-mails-'+idUser]);
        const userAtivo = parseInt(req.body['save-edit-active-'+idUser]);

        if(parseInt(userAtivo) == 0){
            usersScript.alterDataUsers(req,res, idUser, userName, userAtivo)
        }else{
            //Validando se este usuario possui ou nao um cadastro nas permissões
            const validatePermSys = await database
            .select("sys_perm_id")
            .where({sys_perm_idUser: idUser})
            .table("jcv_users_permissions")
            .then( data => {
                return data;
            })

            database.update({

                jcv_userNamePrimary: userName,
                jcv_userNameSecundary: userName,
                jcv_userCpf: userCPF,
                jcv_userEmailCorporate: userEmailCorporativo,
                jcv_userEmailFolks: userEmailPessoal,
                jcv_userSector: userSetor,
                jcv_userUnity: userUnidade,
                jcv_userExtension: userRamal,
                jcv_userManager: userGestor,
                jcv_userCassification: userType,
                jcv_userEnabled: userAtivo,
                //jcv_sysEmail: userSYSemail

            }).table("jcv_users").where({jcv_id: idUser}).then(data => {


                if(validatePermSys != ''){
                    database.update({
                        sys_blz_perm_use: userSYSbelezaUse,
                        sys_blz_perm_manager: userSYSbelezaManager,
                        sys_blz_perm_admin: userSYSbelezaAdmin,
                        sys_req_perm_use: userSYSrequisitorUse,
                        sys_req_perm_admin: userSYSrequisitorAdmin,
                        sys_cal_perm_use: userSYScalendarUse,
                        sys_cal_perm_admin: userSYScalendarAdmin,
                        sys_tra_perm_use: userSYStradeUse,
                        sys_tra_perm_admin: userSYStradeAdmin,

                        sys_forms_perm_admin: userFormsAdmin,
                        sys_notify_perm_admin: userNotifyAdmin,

                        sys_reports_perm_admin: userReportAdmin,
                        sys_enc_perm_use: useEncurtador,

                        sys_courses_perm_admin: adminCourses,
                        sys_courses_perm_manager: managerCourses,

                        sys_tra_premiation_use: userSYStradeawarduse,
                        sys_tra_premiation_admin: userSYStradeawardadmin
            
                    }).table("jcv_users_permissions").where({sys_perm_idUser: idUser}).then(data => {
                        if(data != ''){
                            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O usuario <b>"+userName+"</b> foi alterado com sucesso");
                            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"O usuario <b>${userName}</b> foi alterado com sucesso! Talves seja necessário relogar no sistema","timeMsg": 5000}`);
                            //res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Talves seja necessário o <b>${userName}</b> relogar no sistema","timeMsg":5000}`);
                            res.redirect("/painel/system/users");
                        }
                    })
                }else{
                    database.insert({
                        sys_perm_idUser: idUser,
                        sys_blz_perm_use: userSYSbelezaUse,
                        sys_blz_perm_manager: userSYSbelezaManager,
                        sys_blz_perm_admin: userSYSbelezaAdmin,
                        sys_req_perm_use: userSYSrequisitorUse,
                        //sys_req_perm_manager: userSYSrequisitorManager,
                        sys_req_perm_admin: userSYSrequisitorAdmin,
                        sys_cal_perm_use: userSYScalendarUse,
                        //sys_cal_perm_manager: userSYScalendarManager,
                        sys_cal_perm_admin: userSYScalendarAdmin,
                        
                        sys_tra_perm_use: userSYStradeUse,
                        sys_tra_perm_admin: userSYStradeAdmin,

                        sys_forms_perm_admin: userFormsAdmin,
                        sys_notify_perm_admin: userNotifyAdmin,

                        sys_reports_perm_admin: userReportAdmin
                    }).table("jcv_users_permissions").then(data => {
                        if(data != ''){
                            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| O usuario <b>"+userName+"</b> foi alterado com sucesso");
                            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"O usuario <b>${userName}</b> foi alterado com sucesso","timeMsg": 3000}`);
                            res.redirect("/painel/system/users");
                        }
                    })
                }    
            })
        }
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| O CPF precisa ter no minimo <b>11</b> caracteres!");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"O CPF precisa ter no minimo <b>11</b> caracteres!","timeMsg": 3000}`);
        res.redirect("/painel/system/users");
    }
}

exports.resetPassUser = async (req,res) => {
    const idUser = req.body['user-action-reset-pass']

    database.update({jcv_userPassword: null}).where({jcv_id: idUser}).table("jcv_users").then( data => { 
        if(data == 1){

            if(idUser == GLOBAL_DASH[0]){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| A senha do usuario foi resetada com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"A senha do usuario foi resetada com sucesso!","timeMsg": 3000}`);
                req.session.cookieLogin = undefined;
                res.redirect("/login");
            }else{
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| A senha do usuario foi resetada com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"A senha do usuario foi resetada com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/system/users");
            }            
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno, tente novamente mais tarde");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno, tente novamente mais tarde","timeMsg": 3000}`);
            res.redirect("/painel/system/users");
        }
    })
}

exports.resetPassUserSingle = async (req,res) => {
    const idUser = req.body['user-action-reset-pass-single']

    database.update({jcv_userPassword: null}).where({jcv_id: idUser}).table("jcv_users").then( data => { 
        if(data == 1){

            if(idUser == GLOBAL_DASH[0]){
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS01| A senha do usuario foi resetada com sucesso!");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"A senha do usuario foi resetada com sucesso!","timeMsg": 3000}`);
                req.session.cookieLogin = undefined;
                res.redirect("/login");
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"A senha do usuario foi resetada com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/system/users");
            }            
        }else{
            //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro interno, tente novamente mais tarde");
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno, tente novamente mais tarde","timeMsg": 3000}`);
            res.redirect("/painel/system/users");
        }
    })
}

exports.downloadDataUsers = async (req,res) => {
    const idsUsers = req.body['button-data-users'].split(',');

    if(idsUsers != ''){
        const xl = require('excel4node');
        const wb = new xl.Workbook();
        const ws = wb.addWorksheet('Worksheet Name');

        database.raw(`
        SELECT c1.jcv_userCpf, c1.jcv_userNamePrimary, j1.sys_unity_name, j3.sys_department_name, c2.jcv_userNameSecundary,
        c1.jcv_userCassification, c1.jcv_userEnabled, j2.sys_blz_perm_use, j2.sys_blz_perm_manager, j2.sys_blz_perm_admin,
        j2.sys_req_perm_use, j2.sys_req_perm_admin, j2.sys_cal_perm_use, j2.sys_cal_perm_admin, j2.sys_tra_perm_use, j2.sys_tra_perm_admin

        FROM (jcv_users c1, jcv_users c2)

        JOIN jcv_unitys j1 ON c1.jcv_userUnity = j1.sys_unity_id
        JOIN jcv_users_permissions j2 ON c1.jcv_id = j2.sys_perm_idUser
        JOIN jcv_departments j3 ON c1.jcv_userSector = j3.sys_department_id

        WHERE c1.jcv_userManager = c2.jcv_id AND c1.jcv_id IN (${idsUsers})
        
        `).then(data => {

            const headingColumnNames = [
                "CPF",
                "Nome",
                "Unidade",
                "Setor",
                "Gestor",
                "Classificado",
                "Ativo?",
                "Beleza: Utilizar",
                "Beleza: Gestor",
                "Beleza: Admin",
                "Requisitor: Utilizar",
                "Requisitor: Admin",
                "Calendário: Utilizar",
                "Calendário: Admin",
                "Trade MKT: Utilizar",
                "Trade MKT: Admin",
            ]
            
            let headingColumnIndex = 1; //diz que começará na primeira linha
            headingColumnNames.forEach(heading => { //passa por todos itens do array
                // cria uma célula do tipo string para cada título
                ws.cell(1, headingColumnIndex++).string(heading);
            });

            let arrayClasification = {
                "1": "Master",
                "2": "Gestor",
                "3": "Colaborador Interno",
                "4": "Representantes",
                "5": "Promotoras",
                "6": "Jovem Aprendiz"
            }
            
            let rowIndex = 2;
            data[0].forEach( record => {
                let columnIndex = 1;
                Object.keys(record).forEach(columnName =>{

                    //Verificando se o dado é numero
                    //Verificando se o dado é numero
                    if(columnName == 'jcv_userCpf'){
                        ws.cell(rowIndex,columnIndex++)
                        .string(record [columnName])
                    }else if(columnName == 'jcv_userCassification'){

                        ws.cell(rowIndex,columnIndex++)
                        .string(arrayClasification[record [columnName]])

                    }else{
                        let valueSetNow = typeof(record [columnName]) === 'number' ? record [columnName] == 1 ? 'Sim' : 'Não' : record [columnName]
                         
                        ws.cell(rowIndex,columnIndex++)
                        .string(valueSetNow)
                    }
                    
                });
                rowIndex++;
            }); 

            const caracteresAleatorios = Math.random().toString(36).substring(5);
            const nameData = 'EXPORT-USERS-'+caracteresAleatorios;

            wb.write(nameData+'.xlsx', res)
        })
    }else{
        //res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Selecione ao menos um usuario");
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Selecione ao menos um usuario","timeMsg": 3000}`);
        res.redirect("/painel/system/users");
    }
}

exports.moduleTransferMain = async (req,res) => {

    //Pegando todos os gestores ativos
    const getAllManager = await database
    .select()
    .whereRaw(`jcv_userCassification in (1,2,4) AND jcv_userEnabled = 1`)
    .table("jcv_users")
    .then( data => {
        let arrayGet = [];
        data.forEach(element => {
            arrayGet.push(element.jcv_userNamePrimary)
        });
        return arrayGet
    })

    var page = "system/usersTransfer";
    res.render("panel/index", {page: page, getAllManager: getAllManager})
}

exports.moduleTransfer = async (req,res) => {
    const listUsers = typeof(req.body['input-list-users']) != 'object' ? [parseInt(req.body['input-list-users'])] : req.body['input-list-users'].map(function(value){
        return parseInt(value)
    })

    //const managerOld = req.body['input-old-manager']
    const managerNew = req.body['input-new-manager']
    //console.log(managerNew)

    if(managerNew != ''){
        const getManagerNew = await database
        .select('jcv_id')
        .where({jcv_userNamePrimary: managerNew})
        .table("jcv_users")
        .then( data => {return data})
    
        if(getManagerNew != ''){
    
            database
            .update({
                jcv_userManager: getManagerNew[0].jcv_id
            })
            .whereIn('jcv_id', listUsers)
            .table("jcv_users")
            .then( data => {
                if(data >= 1){

                    //Função que atualiza o gestor do usuario na tabela do programa da beleza
                    alterInformationsBeleza(listUsers, getManagerNew[0].jcv_id)

                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Total de <b>${listUsers.length}</b> foram tranferidos para o novo gestor.","timeMsg": 3000}`);
                    res.redirect("/painel/system/users/transfer");
                }else{
                    res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro interno ao fazer a tranferência.","timeMsg": 3000}`);
                    res.redirect("/painel/system/users/transfer");
                }
            })
    
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Gestor não encontrado","timeMsg": 3000}`);
            res.redirect("/painel/system/users/transfer");
        }
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Insira o gestor que vai receber a transferência!","timeMsg": 3000}`);
        res.redirect("/painel/system/users/transfer");
    }   
}

async function alterInformationsBeleza(listUsers, managerId){

    //Verificando se existe SOLICITAÇÕES em aberto
    const resultSearch = await database
    .select()
    .whereRaw(`sys_blz_userId in (${listUsers}) AND sys_blz_requestStatus = 1`)
    .table("jcv_blz_orders")
    .then( data => {
        if(data != ''){
            let dataArray = []
            data.forEach(element => {
                dataArray.push(element.sys_blz_id)
            });
            return dataArray
        }else{
            return ''
        }
    })

    if(resultSearch != ''){
        //Tem solicitações
        
        database
        .update({
            sys_blz_userManager: managerId
        })
        .whereIn('sys_blz_id', resultSearch)
        .table("jcv_blz_orders")
        .then( data => {
            //console.log('')
        })

    }else{
        //Sem solicitações
    }

}