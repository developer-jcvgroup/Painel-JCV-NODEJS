const database = require("../../database/database");
const databaseCertificates = require("../../database/databaseCertificates");
const uuid = require('uuid')

const moment = require("moment");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.moduleLoginExternal = async (req,res) => {
    //Gerando um registro de login externo


    //Verificando se o usuario possui conta no portal de certificados
    //Pegando o CPF do usuario
    const getCPF = await database
    .select("jcv_userCpf")
    .where({jcv_id: GLOBAL_DASH[0]})
    .table("jcv_users")
    .then( data =>{ return data})

    const getValidation = await databaseCertificates
    .select()
    .where({jcv_users_cpf: getCPF[0].jcv_userCpf})
    .table("jcv_users")
    .then( data => {return data})

    //Verificando
    if(getValidation != ''){
        //Possui cadastro no portal
        let uuidGEt = uuid.v1()

        databaseCertificates
        .insert({
            jcv_external_id_user: GLOBAL_DASH[0],
            jcv_external_login_uuid: uuidGEt,
            jcv_external_enabled: 1
        })
        .table("jcv_external_login")
        .then( data => {
            if(data[0] != 0){
                //Redirecionando para o login externo
                setTimeout(() => {
                    //res.redirect('https://google.com')
                    res.redirect("https://certificados.jcv.net.br/auth/"+uuidGEt);
                }, 500);
            }else{
                //Erro ao criar
                //res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Erro ao fazer login no portal. Contate um administrador.");
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "error","message":"Erro ao fazer login no portal. Contate um administrador.","timeMsg": 3000}`);
                res.redirect("/painel/cursos/main");
            }
        })
    }else{
        //Não possui cadastro
        res.redirect('/painel/cursos/sinc/profile')
    }

    
}