const database = require("../../database/database");
const uuid = require('uuid')

const moment = require("moment");
const { assign } = require("nodemailer/lib/shared");
moment.tz.setDefault('America/Sao_Paulo');

function generateDate(){
    moment.locale('pt-br');
    return moment().format('LT')+" "+moment().format('L')
}

exports.helpMain = async (req,res) => {

    const getCategories = await database
    .select()
    .where({jcv_articles_category_enabled: 1})
    .table("jcv_articles_category")
    .then(dataCat => {return dataCat})


    var page = "help/helpMain";
    res.render("panel/index", {
        page: page, 
        getCategories: getCategories
    })
}

exports.helpMainAdmin = async (req,res) => {

    const getAllArticles = await database
    .select("jcv_articles.*","jcv_users.jcv_userNamePrimary","jcv_articles_category.*")
    .where({jcv_articles_enabled: 1})
    .table("jcv_articles")
    .join("jcv_users","jcv_users.jcv_id","jcv_articles.jcv_articles_create_idUser")
    .join("jcv_articles_category","jcv_articles_category.jcv_articles_category_id","jcv_articles.jcv_articles_category")

    const getAllArticlesDisabled = await database
    .select("jcv_articles.*","jcv_users.jcv_userNamePrimary","jcv_articles_category.*")
    .where({jcv_articles_enabled: 0})
    .table("jcv_articles")
    .join("jcv_users","jcv_users.jcv_id","jcv_articles.jcv_articles_create_idUser")
    .join("jcv_articles_category","jcv_articles_category.jcv_articles_category_id","jcv_articles.jcv_articles_category")
    .then( data => {return data})

    var page = "help/helpMainAdmin";
    res.render("panel/index", {
        page: page, 
        getAllArticles: getAllArticles,
        getAllArticlesDisabled: getAllArticlesDisabled
    })
}

exports.helpNewAdmin = async (req,res) => {

    const getCategory = await database
    .select()
    .where({jcv_articles_category_enabled: 1})
    .table("jcv_articles_category")
    .then( data => {return data})

    var page = "help/helpAdminNew";
    res.render("panel/index", {
        page: page, 
        getCategory: getCategory
    })
}

exports.helpNewSave = async (req,res) => {
    const articleTitle = req.body['help-main-title']
    const articleEnabled = req.body['help-main-enabled']
    const articleContent = req.body['help-main-content']
    const articleCategory = req.body['help-main-category']

    let linkArticle = articleTitle.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/\s/g, '-')

    if(articleTitle != '' && articleContent != '' && articleCategory != ''){
        database
        .insert({
            jcv_articles_title: articleTitle,
            jcv_article_link: linkArticle,
            jcv_articles_content: articleContent,
            jcv_articles_create_date: generateDate(),
            jcv_articles_create_idUser: GLOBAL_DASH[0],
            jcv_articles_enabled: articleEnabled,
            jcv_articles_category: articleCategory
        })
        .table("jcv_articles")
        .then( data => {
            if(data > 0){
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Artigo <b>${articleTitle}</b> criado com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/help/admin/main");
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "erro","message":"Erro ao criar o artigo","timeMsg": 3000}`);
                res.redirect("/painel/help/admin/new");
            }
        })
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Existem valores a ser preenchido!","timeMsg": 3000}`);
        res.redirect("/painel/help/admin/new");
    }
}

exports.helpEditAdmin = async (req,res) => {

    const articleId = req.params.id

    const getCategory = await database
    .select()
    .where({jcv_articles_category_enabled: 1})
    .table("jcv_articles_category")
    .then( data => {return data})
    
    const getArticle = await database
    .select()
    .where({jcv_articles_id: articleId})
    .join("jcv_articles_category","jcv_articles_category.jcv_articles_category_id","jcv_articles.jcv_articles_category")
    .table("jcv_articles").then( data => {return data})

    var page = "help/helpAdminEdit";
    res.render("panel/index", {
        page: page, 
        getArticle: getArticle,
        getCategory: getCategory
    })
}

exports.helpEditSave = async (req,res) => {
    const articleTitle = req.body['help-main-title-edit']
    const articleEnabled = req.body['help-main-enabled-edit']
    const articleContent = req.body['help-main-content-edit']
    const articleCategory = req.body['help-main-category-edit']

    const idArticle = req.body['article-id'];

    let linkArticle = articleTitle.toLowerCase().replace(/[^a-zA-Z ]/g, "").replace(/\s/g, '-')

    if(articleTitle != '' && articleContent != '' && articleCategory != '' && idArticle != ''){
        database
        .update({
            jcv_articles_title: articleTitle,
            jcv_article_link: linkArticle,
            jcv_articles_content: articleContent,
            jcv_articles_create_date: generateDate(),
            jcv_articles_create_idUser: GLOBAL_DASH[0],
            jcv_articles_enabled: articleEnabled,
            jcv_articles_category: articleCategory
        })
        .where({
            jcv_articles_id: idArticle
        })
        .table("jcv_articles")
        .then( data => {
            if(data != 0){
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Artigo <b>${articleTitle}</b> editado com sucesso!","timeMsg": 3000}`);
                res.redirect("/painel/help/admin/main");
            }else{
                res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "erro","message":"Erro ao criar o artigo","timeMsg": 3000}`);
                res.redirect("/painel/help/admin/edit/"+idArticle);
            }
        })
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "warning","message":"Existem valores a ser preenchido!","timeMsg": 3000}`);
        res.redirect("/painel/help/admin/edit/"+idArticle);
    }
}

exports.helpdeleteArticle = async (req,res) => {
    const idArticle = req.body['button-delete-article']

    database
    .delete()
    .where({
        jcv_articles_id: idArticle
    })
    .table("jcv_articles")
    .then( data => {
        if(data == 1){
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "success","message":"Artigo deletado editado com sucesso!","timeMsg": 3000}`);
            res.redirect("/painel/help/admin/main");
        }else{
            res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "erro","message":"Erro ao excluir o artigo","timeMsg": 3000}`);
            res.redirect("/painel/help/admin/edit/"+idArticle);
        }
    })
}

exports.helpCategory = async (req,res) => {

    const idCAtegory = req.params.id;

    const getCategories = await database
    .select()
    .where({jcv_articles_category_link :idCAtegory})
    .table("jcv_articles_category")
    .then( data => {return data})

    const getArticles = await database
    .select()
    .where({jcv_articles_category: getCategories[0].jcv_articles_category_id, jcv_articles_enabled: 1})
    .table("jcv_articles")
    .then( data => {return data})

    var page = "help/helpCategory";
    res.render("panel/index", {
        page: page,
        getArticles: getArticles,
        getCategories: getCategories
    })
}

exports.helpArticle = async (req,res) => {

    const urlArticle = req.params.url;

    const getArticles = await database
    .select()
    .where({jcv_article_link: urlArticle, jcv_articles_enabled: 1})
    .table("jcv_articles")
    .then( data => {return data})

    if(getArticles != ''){
        const getCategories = await database
        .select()
        .where({jcv_articles_category_id: getArticles[0].jcv_articles_category})
        .table("jcv_articles_category")
        .then( data => {return data})
    
        var page = "help/helpArticle";
        res.render("panel/index", {
            page: page,
            getCategories: getCategories,
            getArticles: getArticles
        })
    }else{
        res.cookie('SYSTEM-NOTIFICATIONS-MODULE', `{"typeMsg": "erro","message":"Artigo não encontrado","timeMsg": 3000}`);
        res.redirect("/painel/help");
    }

}