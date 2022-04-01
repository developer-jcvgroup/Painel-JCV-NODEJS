const bcripty = require("bcryptjs");
const database = require("../../database/database");
const multer  = require("multer");
const fs = require("fs")

exports.getInfoUser = async (req,res) => {
    
    await database.select().where({jcv_id: GLOBAL_DASH[0]}).table("jcv_users").then(data => {

        var userName = data[0]["jcv_userNamePrimary"].split(' ')[0] + " " + data[0]["jcv_userNamePrimary"].split(' ')[1];
        data.push(userName);

        var page = "system/profile"
        res.render("panel/index", {page: page, arrayData: data});

    }).catch(err => {
        res.redirect("/painel")
    })
}

exports.sysNewpassword = async (req,res) => {
    var passOne = req.body.sysNewPass;
    var passTwo = req.body.sysNewPassTwo;

    if(passOne != passTwo){
      res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Ambas as senha não coincidem! revise-as");
      res.redirect("/painel/perfil");
    }else{

        let salt = bcripty.genSaltSync(10);
        let passwordHash = bcripty.hashSync(passOne, salt)
        
        await database.update({jcv_userPassword: passwordHash}).where({jcv_id: GLOBAL_DASH[0]}).table("jcv_users").then(data => {

            res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Senha definida com sucesso!");
            res.redirect("/painel");
        }).catch(err => {
            res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Erro ao salvar sua senha.");
            res.redirect("/painel");
        })
        
    }
}

exports.updateDataUser = async (req,res) =>{

  var userName = req.body.updateNameUser;
  var userEmailCorp = req.body.updateEmailUserCorp;
  var userEmailPer = req.body.updateEmailUserPer;
  var userRamal = req.body.updateRamalUser;
  var userCpf = req.body.updateCPFUser.split('.').join("").split('-').join("");;

  if(req.body.updateAppsUser == "on"){
    var userApps = 1;
  }else{
    var userApps = 0;
  }

  await database.update({jcv_userNamePrimary: userName, jcv_userNameSecundary: userName, jcv_userEmailCorporate: userEmailCorp, jcv_userEmailFolks: userEmailPer, jcv_userExtension: userRamal, jcv_sysEmail: userApps, jcv_userCpf: userCpf}).where({jcv_id: GLOBAL_DASH[0]}).table("jcv_users").then(data =>{
    if(data){
      res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Seus dados foram atualizados com sucesso!");
      res.redirect("/painel");
    }
  }).catch(err => {
    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Erro ao atualizar seus dados!");
    res.redirect("/painel");
  })
  
}


exports.updateImageUser = async (req,res) => {
  const urlAvataars = req.body['avataaars-button-save'];

  if(urlAvataars.length > 20){
  await database.update({jcv_userImageIcon: urlAvataars}).where({jcv_id: GLOBAL_DASH[0]}).table("jcv_users").then(data =>{
    if(data){
      res.cookie('SYS-NOTIFICATION-EXE1', "SYS01|Avataars atualizada com sucesso!");
      res.redirect("/painel");
    }
  }).catch(err => {
    res.cookie('SYS-NOTIFICATION-EXE1', "SYS03|Avataars: erro ao atualizar seus dados!");
    res.redirect("/painel");
  })
  }else{
    res.cookie('SYS-NOTIFICATION-EXE1', "SYS02|Avataars: não foi idenficado nenhuma modificação.");
    res.redirect("/painel");
  }

}