import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Preferences controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class PreferencesController extends Controller {
    #centerArticle;

    /*
     * Initializes a new instance.
     */
    constructor () {
        super();
        this.#centerArticle = document.querySelector("main article.center");
    }


    /*
     * Activates this controller.
     */
    activate () {
        this.clearChildren(this.#centerArticle);

        const template = document.querySelector("head template.preferences");
        const section = template.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(section);

        const avatarImage = section.querySelector("img.avatar")
        avatarImage.addEventListener("drop", event => this.sendAvatar(event.dataTransfer.files[0]));

        const sendButton = section.querySelector("button.send");
        const eventHandler = event => this.sendSessionOwner();
        sendButton.addEventListener("click", eventHandler);
        sendButton.addEventListener("touchstart", eventHandler);

        const addButton = section.querySelector("button.add");
        addButton.addEventListener("click", event => this.addSessionOwnerPhone(""));

        // show data
        this.activateSessionOwner(section);

        // Controller.sessionOwner = null;
    }

    activateSessionOwner(section) {
        const sessionOwner = Controller.sessionOwner;
        const elements = section.querySelectorAll("img, input");

        elements[0].src = "/services/documents/" + sessionOwner.avatarReference;

        elements[1].value = sessionOwner.email;
        elements[2].value = "";
        elements[3].value = sessionOwner.name.title || "";
        elements[4].value = sessionOwner.name.given;
        elements[5].value = sessionOwner.name.family;
        elements[6].value = sessionOwner.group;
        elements[7].value = sessionOwner.address.street;
        elements[8].value = sessionOwner.address.postcode;
        elements[9].value = sessionOwner.address.city;
        elements[10].value = sessionOwner.address.country;
        elements[11].value = sessionOwner.account.bic;
        elements[12].value = sessionOwner.account.iban;

        const phoneInputs = Array.from(section.querySelectorAll("div.phones input"));
        phoneInputs.forEach(e => e.remove());

        for (const phone of sessionOwner.phones)
            this.addSessionOwnerPhone(phone);
    }

    /**
     * Adds the given phone number to the list of phone numbers.
     */
    addSessionOwnerPhone(phone) {
        const phonesDiv = this.#centerArticle.querySelector("section.preferences div.phones");

        const phoneDiv = document.createElement("div");
        const phoneInput = document.createElement("input");
        phoneInput.type = "text";
        phoneInput.value = phone;
        phoneDiv.append(phoneInput);
        phonesDiv.append(phoneDiv);
    }

    /*
     * Authenticates email and password data.
     */
    async sendSessionOwner () {
        this.displayMessage("");
        try {
            const section = this.#centerArticle.querySelector("section.preferences");
            const elements = section.querySelectorAll("img, input");
            const password = elements[2].value.trim() || null;

            const sessionOwnerClone = structuredClone(Controller.sessionOwner);
            sessionOwnerClone.email = elements[1].value.trim();
            sessionOwnerClone.name.title = elements[3].value.trim() || null;
            sessionOwnerClone.name.given = elements[4].value.trim();
            sessionOwnerClone.name.family = elements[5].value.trim();
            sessionOwnerClone.group = elements[6].value.trim();
            sessionOwnerClone.address.street = elements[7].value.trim();
            sessionOwnerClone.address.postcode = elements[8].value.trim();
            sessionOwnerClone.address.city = elements[9].value.trim();
            sessionOwnerClone.address.country = elements[10].value.trim();
            sessionOwnerClone.account.bic = elements[11].value.trim();
            sessionOwnerClone.account.iban = elements[12].value.trim();

            const phoneInputs = section.querySelectorAll("div.phones input");
            sessionOwnerClone.phones.length = 0;

            for (const inputField of phoneInputs)
                if (inputField.value.trim()) sessionOwnerClone.phones.push(inputField.value.trim());

            const headers = {"Content-Type": "application/json", "Accept" : "text/plain"};
            if (password) headers["X-Set-Password"] = password;

            const response = await fetch("/services/people/", {
                method: "POST", headers: headers, body: JSON.stringify(sessionOwnerClone), credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            if (password)
                Controller.sessionOwner = await xhr("/services/people/0", "GET", {"Accept": "application/json"}, null, "json", sessionOwnerClone.email, password);
            else
                Controller.sessionOwner = sessionOwnerClone;

            this.activateSessionOwner(section);
        } catch (error) {
            this.displayMessage(error)
        }
    }

    async sendAvatar(avatarFile) {
        this.displayMessage("");
        try {
            const avatarImage = document.querySelector("section.preferences img.avatar");
            let response, headers;

            headers = {"Content-Type": avatarFile.type, "Accept": "text/plain"};
            response = await fetch("/services/documents", {
                method: "POST", credentials: "include", headers: headers, body: avatarFile
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
            const avatarReference = parseInt(await response.text());

            headers = {"Content-Type": "application/json", "Accept": "text/plain"};
            response = await fetch("/services/people?avatarReference=" + avatarReference, {
                method: "POST", credentials: "include", headers: headers, body: JSON.stringify(Controller.sessionOwner)
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            //avatarImage.src = "/services/documents/" + avatarReference + "?cache-bust=" + Date.now();
            avatarImage.src = "/services/documents/" + avatarReference;
            Controller.sessionOwner.avatarReference = avatarReference;
        } catch (error) {
            this.displayMessage(error);
        }
    }

}


/*
 * Performs controller event listener registration during load event handling.
 */
window.addEventListener("load", event => {
    const controller = new PreferencesController();
    const controlElements = document.querySelectorAll("header button");

    for (let index = 0; index < controlElements.length; ++index) {
        const controlElement = controlElements[index];

        const eventHandler = event => controller.active = (index === 1) ;
        controlElement.addEventListener("click", eventHandler);
        controlElement.addEventListener("touchstart", eventHandler);
    }
});