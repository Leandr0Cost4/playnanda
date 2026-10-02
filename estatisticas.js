// Google Analytics da SpotiFê: acessos, tempo na página e músicas tocadas.
// Abrir playnanda.com/#nao-contar uma vez deixa aquele aparelho fora das contas
// (para os testes não somarem); playnanda.com/#contar volta a contar.
(() => {
  const MEDICAO_ID = "G-KKJ452QM5T";
  const NAO_CONTAR_KEY = "spotife:nao-contar";

  function lerNaoContar() {
    try {
      return localStorage.getItem(NAO_CONTAR_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function gravarNaoContar(valor) {
    try {
      if (valor) {
        localStorage.setItem(NAO_CONTAR_KEY, "1");
      } else {
        localStorage.removeItem(NAO_CONTAR_KEY);
      }
    } catch (error) {
      // Sem armazenamento: vale só para esta visita.
    }
  }

  let naoContar = lerNaoContar();

  if (location.hash === "#nao-contar" || location.hash === "#contar") {
    naoContar = location.hash === "#nao-contar";
    gravarNaoContar(naoContar);
    history.replaceState(null, "", location.pathname + location.search);
  }

  // Nome de evento do Analytics: só letras sem acento, números e "_".
  function nomeEvento(texto) {
    return texto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
  }

  window.spotifeEstatistica = (evento, parametros) => {
    if (naoContar || typeof window.gtag !== "function") {
      return;
    }
    window.gtag("event", nomeEvento(evento), parametros || {});
  };

  if (naoContar) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", MEDICAO_ID);

  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEDICAO_ID}`;
  document.head.append(script);
})();
