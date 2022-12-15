import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Preferences controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class PreferencesController extends Controller {

    /*
     * Initializes a new instance.
     */
    constructor () {
        super();
    }


    /*
     * Activates this controller.
     */
    activate () {
        const centerArticle = document.querySelector("main article.center");
        this.clearChildren(centerArticle);

        const template = document.querySelector("head template.preferences");
        const section = template.content.cloneNode(true).firstElementChild;
        centerArticle.append(section);


        const sendButton = section.querySelector("button.send");
        const eventHandler = event => this.send();
        sendButton.addEventListener("click", eventHandler);
        sendButton.addEventListener("touchstart", eventHandler);

        // show data
        this.activateSessionOwner(template, section);

        // Controller.sessionOwner = null;
    }

    activateSessionOwner(template, section) {
        const sessionOwner = Controller.sessionOwner;
        const elements = section.querySelectorAll("img, input");

        console.log("session owner: ", sessionOwner);
        console.log(JSON.stringify(Controller.sessionOwner))

        //TODO: below seems to work ... (copied from skat)
        elements[0].src = "/services/documents/" + sessionOwner.avatarReference + "?cache-bust=" + Date.now();

        elements[1].value = sessionOwner.email;
        elements[2].value = "";
        elements[3].value = sessionOwner.name.title;
        elements[4].value = sessionOwner.name.given;
        elements[5].value = sessionOwner.name.family;
        elements[6].value = sessionOwner.group;
        elements[7].value = sessionOwner.address.street;
        elements[8].value = sessionOwner.address.postcode;
        elements[9].value = sessionOwner.address.city;
        elements[10].value = sessionOwner.address.country;
        elements[11].value = sessionOwner.account.bic;
        elements[12].value = sessionOwner.account.iban;


        //TODO: from skat viable ? test below for showing phone numbers!
        const phoneInputsDom = document.querySelectorAll("head template.preferences fieldset.phones input")
        const phoneInputsArray = Array.from(phoneInputsDom);
        phoneInputsArray.forEach(e => e.remove());

        for (const phone of sessionOwner.phones)
            this.activateSessionOwnerPhone(phone);
    }

    /**
     * Adds the given phone number to the list of phone numbers.
     */
    activateSessionOwnerPhone(phone) {

        const phoneFieldset = document.querySelector("main > head template.preferences > fieldset:nth-of-type(4)");

        const div = document.createElement("div");
        const input = document.createElement("input");
        input.value = phone;
        div.append(input);

        const buttonDiv = phoneFieldset.querySelector("div:last-of-type");
        buttonDiv.remove();
        phoneFieldset.append(div);
        phoneFieldset.append(buttonDiv);
    }


    /*
     * Authenticates email and password data.
     */
    async send () {
        this.displayMessage("send button clicked")
        const centerArticle = document.querySelector("main article.center");
        const emailElement = centerArticle.querySelector("input.email");
        const passwordElement = centerArticle.querySelector("input.password");

        // const email = emailElement.value.trim();
        // const password = passwordElement.value.trim();
        //
        // this.displayMessage();
        // try {
        //     const person = await xhr("/services/people/0", "GET", {"Accept": "application/json"}, null, "json", email, password);
        //     Controller.sessionOwner = person;
        //
        //     const controlElements = document.querySelectorAll("header button");
        //     for (const controlElement of controlElements)
        //         controlElement.disabled = false;
        //     controlElements[1].click();
        // } catch (error) {
        //     this.displayMessage(error);
        // }
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

    controlElements[0].click();
});