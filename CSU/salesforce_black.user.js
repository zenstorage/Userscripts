// ==UserScript==
// @name                Salesforce Black Tweaks
// @namespace           zen
// @description         Improve salesforce black for me
// @version             1.0.1
// @run-at              document-start
// @match               https://ifoodatendimento.lightning.force.com/*
// @require             http://127.0.0.1:5500/General/USToolkit/script.user.js
// @icon                https://www.svgrepo.com/download/452347/salesforce.svg
// @grant               unsafeWindow
// @grant               window.focus
// @grant               GM_addStyle
// @license             GPL-3.0-only
// ==/UserScript==

const COMENTARIO = `
Reabertura? - Não
Houve tentativa de contato? - N/A
Nome da pessoa com quem falou: N/A
Telefone(s) de contato: N/A

Solicitação do parceiro: Parceiro solicitou contestação de cancelamento (pedido total parcial)
Descrição das ações: PLACEHOLDER
CÓDIGO DE CANCELAMENTO: 417

O motivo do cancelamento do pedido prevê crédito pelo motor? - SIM NÃO
CRÉDITO_PELO_ORÁCULO? - SIM NÃO
CRÉDITO_GERADO_MANUAL: SIM NÃO
Solução para a solicitação do parceiro: Crédito acatado negado

Foi realizada a pós tabulação, a formalização via e-mail e o fechamento do caso? - SIM
Caso solucionado? - SIM
`.trim();
let backOffice;

const copyPopup = document.createElement("div");
copyPopup.id = "copyPopup";
copyPopup.textContent = "Copiado";
document.documentElement.appendChild(copyPopup);

const onElements = new UST.OnElements({ deep: true });

function copyOnClick(element) {
    element.style.setProperty("font-weight", "bold", "important");
    element.style.setProperty("cursor", "pointer", "important");

    element.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();

        navigator.clipboard.writeText(element.innerText).then(() => {
            copyPopup.classList.add("popupActive");
            setTimeout(() => copyPopup.classList.remove("popupActive"), 2000);
        });
    });
}

function backOfficeHandler(element) {
    if (!backOffice?.self) {
        backOffice = window.open(`https://backoffice.ifoodxt.com.br/orders?id=${element.innerText}`, "_blank");
        return;
    }

    backOffice.focus();
    backOffice.postMessage({ UUID: element.innerText }, "https://backoffice.ifoodxt.com.br");
}

document.addEventListener("keydown", (event) => {
    if (event.code === "KeyB" && event.ctrlKey) {
        event.preventDefault();
        const selection = window.getSelection();
        if (!selection.toString()) return;

        const inputField = selection.baseNode.querySelector("textarea, input");
        if (!inputField) return;

        const selectionStart = inputField.selectionStart;
        const selectionEnd = inputField.selectionEnd;
        if (selectionStart === selectionEnd) return;

        inputField.focus();
        inputField.setSelectionRange(selectionStart, selectionEnd);
        document.execCommand("insertText", false, `<b>${inputField.value.substring(selectionStart, selectionEnd)}</b>`);
    }

    const macrosInput = UST.query(document, '.split-right > .active [placeholder="Digite para pesquisar macros..."]');
    if (event.code === "KeyM" && event.shiftKey && macrosInput?.getRootNode()?.activeElement !== macrosInput) {
        macrosInput.focus();
        event.preventDefault();
        return;
    }
});

onElements.per(
    '[data-target-selection-name="sfdc:RecordField.Case.FrnId__c"] lightning-formatted-text, [data-field-id="RecordAccountPersonID_cField"] lightning-formatted-text',
    copyOnClick,
);

onElements.per(
    '[aria-label="Fluxo Caso_Busca_casos_para_o_mesmo_ID_do_pedido"] strong, [data-target-selection-name="sfdc:RecordField.Case.IDPedido__c"] lightning-formatted-text',
    (element) => {
        copyOnClick(element);

        element.addEventListener("mousedown", (event) => {
            if (event.button === 1 && event.ctrlKey) {
                backOfficeHandler(element);
            }
        });
    },
);

onElements.per('[data-component-id="c_chatifood"] textarea', (element) => {
    element.rows = 20;
});

onElements.per('.notesNoteEditor [data-placeholder="Insira uma nota..."]', (element) => {
    if (element.textContent !== "") return;
    element.textContent = COMENTARIO;
});

onElements.start();

GM_addStyle(`
#copyPopup {
    position: fixed;
    z-index: 9;
    top: 0rem;
    left: 50%;
    translate: -50% -100%;
    background: hsl(240, 58%, 4%);
    color: #eee;
    padding: 15px;
    font-size: 16px;
    border-radius: .5rem;
    transition: translate .2s ease;
    font-family: system-ui;
}
.popupActive {
    translate: -50% 2rem !important;
}
.notesNoteEditor [data-placeholder="Insira uma nota..."] {
    overscroll-behavior: contain !important;
}
`);
