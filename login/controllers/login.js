const database = require("../database/database");
const bcripty = require("bcryptjs");

const emailSystemExe = require('../../panel/controllers/system/emailSystem');

//Logando login
exports.commandLogar = async (req, res) =>{

    const linkspecial = req.body['input-link-special']
    
    req.session.cookieLogin = undefined;

    const dataOne = req.body.cpfUser.split('.').join("").split('-').join("");
    const dataTwo = req.body.cpfPassword != undefined ? req.body.cpfPassword : dataOne;


    //Validando o CPF
    database.select().where({jcv_userCpf: dataOne, jcv_userEnabled: 1}).limit(1).table("jcv_users").then( data => {
        //CPF encontrado
        if(data != ''){
            //Conta encontrada

            //Validando se é uma conta sem senha
            if(data[0].jcv_userPassword != null){
                //Conta com senha

                //Validando a senha
                var passCorrect = bcripty.compareSync(dataTwo, data[0].jcv_userPassword);
                if(passCorrect){
                    //Senha correta
                    req.session.cookieLogin = [
                        data[0]["jcv_id"],
                        data[0]["jcv_userNamePrimary"],
                        data[0]["jcv_userUnity"],
                        data[0]["jcv_userSector"],
                        data[0]["jcv_userManager"],
                        data[0]["jcv_userEmailCorporate"],
                        data[0]["jcv_userExtension"],
                        data[0]["jcv_userImageIcon"]
                    ];

                    //Sistema de links
                    if(linkspecial > ''){
                        res.redirect(linkspecial)
                    }else{
                        res.redirect("/painel");
                    }
                }else{
                    //Senha incorreta
                    res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Senha incorreta");
                    res.redirect("/login");
                }
            }else if(data[0].cv_userPassword == null){
                //Conta sem senha

                req.session.cookieLogin = [
                    data[0]["jcv_id"],
                    data[0]["jcv_userNamePrimary"],
                    data[0]["jcv_userUnity"],
                    data[0]["jcv_userSector"],
                    data[0]["jcv_userManager"],
                    data[0]["jcv_userEmailCorporate"],
                    data[0]["jcv_userExtension"],
                    data[0]["jcv_userImageIcon"]
                ];

                res.redirect("/painel");
            }else{
                res.redirect("/login");
            }

        }else{
            //Erro conta não econtrada
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03| Usuario inexistente");
            res.redirect("/login");
        }
    })

}

exports.resetPassWord = async (req,res) => {
    const cpfPass = req.body['cpfResetPass'];
    
    if(cpfPass != ''){
        let RedcpfPass = parseInt(cpfPass.split('.').join("").split('-').join(""));

        database.select('jcv_userNamePrimary','jcv_userEmailCorporate','jcv_userEmailFolks').where({jcv_userCpf: RedcpfPass}).table("jcv_users").then( data => {
            if(data != ''){
                //sucessso

                //Senha provisoria
                database.update({jcv_userPassword: null}).where({jcv_userCpf: RedcpfPass}).table("jcv_users").then( data => {
                    //Okay
                })

                let arr = [data[0].jcv_userEmailCorporate, data[0].jcv_userEmailFolks]
                
                //Sistema de email
                const textOne = 'Recentemente você solicitou a redefinição de senha, abaixo terá sua nova senha de acesso.';
                const textTwo = `Sua foi redefinida!. Ao fazer o login uma tela para cadastrar uma nova senha será exibida.`;
                emailSystemExe.sendMailExe(arr, 'Pedido de redefinição de senha', 'Redefinição de senha', 'Sistema JCV GROUP', data[0].jcv_userNamePrimary, textOne, textTwo);

                res.cookie('SYS-NOTIFICATION-EXE01', "SYS02| Um email foi enviado!");
                res.redirect("/login");
            }else{
                //error
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE01', "SYS02| Insira seu CPF para a recuperação");
        res.redirect("/login");
    }
}