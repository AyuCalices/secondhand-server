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

        const templateOwnOffers = document.querySelector("head template.own-offers");
        const sectionOwnOffers = templateOwnOffers.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOwnOffers);

        const newButton = sectionOwnOffers.querySelector("button.new");
        newButton.addEventListener('click', () => this.displayEditSection(null));

        const offersTable = this.#centerArticle.querySelector("section.own-offers table.offers");
        const tableBody = offersTable.querySelector("tbody");
        console.log(tableBody);
        const templateOffersTableRow = document.querySelector("head template.own-offer-table-row");

        for (const offer of offers) {
            const sectionOffersTableRow = templateOffersTableRow.content.cloneNode(true).firstElementChild;
            console.log(sectionOffersTableRow);
            tableBody.append(sectionOffersTableRow) // FIXME append not a function
            console.log(offer);
            const rowCells = sectionOffersTableRow.querySelectorAll("td");
            rowCells[0].src = "/services/offers/" + offer.identity + "/avatar";
            rowCells[0].addEventListener('click', event => this.displayEditSection(offer));

            if (offer.buyerReference) rowCells[1].src = "/services/people/" + offer.buyerReference + "/avatar";

            rowCells[2].append(offer.article.category);
            rowCells[3].append(offer.article.brand);
            rowCells[4].append(offer.article.alias);
            if (offer.serial) rowCells[5].append(offer.serial);
            rowCells[6].append((offer.price * 0.01).toFixed(2));
            rowCells[7].append((offer.postage * 0.01).toFixed(2));
        }

        // TODO only load when offer is selected or 'new' button is clicked
        this.displayEditSection(offers[0]);

    }

    displayEditSection(offer) {
        const templateOwnOffer = document.querySelector("head template.own-offer");
        const sectionOwnOffer = templateOwnOffer.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOwnOffer);

        sectionOwnOffer.querySelector("img.avatar").src = "/services/offers/" + (offer.identity || 1) + "/avatar";
        const cancelButton = sectionOwnOffer.querySelector("button.cancel");
        cancelButton.addEventListener('click', () => {
            sectionOwnOffer.parentNode.removeChild(sectionOwnOffer);
        });
        const createOrUpdateButton = sectionOwnOffer.querySelector("button.create-or-update");
        createOrUpdateButton.addEventListener('click', event => this.sendCreatedOrUpdatedOffer(offer));

        if (offer == null) {
            createOrUpdateButton.append("create");
            return;
        }
        createOrUpdateButton.append("update");
        sectionOwnOffer.querySelector("select.category.article").value = offer.article.category;
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

    async sendCreatedOrUpdatedOffer(offer) {
        this.displayMessage("");
        try {
            console.log(offer);

            const section = this.#centerArticle.querySelector("section.own-offer");
            const offerClone = structuredClone(offer);

            offerClone.article.category = section.querySelector("select.category.article").value.trim();
            offerClone.article.brand = section.querySelector("input.brand.article").value.trim();
            offerClone.article.alias = section.querySelector("input.name.article").value.trim();
            offerClone.article.description = section.querySelector("textarea.description.article").value.trim();
            offerClone.serial = section.querySelector("input.serial.article").value.trim() || null;
            offerClone.price = Math.floor(parseFloat(section.querySelector("input.price.article.numeric").value) * 100);
            offerClone.postage = Math.floor(parseFloat(section.querySelector("input.postage.article.numeric").value) * 100);

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