// ==UserScript==
// @name                Salesforce Tweaks
// @namespace           zen
// @description         Improve salesforce for me
// @version             1.2
// @run-at              document-start
// @match               https://ifood.lightning.force.com/*
// @require             http://127.0.0.1:5500/General/USToolkit/script.user.js
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

const copyPopup = document.createElement("div");
copyPopup.id = "copyPopup";
copyPopup.textContent = "Copiado";
document.documentElement.appendChild(copyPopup);

const onElements = new UST.OnElements({ deep: true });

let backOffice;

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

async function waitElement(selector) {
    return new Promise((resolve, reject) => {
        onElements.add(selector, (element) => {
            resolve(element);
            return true;
        });

        setTimeout(() => reject(), 5000);
    });
}

function backOfficeHandler(element) {
    if (!backOffice) {
        backOffice = window.open(`https://backoffice.ifoodxt.com.br/orders?id=${element.innerText}`, "_blank");
        return;
    }

    backOffice.focus();
    backOffice.postMessage({ UUID: element.innerText }, "https://backoffice.ifoodxt.com.br");
}

onElements.per('records-record-layout-item[field-label="UUID"] lightning-formatted-text', (element) => {
    element.style.setProperty("font-weight", "bold", "important");
    element.style.setProperty("cursor", "pointer", "important");

    copyOnClick(element);
    element.addEventListener("mousedown", (event) => {
        console.log(event);
        if (event.button !== 1) {
            return;
        }

        if (event.ctrlKey) {
            backOfficeHandler(element);
            return;
        }

        window.open(`https://oraculo.ifoodxt.com.br/dashboard?requester_type=partner&type=order&id=${element.innerText}`, "_blank");
    });
});

onElements.per(
    'records-record-layout-item:is([field-label="Número do caso"], [field-label="Fornecedor ID"]) lightning-formatted-text',
    (element) => {
        element.style.setProperty("font-weight", "bold", "important");
        element.style.setProperty("cursor", "pointer", "important");

        copyOnClick(element);
    },
);

onElements.per('[data-target-selection-name="sfdc:RecordField.CaseComment.CommentBody"] textarea', (element) => {
    if (!location.pathname.startsWith("/lightning/o/CaseComment/new")) return;

    element.value = COMENTARIO;
    element.rows = 20;
});

onElements.per('[data-target-selection-name="sfdc:RecordField.CaseComment.IsPublished"] input[type="checkbox"]', (element) => {
    if (!location.pathname.startsWith("/lightning/o/CaseComment/new")) return;

    element.click();
});

onElements.per('.split-right > .active [data-tab-name="Case.Enviar_Email"]', (element) => {
    if (!location.pathname.startsWith("/lightning/r/Case/")) return;

    element.click();
});

onElements.per('.split-right > .active [data-target-selection-name="sfdc:RecordField.EmailMessage.ValidatedFromAddress"] a', (element) => {
    if (
        !location.pathname.startsWith("/lightning/r/Case/") ||
        element.innerText !== "Atendimento iFood <atendimento_parceiro@ifood.com.br>"
    )
        return;

    element.click();
});

onElements.per('.select-options li > a[title="Atendimento iFood <atendimento_parceiro@ifood.com.br>"]', (element) => {
    if (!location.pathname.startsWith("/lightning/r/Case/")) return;

    element.click();
});

onElements.per(
    '.split-right > .active [data-target-selection-name="sfdc:RecordField.EmailMessage.BccAddress"] button:has([d^="M310 254l130"])',
    (element) => {
        if (!location.pathname.startsWith("/lightning/r/Case/")) return;

        element.click();
    },
);

onElements.per(
    '.split-right > .active :not(.slds-show) [data-target-selection-name="sfdc:RecordField.EmailMessage.ToAddress"] button:has([data-key="adduser"])',
    (element) => {
        if (!location.pathname.startsWith("/lightning/r/Case/")) return;

        element.click();
    },
);

onElements.per(".uiContainerManager > .active lightning-vertical-navigation-item a", (element) => {
    if (!location.pathname.startsWith("/lightning/r/Case/") || element.innerText !== "Contatos da conta") return;

    setTimeout(() => element.click(), 500);
});

onElements.per(
    ".uiModal.open.active:has(lightning-vertical-navigation-item.slds-is-active:nth-child(2)) .listDisplays th.selectionColumnHeader .slds-checkbox_faux",
    (element) => {
        if (!location.pathname.startsWith("/lightning/r/Case/")) return;

        setTimeout(() => element.click(), 500);
    },
);

onElements.per(
    ".uiModal.open.active:has(lightning-vertical-navigation-item.slds-is-active:nth-child(2)) .modal-footer button:nth-child(2):not([disabled])",
    (element) => {
        if (!location.pathname.startsWith("/lightning/r/Case/")) return;

        element.click();
    },
);

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
}
.popupActive {
    translate: -50% 2rem !important;
}
`);
