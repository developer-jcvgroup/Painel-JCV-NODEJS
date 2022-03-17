if ("serviceWorker" in navigator) {

  if (navigator.serviceWorker.controller) {

      console.log("[Aplicativo] funcionário de serviço ativo encontrado, não há necessidade de registrar");

  } else {

      navigator.serviceWorker

          .register("/sw.js", {

              scope: "/"

          })

          .then(function(reg) {

              console.log("[Aplicativo] O trabalhador do serviço foi registrado para o escopo: " + reg.scope);

          });

  }

}