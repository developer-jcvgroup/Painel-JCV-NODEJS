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
            let GLOBALclassification = searchUser[0]["jcv_userCassification"];//Classificação

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

            //Pegando a unidade do usuario
            const unityUser = await database.select("sys_unity_name").where({sys_unity_id: GLOBALunidade}).table("jcv_unitys").then( data => {
                return data[0].sys_unity_name;
            })

            let allUpdate = []

            //Pegando so nome e sobrenome
            let nameFirstLast = searchUser[0]["jcv_userNamePrimary"].split(' ').length-1;

            let GLOBALuserName = searchUser[0]["jcv_userNamePrimary"].split(' ')[0] + " " + searchUser[0]["jcv_userNamePrimary"].split(' ')[nameFirstLast];
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
                allUpdate,
                GLOBALclassification,
                unityUser
            ];

            //Pegando a url e validando
            global.PAINEL_URL;
            if(req.get('host') == 'localhost:8080'){
                PAINEL_URL = 'http://localhost:8080';
            }else{
                PAINEL_URL = 'https://jcv.net.br'
            }

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