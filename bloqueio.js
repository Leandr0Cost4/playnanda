// Trava com Face ID (chave-senha do aparelho) antes de mostrar o app.
// O site e estatico: a trava protege contra quem pegar o celular desbloqueado,
// nao esconde os arquivos de quem tiver o link.
(() => {
  const lockScreen = document.getElementById("lockScreen");
  if (!lockScreen) {
    return;
  }

  const message = lockScreen.querySelector("[data-lock-message]");
  const unlockButton = lockScreen.querySelector("[data-lock-unlock]");
  const createButton = lockScreen.querySelector("[data-lock-create]");
  const CREATED_KEY = "spotife2:face-id-criado";
  const RELOCK_AFTER_MS = 5 * 60 * 1000;
  let hiddenAt = null;

  const supported = Boolean(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);

  function randomBytes(size) {
    const bytes = new Uint8Array(size);
    crypto.getRandomValues(bytes);
    return bytes;
  }

  function hasCreated() {
    try {
      return localStorage.getItem(CREATED_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function markCreated() {
    try {
      localStorage.setItem(CREATED_KEY, "1");
    } catch (error) {
      // Sem armazenamento: so muda a mensagem mostrada na proxima vez.
    }
  }

  function setMessage(text) {
    message.textContent = text;
  }

  function setBusy(busy) {
    unlockButton.disabled = busy;
    createButton.disabled = busy;
  }

  function showLock() {
    lockScreen.hidden = false;
    lockScreen.classList.remove("is-unlocking");
    setMessage(hasCreated()
      ? "Use o Face ID para entrar."
      : "Primeira vez neste celular? Toque em “Primeiro acesso”.");
  }

  function unlock() {
    lockScreen.classList.add("is-unlocking");
    window.setTimeout(() => {
      lockScreen.hidden = true;
    }, 300);
  }

  async function verify() {
    setBusy(true);
    try {
      await navigator.credentials.get({
        publicKey: {
          challenge: randomBytes(32),
          rpId: location.hostname,
          userVerification: "required",
          timeout: 60000
        }
      });
      markCreated();
      unlock();
    } catch (error) {
      setMessage(hasCreated()
        ? "Não deu certo. Toque para tentar de novo."
        : "Nenhum acesso neste celular ainda. Toque em “Primeiro acesso”.");
    } finally {
      setBusy(false);
    }
  }

  async function createAccess() {
    setBusy(true);
    try {
      await navigator.credentials.create({
        publicKey: {
          rp: { name: "SpotiFê", id: location.hostname },
          user: { id: randomBytes(16), name: "SpotiFê", displayName: "SpotiFê" },
          challenge: randomBytes(32),
          pubKeyCredParams: [
            { type: "public-key", alg: -7 },
            { type: "public-key", alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            residentKey: "required",
            userVerification: "required"
          },
          timeout: 60000
        }
      });
      markCreated();
      unlock();
    } catch (error) {
      setMessage("Não foi possível criar o acesso. Confira se as Chaves do iCloud estão ativadas em Ajustes e tente de novo.");
    } finally {
      setBusy(false);
    }
  }

  // Navegador sem suporte a chave-senha: abre direto para nao trancar ninguem para fora.
  if (!supported) {
    lockScreen.hidden = true;
    return;
  }

  // Aparelho sem Face ID, digital ou senha de tela para sites: mesma coisa.
  if (PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
    PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then((available) => {
        if (!available) {
          lockScreen.hidden = true;
        }
      })
      .catch(() => {});
  }

  unlockButton.addEventListener("click", verify);
  createButton.addEventListener("click", createAccess);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      return;
    }

    if (hiddenAt && Date.now() - hiddenAt > RELOCK_AFTER_MS && lockScreen.hidden) {
      showLock();
    }
    hiddenAt = null;
  });

  showLock();
})();
