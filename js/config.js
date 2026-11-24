/* ============================================================
   CARDUME · CONFIGURAÇÃO (preencha antes de publicar no GitHub)
   Siga o LEIA-ME.md, passos 1 e 2.
   Estes valores são PÚBLICOS por natureza (o Firebase e o Mapbox
   foram feitos para ficar no site); a segurança vem das regras do
   Firestore e da restrição de endereço do token do Mapbox.
   NUNCA coloque aqui a chave da IA (Anthropic): ela vai só nos Ajustes do app.
   ============================================================ */
window.CARDUME_CONFIG = {
  // Firebase › Configurações do projeto › Seus apps › Web › "firebaseConfig"
  firebase: {
    apiKey: "COLE_AQUI",
    authDomain: "SEU-PROJETO.firebaseapp.com",
    projectId: "SEU-PROJETO",
    storageBucket: "SEU-PROJETO.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000"
  },
  // Mapbox › Account › Tokens › token público (começa com "pk.")
  mapboxToken: "pk.COLE_AQUI",
  // (opcional) seu UID do Firebase para ver a tela de Moderação. Deixe "" se não souber.
  ownerUid: ""
};
