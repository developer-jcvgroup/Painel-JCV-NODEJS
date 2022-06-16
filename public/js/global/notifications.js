/* 

$.notification(
    ["Status das requisições alteradas com sucesso v cfd gfd gdfgfdg dfg df! <a href='#'>a</a>"],
    {
        position: ['top', 'right'], 
        messageType: 'error',
        timeView: 2000,
        //redirectAction: 'https://google.com' ou null
    }
)

*/
$("<style>")
.prop("type", "text/css")
.html(`
:root{
    --notify-bg-green-one: #def2d6;
    --notify-bg-green-two: #5A7052;
    
    --notify-bg-yellow-one: #f8f3d6;
    --notify-bg-yellow-two: #967132;

    --notify-bg-red-one: #ecc8c5;
    --notify-bg-red-two: #b32f2d;
    
    --notify-timeAnimation: 5s;
}

#notifications-main{
    position: absolute;
    width: fit-content;
   /*  top: 0;
    left: 0; */
    display: flex;
    flex-direction: column;
    z-index: 999;
    user-select: none;
}

.notifications-box{
    width: fit-content;
    max-width: 450px;
    min-width: 400px;
    display: none;
    flex-direction: column;
    background: var(--notify-bg-green-one);
    color: var(--bg-text);
    border-radius: 4px;
    margin: 9px;
    
}
.notifications-box-one{
    width: 100%;
    display: flex;
    align-items: center;
    padding: 15px 12px;
    line-height: 1.8;
}
.notifications-box-icon{
    width: 22%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.notifications-box-icon i{
    font-style: normal;
    font-size: 1.5rem;
    
}

.notifications-box-two-animate{
    width: 0;
    height: 3px;
    /* background: var(--notify-bg-green-two); */
    animation: animationTimeBar var(--notify-timeAnimation) linear;
}


@keyframes animationTimeBar {

    0% {
        width: 100%;
    }
    100% {
        display: none;
        width: 0px;
    }

}

/*  */
.notifications-box-msg{
    width: 100%;
    margin-left: 8px;
    display: flex;
    align-items: center;
}
.notifications-box-msg span{
    font-size: 0.9rem;
    white-space: normal;
}

.notifications-box-close{
    width: 22%;
    display: flex;
    justify-content: right;
    align-items: center;
}
.notifications-box-close i{
    font-size: 1rem;
    cursor: pointer;
    font-weight: bold;
    font-style: normal;
}

@media only screen and (max-width: 600px) {
    #notifications-main{
        width: 100%;
        justify-content: center;
        align-items: center;
    }
    .notifications-box{
        min-width: 95%;
    }
    .notifications-box-one{
        flex-direction: column;
    }
    .notifications-box-one span{
        text-align: center;
    }
    .notifications-box-close{
        justify-content: center;
    }
    .notifications-box-msg{
        justify-content: center;
    }
}
`)
.appendTo("head")

function stringRandom(tamanho) {
    var stringAleatoria = '';
    var caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < tamanho; i++) {
        stringAleatoria += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return stringAleatoria;
}

/*  */
/*  */
/*  */

function actionShowMsg(message,options,color,emoji){
    //alert('sucess')

    options.timeView = options.timeView == undefined ? 3000 : options.timeView < 4000 ? 4000 : options.timeView
    options.position = options.position == undefined ? ['top','right'] : options.position

    let randomCode = stringRandom(8);

    //$("body").append(`<div id="notifications-main-${randomCode}" class="notifications-main"></div>`)

    $("#notifications-main").css({
        [options.position[0]]: '5%',//padrao 0
        [options.position[1]]: '1%',//padrao 0
        //[Object.keys(options.position[0])]: Object.values(options.position[0]),
    })

    $("#notifications-main").append(`
    <div id="notifications-box-${randomCode}" class="notifications-box">
        <div class="notifications-box-one">
            <div class="notifications-box-icon">
                <i></i>
            </div>
            <div class="notifications-box-msg">
                <span id="notifications-box-msg-${randomCode}">${message}</span>
            </div>
            <div class="notifications-box-close">
                <i onclick="functionCloseMsg('${randomCode}')">X</i>
            </div>
        </div>
        <!--  -->
        <div class="notifications-box-two"><!-- animation --></div>
    </div>
    `)
    $(`#notifications-box-${randomCode}`)
    .fadeIn()
    .css(
        {
            'display':'flex',
            'background': color[0],
            'box-shadow': '0px 0px 20px 0px '+color[0]
        }
    )


    //definindo o timer para o keyfram css
    $(':root').css({'--notify-timeAnimation':`${options.timeView / 1000}s`})

    //Animação do scroll bar
    $(`#notifications-box-${randomCode}`).find(".notifications-box-two").addClass("notifications-box-two-animate")
    //Adicionando a cor a animação
    $(".notifications-box-two-animate").css({'background': color[1]})

    //Cor do span
    //$(`#notifications-box-msg-${randomCode}`).css({'color':'var(--notify-bg-green-two)'})
    $(`#notifications-box-${randomCode}`).find('span').css({'color':color[1]})

    $(`#notifications-box-${randomCode}`).find('i').eq(0).css({'color':color[1]}).text(emoji)
    $(`#notifications-box-${randomCode}`).find('i').eq(1).css({'color':color[1]})
    
    $(`#notifications-box-${randomCode}`).find('a').css({'color':color[1]})

    //Time out
    setTimeout(() => {
        $(`#notifications-box-${randomCode}`).fadeOut()

        //Removendo o objeto
        setTimeout(() => {

            //Removendo a notificação
            $(`#notifications-box-${randomCode}`).remove()

            if(options.redirectAction != undefined){
                window.location.href = options.redirectAction
            }

            //removendo o time do keyframe
            //$(':root').css({'--notify-timeAnimation':`0s`})
            
            //$("#notifications-main").removeClass("notifications-box-two")
        }, 500);
    }, options.timeView);

}

function functionCloseMsg(dandomGet){
    $("#notifications-box-"+dandomGet).fadeOut()

    setTimeout(() => {
        $("#notifications-box-"+dandomGet).remove()
    }, 500);
}


$.notification = function(message, options){

    try {

        //Validando se possui dados basicos
        if(options.message, options.messageType == undefined){
            throw 'Error: Dados básicos necessários faltantes!'
        }

        if(options.messageType == 'success'){
            let color = ['var(--notify-bg-green-one)','var(--notify-bg-green-two)']
            actionShowMsg(message,options,color,'😄')
        }else if(options.messageType == 'warning'){
            let color = ['var(--notify-bg-yellow-one)','var(--notify-bg-yellow-two)']
            actionShowMsg(message,options,color,'😕')
        }else if(options.messageType == 'error'){
            let color = ['var(--notify-bg-red-one)','var(--notify-bg-red-two)']
            actionShowMsg(message,options,color,'😓')
        }else{
            throw 'Error: MessageType inválido!'
            // caso falte algum dado exibir este error throw new UserException()
        }
    } catch (error) {
        console.log(error)
    }
}