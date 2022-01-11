const database = require("../database/database");
const bcripty = require("bcryptjs");

const emailSystemExe = require('../../panel/controllers/system/emailSystem');

//Logando login
exports.commandLogar = async (req, res) =>{

    const linkspecial = req.body['input-link-special']
    

    //Enviando os emails
    //emailSystemExe.sendMailExe('vitor.henrique@vitorstudio.com.br; vitor.henrique@vitorstudio.com.br', 'Subttulooo', 'Body Eamil!!!', 'Programa da beleza', 'Vitor He.!', 'Aqui é o texto um', 'Aqui é o texto dois');
    
    req.session.cookieLogin = undefined;

    const dataOne = req.body.cpfUser.split('.').join("").split('-').join("");
    const dataTwo = req.body.cpfPassword;

    database.select().where({jcv_userCpf: dataOne, jcv_userEnabled: 1}).table("jcv_users").then(data => {
        
        if(data != undefined){
            var passCorrect = bcripty.compareSync(dataTwo, data[0]["jcv_userPassword"]);

            if(passCorrect){
                if(data.length >= 1){

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

                    if(linkspecial != ''){
                        res.redirect(linkspecial)
                    }else{
                        res.redirect("/painel");
                    }
                }else{
                    res.cookie('SYS-NOTIFICATION-EXE0', "SYS02|Erro ao logar!");
                    res.redirect("/login");
                }
            }else if(dataTwo == data[0]["jcv_userPassword"]){
                //Redefinir a senha

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
                res.cookie('SYS-NOTIFICATION', "SYS02|Senha inserida incorreta");
                res.redirect("/login");
            }
        }else{
            res.cookie('SYS-NOTIFICATION', "SYS03|Usuario não encontrado!");
            res.redirect("/login");
        }

    }).catch(err =>{
        res.cookie('SYS-NOTIFICATION', "SYS02|Usuario não encontrado");
        res.redirect("/login");
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
                database.update({jcv_userPassword: RedcpfPass}).where({jcv_userCpf: RedcpfPass}).table("jcv_users").then( data => {
                    console.log(data);
                })

                let arr = [data[0].jcv_userEmailCorporate, data[0].jcv_userEmailFolks]
                
                //Sistema de email
                const textOne = 'Recentemente você solicitou a redefinição de senha, abaixo terá sua nova senha de acesso.';
                const textTwo = `Sua nova senha é: <b>${RedcpfPass}</b>. Ao fazer o login uma tela de redefinição é exibida.`;
                emailSystemExe.sendMailExe(arr, 'Pedido de redefinição de senha', 'Redefinição de senha', 'Sistema JCV GROUP', data[0].jcv_userNamePrimary, textOne, textTwo);

                res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Um email foi enviado!");
                res.redirect("/login");
            }else{
                //error
                console.log("BBBB")
            }
        })
    }else{
        res.cookie('SYS-NOTIFICATION-EXE1', "SYS02| Insira seu CPF para a recuperação");
        res.redirect("/login");
    }
}