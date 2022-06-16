$(function(){
    //Sistema de notificações
    if(Cookies.get("SYSTEM-NOTIFICATIONS-MODULE") != undefined){
        let getCookieMsg = JSON.parse(Cookies.get("SYSTEM-NOTIFICATIONS-MODULE"));
        
        //Exibindo a msg
        $.notification(
            [getCookieMsg.message],
            {
                messageType: getCookieMsg.typeMsg,
                timeView: getCookieMsg.timeMsg,
            }
        )

        console.log(getCookieMsg)

        Cookies.remove("SYSTEM-NOTIFICATIONS-MODULE")
    }
})