import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Offers controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class OrderController extends Controller {
    #centerArticle;
    #interactiveSellerSection;
    #interactiveSellerOffersSection;

    // used to store the avatarReference when an image is being uploaded
    // before an offer is created and therefore can be linked to that avatar
    #reservedAvatarReference;

    /*
     * Initializes a new instance.
     */
    constructor () {
        super();
        this.#centerArticle = document.querySelector("main article.center");
        this.#interactiveSellerSection, this.#interactiveSellerOffersSection, this.#reservedAvatarReference = null;
    }

    /*
     * Activates this controller.
     */
    async activate () {
        this.clearChildren(this.#centerArticle);
        this.#interactiveSellerSection = null;

        const orders = await this.getOrders();

        const templateOwnOrders = document.querySelector("head template.own-orders");
        const sectionOwnOrders = templateOwnOrders.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOwnOrders);

        this.updateOrdersSection(orders)
    }

    async updateOrdersSection(orders) {
        const offersTable = this.#centerArticle.querySelector("section.own-orders table.orders");
        const tableBody = offersTable.querySelector("tbody");
        const templateOffersTableRow = document.querySelector("head template.own-order-table-row");
        this.clearChildren(tableBody);

        for (const order of orders) {
            const orderSeller = await this.getOrderSeller(order.identity);
            const offers = await this.getOrderOffers(order.identity);
            if (orderSeller != null && offers != null) {
                const sectionOffersTableRow = templateOffersTableRow.content.cloneNode(true).firstElementChild;
                tableBody.append(sectionOffersTableRow)

                const rowCells = sectionOffersTableRow.querySelectorAll("td");
                const rowImages = sectionOffersTableRow.querySelectorAll("img");

                rowImages[0].src = "/services/people/" + orderSeller.identity + "/avatar" + "?cache-bust=" + Date.now();
                rowImages[0].addEventListener('click', event => {
                    this.removeInteractiveSection();
                    this.displaySeller(orderSeller);
                    this.displaySellerOffers(offers);
                });

                let alias = "";
                let postage = 0;
                let price = 0;

                for (const offer of offers) {
                    alias += " " + offer.article.alias;
                    postage = Math.max(postage, offer.postage);
                    price += offer.price;
                }
                rowCells[1].append(alias);
                rowCells[2].append((postage * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €");
                rowCells[3].append((price * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €");
            }
        }
    }

    removeInteractiveSection() {
        if (this.#interactiveSellerSection) this.#centerArticle.removeChild(this.#interactiveSellerSection);
        if (this.#interactiveSellerOffersSection) this.#interactiveSellerOffersSection.remove();

        this.#interactiveSellerSection, this.#interactiveSellerOffersSection, this.#reservedAvatarReference = null;
    }

    async displaySeller(seller) {
        const templateSellerInfo = document.querySelector("head template.seller-display");
        const sectionSellerInfo = templateSellerInfo.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionSellerInfo);
        this.#interactiveSellerSection = sectionSellerInfo;

        sectionSellerInfo.querySelector("img.avatar").src = "/services/people/" + seller.identity + "/avatar" + "?cache-bust=" + Date.now();

        sectionSellerInfo.querySelector("input.name").value = seller.name.given + " " + seller.name.family;
        sectionSellerInfo.querySelector("input.email").value = seller.email;
        sectionSellerInfo.querySelector("input.street").value = seller.address.street;

        sectionSellerInfo.querySelector("input.city").value = seller.address.postcode + " " + seller.address.city;
        sectionSellerInfo.querySelector("input.country").value = seller.address.country;
        sectionSellerInfo.querySelector("input.bic").value = seller.account.bic;
        sectionSellerInfo.querySelector("input.iban").value = seller.account.iban;
    }

    async displaySellerOffers(offers) {
        const templateOffersInfo = document.querySelector("head template.offer-display");
        const sectionOffersInfo = templateOffersInfo.content.cloneNode(true).firstElementChild;

        for (const offer of offers) {
            this.#interactiveSellerSection.append(sectionOffersInfo);

            sectionOffersInfo.querySelector("img.avatar").src = "/services/offers/" + offer.identity + "/avatar" + "?cache-bust=" + Date.now();
            sectionOffersInfo.querySelector("input.category").value = offer.article.category;
            sectionOffersInfo.querySelector("input.item").value = offer.article.alias;
            sectionOffersInfo.querySelector("textarea.description").value = offer.article.description;

            sectionOffersInfo.querySelector("input.serial").value = offer.serial;
            sectionOffersInfo.querySelector("input.price").value = (offer.price * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €";
            sectionOffersInfo.querySelector("input.postage").value = (offer.postage * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €"
        }
    }

    async getOrderSeller(identity) {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept" : "application/json"};
            const response = await fetch("/services/orders/" + identity + "/seller", {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const seller = await response.json();
            return seller;
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async getOrderOffers(identity) {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept" : "application/json"};
            const response = await fetch("/services/orders/" + identity + "/offers", {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const seller = await response.json();
            return seller;
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async getOrders() {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept" : "application/json"};
            const response = await fetch("/services/people/" + Controller.sessionOwner.identity + "/orders", {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const orders = await response.json();
            orders.sort((a, b) => b.created - a.created);
            return orders;
        } catch (error) {
            this.displayMessage(error);
        }
    }
}

/*
 * Performs controller event listener registration during load event handling.
 */
window.addEventListener("load", event => {
    const controller = new OrderController();
    const controlElements = document.querySelectorAll("header button");

    for (let index = 0; index < controlElements.length; ++index) {
        const controlElement = controlElements[index];

        const eventHandler = event => controller.active = (index === 3) ;
        controlElement.addEventListener("click", eventHandler);
        controlElement.addEventListener("touchstart", eventHandler);
    }
});