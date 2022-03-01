document.addEventListener('DOMContentLoaded', function() {
    if (!Notification) {
        //alert('Desktop notifications not available in your browser. Try Chromium.');
        $(function(){
            $.fn.sys_popupSystem('SYS02','Este navegador não possui suporte para as notificações..')
        })
    return;
    }

    if (Notification.permission !== 'granted')
        Notification.requestPermission();
    });

    function notificationAPIaction(titleApi, messageApi, link) {
        if (Notification.permission !== 'granted')
            Notification.requestPermission();
        else {
        var notification = new Notification(titleApi, {
            body: [messageApi],
            icon: 'http://localhost:8080/logos/pwa-192.png',
            vibrate: true,
            
        });
        notification.onclick = function() {
            window.open(link);
        };
    }

    
}