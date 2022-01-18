const express = require("express");
const app = express();
const session = require("express-session");
const cookieParser = require('cookie-parser');
const flash = require("connect-flash");

app.set("view engine", "ejs");

// Static
app.use(express.static("public"));

app.use(express.urlencoded({extended: false})); //Pegar dados dos forms ou Rotas
app.use(express.json()); //Aceitar json
app.use(cookieParser())

app.use(flash());

//sessions
app.use(session({
    secret: "qualu77asadasfdas!@#", 
    name: "JCV-GROUP", 
    resave: true, 
    saveUninitialized: true,
    cookie: {maxAge: 8000000}
}));

//Require Login
const jcvLogin = require("./login/app")
app.use("/login", jcvLogin)

app.get("/", (req,res)=>{
    let loginContr = false;
    if(req.session.cookieLogin != undefined){
        loginContr = true
    }

    res.render("web/index", {loginContr: loginContr})
})

//Require do painel
const jcvPanel = require("./panel/app")
app.use("/painel", jcvPanel);

app.listen(8080, ()=>{
    console.log(" ")
    console.log("Servidor Rodando")
    console.log(" ")
})