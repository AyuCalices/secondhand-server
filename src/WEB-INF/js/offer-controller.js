import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Offers controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class OfferController extends Controller {
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
    async activate () {
        this.clearChildren(this.#centerArticle);

        const offers = await this.getOffers();

        const templateOwn = document.querySelector("head template.own-offers");
        const sectionOwn = templateOwn.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOwn);

        offers.forEach(offer => {

            // const templateOwnRow = document.querySelector("head template.own-offer-table-row");
            // const sectionOwnRow = templateOwnRow.content.cloneNode(true).firstElementChild;
            // const sectionTables = sectionOwn.querySelectorAll("table");
            // const sectionTable = sectionTables[0];
            // const table = sectionTable.getElementsByTagName("tbody");
            // table.appendChild(sectionOwnRow); // FIXME appendChild not a function

            // const rowCells = sectionOwnRow.querySelectorAll("td");
            //     rowCells[0].src = "/services/offers/" + (offer.identity || 1) + "/avatar";
            //     rowCells[1].innerHTML = offer.article.brand;
            //     rowCells[2].innerHTML = offer.article.alias;
            //     // rowCells[3].innerHTML = offer.article.alias;
            //     rowCells[4].innerHTML = offer.price;
            //     rowCells[5].innerHTML = offer.postage;

        });

        // TODO only load when offer is selected or 'new' button is clicked
        this.loadEditSection(offers[0]);

        const newButton = sectionOwn.querySelector("button.new");
        newButton.addEventListener('click', () => this.loadEditSection(null));

    }

    loadEditSection(offer) {
        const templateOwnOffer = document.querySelector("head template.own-offer");
        const sectionOwnOffer = templateOwnOffer.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOwnOffer);

        sectionOwnOffer.querySelector("img.avatar").src = "/services/offers/" + (offer.identity || 1) + "/avatar";
        const createOrUpdateButton = sectionOwnOffer.querySelector("button.create-or-update");
        createOrUpdateButton.currentOffer = offer;
        createOrUpdateButton.addEventListener('click', event => this.sendCreatedOrUpdatedOffer(event));

        if (offer == null) {
            createOrUpdateButton.innerHTML = "create";
            return;
        }
        createOrUpdateButton.innerHTML = "update";
        sectionOwnOffer.querySelector("input.category.article").value = offer.article.category;
        sectionOwnOffer.querySelector("input.brand.article").value = offer.article.brand;
        sectionOwnOffer.querySelector("input.name.article").value = offer.article.alias;
        sectionOwnOffer.querySelector("textarea.description.article").value = offer.article.description;
        sectionOwnOffer.querySelector("input.serial.article").value = offer.serial;
        sectionOwnOffer.querySelector("input.price.article.numeric").value = offer.price;
        sectionOwnOffer.querySelector("input.postage.article.numeric").value = offer.postage;
    }

    async getOffers() {
        const headers = {"Content-Type": "application/json", "Accept" : "application/json"};
        const response = await fetch("/services/people/" + Controller.sessionOwner.identity + "/offers", {
            method: "GET", headers: headers, credentials: "include"
        });
        if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

        return await response.json();
    }

    async sendCreatedOrUpdatedOffer(event) {
        this.displayMessage("");
        try {
            console.log(event.currentTarget.currentOffer);

            const section = this.#centerArticle.querySelector("section.own-offer");
            const offerClone = structuredClone(event.currentTarget.currentOffer);

            offerClone.article.category = section.querySelector("input.category.article").value.trim();
            offerClone.article.brand = section.querySelector("input.brand.article").value.trim();
            offerClone.article.alias = section.querySelector("input.name.article").value.trim();
            offerClone.article.description = section.querySelector("textarea.description.article").value.trim();
            offerClone.serial = section.querySelector("input.serial.article").value.trim() || null;
            offerClone.price = section.querySelector("input.price.article.numeric").value.trim();
            offerClone.postage = section.querySelector("input.postage.article.numeric").value.trim();

            const headers = {"Content-Type": "application/json", "Accept" : "text/plain"};
            const response = await fetch("/services/offers/", {
                method: "POST", headers: headers, body: JSON.stringify(offerClone), credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

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
    const controller = new OfferController();
    const controlElements = document.querySelectorAll("header button");

    for (let index = 0; index < controlElements.length; ++index) {
        const controlElement = controlElements[index];

        const eventHandler = event => controller.active = (index === 2) ;
        controlElement.addEventListener("click", eventHandler);
        controlElement.addEventListener("touchstart", eventHandler);
    }
});