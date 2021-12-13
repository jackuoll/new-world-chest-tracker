const renderModalButtons = (buttons) => {
    if (!buttons) {
        return "";
    }
    let renderedButtons = "";
    let numberButtons = 0;
    Object.keys(buttons).forEach((key) => {
        const buttonId = `modal-button-${numberButtons}`;
        const extraClasses = buttons[key].classes;
        renderedButtons += `<button class="button ${extraClasses ? extraClasses : ''}" id="${buttonId}">${key}</button>`;
        numberButtons++;
    })
    return renderedButtons;
};
const assignButtonCallbacks = (buttons) => {
    if (!buttons) {
        return;
    }
    let numberButtons = 0;
    Object.keys(buttons).forEach((key) => {
        const buttonId = `modal-button-${numberButtons}`;
        numberButtons++;
        const elem = document.getElementById(buttonId);
        elem.addEventListener("click", () => {
            buttons[key].callback();
        })
    })
}
const createModal = ({buttons, title, content, icon, closeCallback, customWidth}) => {
    const defaultButtons = {
        "Close": {
            callback: () => {
                removeModal();
            },
            classes: "is-link",
        }
    }
    buttons = buttons || defaultButtons;
    const body = document.body;
    const elem = document.createElement("div");
    elem.innerHTML = `
        <div class="modal is-active" id="active-modal">
          <div class="modal-background"></div>
          <div class="modal-card" style="width: ${customWidth ? customWidth: 640}px;">
            <header class="modal-card-head">
              <p class="modal-card-title" id="modal-title">${title ? title : "Info"}</p>
              <button class="delete" aria-label="close" id="close-active-modal"></button>
            </header>
            <section class="modal-card-body">
              ${content ? content : ""}
            </section>
            <footer class="modal-card-foot">
              ${renderModalButtons(buttons)}
            </footer>
          </div>
        </div>
    `;
    body.appendChild(elem);
    const close = document.getElementById("close-active-modal");
    close.addEventListener("click", () => {
        if (closeCallback) {
            closeCallback();
        }
        removeModal();
    });
    assignButtonCallbacks(buttons);
};

const removeModal = () => {
    const am = document.getElementById("active-modal").remove();
};
