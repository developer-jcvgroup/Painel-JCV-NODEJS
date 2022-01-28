const database = require("./database/database");

authenticate = async (req, res, next) => {

    if(req.session.cookieLogin != undefined){

        let idUser = req.session.cookieLogin[0];

        const searchUser = await database.select().where({jcv_id: idUser}).table("jcv_users").then(data => {
            return data;
        }).catch(err =>{
            res.send(err);
        })

        global.GLOBAL_DASH = []
        if(searchUser.length >= 1){

            let GLOBALuserid = searchUser[0]["jcv_id"];// ID
            let GLOBALuser = searchUser[0]["jcv_userNamePrimary"];// NOME
            let GLOBALunidade = searchUser[0]["jcv_userUnity"];// UNIDADE
            let GLOBALsetor = searchUser[0]["jcv_userSector"];// SETOR
            let GLOBALgestor = searchUser[0]["jcv_userManager"];// GESTOR
            let GLOBALemail = searchUser[0]["jcv_userEmailCorporate"];// E-MAIL
            let GLOBALramal = searchUser[0]["jcv_userExtension"];//Ramal
            let GLOBALimage = searchUser[0]["jcv_userImageIcon"];//Image

            //Verificando a senha
            if(searchUser[0]["jcv_userPassword"] == null){
                global.DEFINEpassword = searchUser[0]["jcv_id"];
            }else{
                global.DEFINEpassword = null;
            }

            //Pegando o setor do usuario
            const sectorUser = await database.select("sys_department_name").where({sys_department_id: GLOBALsetor}).table("jcv_departments").then( data => {
                return data[0].sys_department_name;
            })

            //Verificando se existe menssagem de novas atualizações
            const allUpdate = await database
            .select()
            .whereRaw("(sys_update_usersOkUpdate NOT LIKE '%"+GLOBALuserid+"%' OR sys_update_usersOkUpdate IS NULL)")
            .table("sys_update")
            .then( data => { return data; })

            //Pegando so nome e sobrenome
            let GLOBALuserName = searchUser[0]["jcv_userNamePrimary"].split(' ')[0] + " " + searchUser[0]["jcv_userNamePrimary"].split(' ')[1];
            let GLOBALfisrtUserName = searchUser[0]["jcv_userNamePrimary"].split(' ')[0];

            GLOBAL_DASH = [
                GLOBALuserid,
                GLOBALuser, 
                GLOBALunidade, 
                GLOBALsetor, 
                GLOBALgestor,
                GLOBALemail, 
                GLOBALramal, 
                GLOBALimage, 
                GLOBALuserName, 
                GLOBALfisrtUserName, 
                sectorUser,
                allUpdate
            ];

            //Aqui eu predefino a url das salas no calendario
            //isto é importante pois não consigo pegar o link cheio usando o express e portanto tenho que definir manualmente
            global.GLOBAL_LINK_QR = 'https://jcv.net.br/painel/calendario/viewRoom/'

            //-------------------------------------------------------
            //-------------------------------------------------------
            //Buscando todas as permissões
            const resultPermissions = await database
            .select("jcv_users.jcv_userCassification","jcv_users_permissions.*")
            .where({sys_perm_idUser: GLOBAL_DASH[0]})
            .table("jcv_users_permissions")
            .join("jcv_users", "jcv_users_permissions.sys_perm_idUser",'=','jcv_users.jcv_id')
            .then( data => {
                return data;
            })

            global.GLOBAL_PERM = resultPermissions;

            //Validadno o link, olhar no README!!!!
            let linkspecial = req.query.linkspecial;
            if(linkspecial != undefined){
                res.redirect(linkspecial)
            }else{
                next();
            }
            
        }else{
            req.session.cookieLogin = undefined;
            res.redirect("/login");
        }

    }else{
        //Validadno o link, olhar no README!!!!
        let linkspecial = req.query.linkspecial;
        if(linkspecial != undefined){
            res.redirect("/login/?linkspecial="+linkspecial)
        }else{
            req.session.cookieLogin = undefined;
            res.redirect("/login")
        }
    }
    
}

module.exports = authenticate;