import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Shopping controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class ShoppingController extends Controller {
    #centerArticle;
    #interactiveSection;

    // used to store the avatarReference when an image is being uploaded
    // before an offer is created and therefore can be linked to that avatar
    #reservedAvatarReference;

    /*
     * Initializes a new instance.
     */
    constructor () {
        super();
        this.#centerArticle = document.querySelector("main article.center");
        this.#interactiveSection, this.#reservedAvatarReference = null;
    }

    /*
     * Activates this controller.
     */
    async activate () {
        this.clearChildren(this.#centerArticle);
        this.#interactiveSection = null;

        const templateOfferQuery = document.querySelector("head template.offer-query");
        const sectionOfferQuery = templateOfferQuery.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOfferQuery);

        // const searchButton = sectionOfferQuery.querySelector("button.search");
        // searchButton.addEventListener('click', () => this.queryOffers());

        // const offers = await this.queryOffers();
        // this.updateOffersSection(offers);
    }

    updateOffersSection(offers) {
        const offersTable = this.#centerArticle.querySelector("section.own-offers table.offers");
        const tableBody = offersTable.querySelector("tbody");
        const templateOffersTableRow = document.querySelector("head template.own-offer-table-row");
        this.clearChildren(tableBody);

        for (const offer of offers) {
            const sectionOffersTableRow = templateOffersTableRow.content.cloneNode(true).firstElementChild;
            tableBody.append(sectionOffersTableRow)

            const rowCells = sectionOffersTableRow.querySelectorAll("td");
            const rowImages = sectionOffersTableRow.querySelectorAll("img");
            rowImages[0].src = "/services/offers/" + offer.identity + "/avatar" + "?cache-bust=" + Date.now();
            rowImages[0].addEventListener('click', event => this.displayOfferInInteractiveSection(offer));

            if (offer.buyerReference) {
                rowImages[1].src = "/services/people/" + offer.buyerReference + "/avatar" + "?cache-bust=" + Date.now();
                rowImages[1].addEventListener('click', event => this.displayBuyerAndOrderInInteractiveSection(offer.buyerReference, offer.identity));
            }

            rowCells[2].append(offer.article.category);
            rowCells[3].append(offer.article.brand);
            rowCells[4].append(offer.article.alias);
            rowCells[5].append(offer.serial || "-");
            rowCells[6].append((offer.price * 0.01).toFixed(2));
            rowCells[7].append((offer.postage * 0.01).toFixed(2));
        }
    }

    displayOfferInInteractiveSection(offer) {
        if (this.#interactiveSection) this.removeInteractiveSection();

        const templateOwnOffer = document.querySelector("head template.own-offer");
        const sectionOwnOffer = templateOwnOffer.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOwnOffer);
        this.#interactiveSection = sectionOwnOffer;

        const cancelButton = sectionOwnOffer.querySelector("button.cancel");
        cancelButton.addEventListener('click', event => this.removeInteractiveSection());
        const createOrUpdateButton = sectionOwnOffer.querySelector("button.create-or-update");
        createOrUpdateButton.addEventListener('click', event => this.sendCreatedOrUpdatedOffer(offer));

        const avatarImage = sectionOwnOffer.querySelector("img.avatar");
        avatarImage.addEventListener("drop", event => this.sendAvatar(event.dataTransfer.files[0], offer));

        if (offer == null) {
            createOrUpdateButton.append("create");
            avatarImage.src = "/services/documents/1";
            return;
        }
        createOrUpdateButton.append("update");
        avatarImage.src = "/services/offers/" + offer.identity + "/avatar" + "?cache-bust=" + Date.now();
        sectionOwnOffer.querySelector("select.category.article").value = offer.article.category;
        sectionOwnOffer.querySelector("input.brand.article").value = offer.article.brand;
        sectionOwnOffer.querySelector("input.name.article").value = offer.article.alias;
        sectionOwnOffer.querySelector("textarea.description.article").value = offer.article.description;
        sectionOwnOffer.querySelector("input.serial.article").value = offer.serial || "";
        sectionOwnOffer.querySelector("input.price.article.numeric").value = (offer.price * 0.01).toFixed(2);
        sectionOwnOffer.querySelector("input.postage.article.numeric").value = (offer.postage * 0.01).toFixed(2);
    }

    removeInteractiveSection() {
        this.#centerArticle.removeChild(this.#interactiveSection);
        this.#interactiveSection, this.#reservedAvatarReference = null;
    }

    async queryOffers() {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept" : "application/json"};
            const response = await fetch("/services/people/" + Controller.sessionOwner.identity + "/offers", {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const offers = await response.json();
            offers.sort((a, b) => b.created - a.created);
            return offers;
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async sendCreatedOrUpdatedOffer(offer) {
        this.displayMessage("");
        try {
            const section = this.#centerArticle.querySelector("section.own-offer");

            const offerDTO = offer != null ? structuredClone(offer) : {identity: 0, version: 1};
            if (offer == null) offerDTO.article = {};

            offerDTO.article.category = section.querySelector("select.category").value.trim();
            offerDTO.article.brand = section.querySelector("input.brand").value.trim();
            offerDTO.article.alias = section.querySelector("input.name").value.trim();
            offerDTO.article.description = section.querySelector("textarea.description").value.trim();
            offerDTO.serial = section.querySelector("input.serial").value.trim() || null;
            offerDTO.price = Math.floor(parseFloat(section.querySelector("input.price").value) * 100);
            offerDTO.postage = Math.floor(parseFloat(section.querySelector("input.postage").value) * 100);

            const headers = {"Content-Type": "application/json", "Accept" : "text/plain"};
            const requestUrlPath = this.#reservedAvatarReference != null ?
                "/services/offers?avatarReference=" + this.#reservedAvatarReference :
                "/services/offers";
            const response = await fetch(requestUrlPath, {
                method: "POST", headers: headers, body: JSON.stringify(offerDTO), credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
            this.#reservedAvatarReference = null;

            const offers = await this.queryOffers();
            this.updateOffersSection(offers);
        } catch (error) {
            this.displayMessage(error)
        }
    }

    async sendAvatar(avatarFile, offer) {
        this.displayMessage("");
        try {
            const avatarImage = document.querySelector("section.own-offer img.avatar");
            let response, headers;

            headers = {"Content-Type": avatarFile.type, "Accept": "text/plain"};
            response = await fetch("/services/documents", {
                method: "POST", credentials: "include", headers: headers, body: avatarFile
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
            const avatarReference = parseInt(await response.text());

            if (offer == null) {
                this.#reservedAvatarReference = avatarReference;
            } else {
                headers = {"Content-Type": "application/json", "Accept": "text/plain"};
                response = await fetch("/services/offers?avatarReference=" + avatarReference, {
                    method: "POST", credentials: "include", headers: headers, body: JSON.stringify(offer)
                });
                if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

                avatarImage.src = "/services/documents/" + avatarReference + "?cache-bust=" + Date.now();
            }
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async queryBuyer(buyerId) {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept": "application/json"};
            const response = await fetch("/services/people/" + buyerId, {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            return await response.json();
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async queryOrder(offerId) {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept": "application/json"};
            const response = await fetch("/services/offers/" + offerId + "/order", {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            return await response.json();
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async displayBuyerAndOrderInInteractiveSection(buyerId, offerId) {
        if (this.#interactiveSection) this.removeInteractiveSection();

        const buyer = await this.queryBuyer(buyerId);
        const templateBuyerInfo = document.querySelector("head template.buyer-display");
        const sectionBuyerInfo = templateBuyerInfo.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionBuyerInfo);
        this.#interactiveSection = sectionBuyerInfo;

        sectionBuyerInfo.querySelector("input.email.personal").value = buyer.email;
        sectionBuyerInfo.querySelector("input.title.personal").value = buyer.name.title;
        sectionBuyerInfo.querySelector("input.forename.personal").value = buyer.name.given;
        sectionBuyerInfo.querySelector("input.surname.personal").value = buyer.name.family;

        sectionBuyerInfo.querySelector("input.street.address").value = buyer.address.street;
        sectionBuyerInfo.querySelector("input.postcode.address").value = buyer.address.postcode;
        sectionBuyerInfo.querySelector("input.city.address").value = buyer.address.city;
        sectionBuyerInfo.querySelector("input.country.address").value = buyer.address.country;

        sectionBuyerInfo.querySelector("input.bic.account").value = buyer.account.bic;
        sectionBuyerInfo.querySelector("input.iban.account").value = buyer.account.iban;

        for (const phone of buyer.phones) {
            const phonesDiv = sectionBuyerInfo.querySelector("div.phones");
            const phoneDiv = document.createElement("div");
            const phoneInput = document.createElement("input");
            phoneInput.type = "text";
            phoneInput.value = phone;
            phoneInput.disabled = true
            phoneDiv.append(phoneInput);
            phonesDiv.append(phoneDiv);
        }

        const order = await this.queryOrder(offerId);
        sectionBuyerInfo.querySelector("input.date.order").value = new Date(order.created).toISOString().split('T')[0];
        sectionBuyerInfo.querySelector("input.date.payment").value = new Date(order.payed).toISOString().split('T')[0];
        sectionBuyerInfo.querySelector("input.date.departure").value = new Date(order.departed).toISOString().split('T')[0];
        sectionBuyerInfo.querySelector("input.tracking.order").value = order.trackingReference;

        sectionBuyerInfo.querySelector("button.update").addEventListener('click', event => this.sendUpdatedOrder(order));
    }

    async sendUpdatedOrder(order) {
        this.displayMessage("");
        try {
            const section = this.#centerArticle.querySelector("section.buyer-display");

            const orderDTO = structuredClone(order)
            const paymentInput = section.querySelector("input.date.payment").value.trim()
            orderDTO.payed = paymentInput ? Date.parse(paymentInput) : null;
            const departureInput = section.querySelector("input.date.departure").value.trim()
            orderDTO.departed = departureInput ? Date.parse(departureInput) : null;
            orderDTO.trackingReference = section.querySelector("input.tracking").value.trim() || null;

            const headers = {"Content-Type": "application/json", "Accept": "text/plain"};
            const response = await fetch("/services/orders", {
                method: "POST", headers: headers, body: JSON.stringify(orderDTO), credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
        } catch (error) {
            this.displayMessage(error)
        }
    }
}

/*
 * Performs controller event listener registration during load event handling.
 */
window.addEventListener("load", event => {
    const controller = new ShoppingController();
    const controlElements = document.querySelectorAll("header button");

    for (let index = 0; index < controlElements.length; ++index) {
        const controlElement = controlElements[index];

        const eventHandler = event => controller.active = (index === 4) ;
        controlElement.addEventListener("click", eventHandler);
        controlElement.addEventListener("touchstart", eventHandler);
    }
});