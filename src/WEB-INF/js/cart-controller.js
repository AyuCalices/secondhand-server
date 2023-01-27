import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Cart controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
export default class CartController extends Controller {
    #centerArticle;
    #interactiveSellerSection

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

        await this.updateShoppingCart();
    }

    clearPage() {
        this.clearChildren(this.#centerArticle);
    }

    async updateShoppingCart() {
        const shoppingCartMap = this.getShoppingCartMap();

        for (const [key, value] of Object.entries(shoppingCartMap)) {
            const offerSeller = await this.getPerson(key);
            if (offerSeller != null) {
                const templateShoppingCart = document.querySelector("template.shopping-cart");
                const sectionShoppingCart = templateShoppingCart.content.cloneNode(true).firstElementChild;
                this.#centerArticle.append(sectionShoppingCart);

                const sectionShoppingCartEntries = sectionShoppingCart.querySelector("section.shopping-cart");

                this.displaySeller(offerSeller, sectionShoppingCartEntries);
                this.displayShoppingCartElements(value, sectionShoppingCartEntries);
                this.displayOrderView(value, sectionShoppingCartEntries);
            }
        }
    }

    getShoppingCartMap() {
        var map = {};
        for (const offer of Controller.shoppingCart) {
            const sellerReference = offer.sellerReference;
            if (sellerReference.toString() in map) {
                map[sellerReference].push(offer);
            } else {
                map[sellerReference] = [offer];
            }
        }

        return map;
    }

    async getPerson(identity) {
        this.displayMessage("")
        try {
            const headers = {"Content-Type": "application/json", "Accept" : "application/json"};
            const response = await fetch("/services/people/" + identity, {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const seller = await response.json();
            return seller;
        } catch (error) {
            this.displayMessage(error);
        }
    }

    displaySeller(seller, sectionShoppingCartEntries) {
        const templateSellerInfo = document.querySelector("template.seller-display");
        const sectionSellerInfo = templateSellerInfo.content.cloneNode(true).firstElementChild;
        sectionShoppingCartEntries.append(sectionSellerInfo);
        sectionSellerInfo.querySelector("div.avatar").removeChild(sectionSellerInfo.querySelector("label"));
        sectionSellerInfo.querySelector("img.avatar").src = "/services/people/" + seller.identity + "/avatar" + "?cache-bust=" + Date.now();

        sectionSellerInfo.querySelector("input.name").value = seller.name.given + " " + seller.name.family;
        sectionSellerInfo.querySelector("input.email").value = seller.email;
        sectionSellerInfo.querySelector("input.street").value = seller.address.street;

        sectionSellerInfo.querySelector("input.city").value = seller.address.postcode + " " + seller.address.city;
        sectionSellerInfo.querySelector("input.country").value = seller.address.country;
        sectionSellerInfo.querySelector("input.bic").value = seller.account.bic;
        sectionSellerInfo.querySelector("input.iban").value = seller.account.iban;
    }

    displayShoppingCartElements(shoppingCartOffers, sectionShoppingCartEntries) {
        const templateOffersTable = document.querySelector("template.cart-offer-display-table");
        const sectionOffersTable = templateOffersTable.content.cloneNode(true).firstElementChild;
        sectionShoppingCartEntries.append(sectionOffersTable);

        const offersTable = sectionOffersTable.querySelector("table.offers");
        const tableBody = offersTable.querySelector("tbody");
        const templateOffersTableRow = document.querySelector("template.cart-offer-display-table-row");

        for (const shoppingCartOffer of shoppingCartOffers) {
            const sectionOffersTableRow = templateOffersTableRow.content.cloneNode(true).firstElementChild;
            tableBody.append(sectionOffersTableRow);

            const removeFromCartButton = sectionOffersTableRow.querySelector("button.remove");
            removeFromCartButton.addEventListener('click', async event => this.removeOffer(shoppingCartOffer));

            const rowCells = sectionOffersTableRow.querySelectorAll("td");
            const rowImages = sectionOffersTableRow.querySelectorAll("img");

            rowImages[0].src = "/services/offers/" + shoppingCartOffer.identity + "/avatar" + "?cache-bust=" + Date.now();
            rowCells[1].append(shoppingCartOffer.article.category);
            rowCells[2].append(shoppingCartOffer.article.brand);
            rowCells[3].append(shoppingCartOffer.article.alias);
            rowCells[4].append(shoppingCartOffer.serial);
            rowCells[5].append((shoppingCartOffer.price * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €");
            rowCells[6].append((shoppingCartOffer.postage * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €");
        }
    }

    displayOrderView(offers, sectionShoppingCartEntries) {
        const templateSellerInfo = document.querySelector("template.seller-order-display");
        const sectionSellerInfo = templateSellerInfo.content.cloneNode(true).firstElementChild;

        sectionShoppingCartEntries.append(sectionSellerInfo);

        let postage = 0;
        let price = 0;

        for (const offer of offers) {
            postage = Math.max(postage, offer.postage);
            price += offer.price;
        }

        sectionSellerInfo.querySelector("input.priceSum").value = (price * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €";
        sectionSellerInfo.querySelector("input.postage").value = (postage * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €";
        sectionSellerInfo.querySelector("input.total").value = ((price + postage) * 0.01).toFixed(2).toString().replaceAll(".", ",") + " €";
        sectionSellerInfo.querySelector("button.order-now").addEventListener('click', async event => await this.orderAll(offers));
    }

    async removeOffer(offer) {
        const index = Controller.shoppingCart.findIndex(element => element.identity === offer.identity);
        if (index !== -1) Controller.shoppingCart.splice(index, 1);
        this.clearPage();
        await this.updateShoppingCart();
    }

    async orderAll(offers) {
        this.displayMessage("");
        try {
            const headers = {"Content-Type": "application/json", "Accept": "text/plain"};
            const queryParams = new URLSearchParams();
            for (const offer of offers)
                queryParams.append("offerReference", offer.identity);
            const order = {};

            const response = await fetch("/services/orders?" + queryParams.toString(), {
                method: "POST", headers: headers, body: JSON.stringify(order), credentials: "include"
            });

            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
            for (const offer of offers) {
                const index = Controller.shoppingCart.findIndex(element => element.identity === offer.identity);
                if (index !== -1) delete Controller.shoppingCart[index];
            }
        } catch (error) {
            this.displayMessage(error)
        }

        this.clearPage();
        await this.updateShoppingCart();
    }
}

/*
 * Performs controller event listener registration during load event handling.
 */
window.addEventListener("load", event => {
    const controller = new CartController();
    const controlElements = document.querySelectorAll("header button");

    for (let index = 0; index < controlElements.length; ++index) {
        const controlElement = controlElements[index];

        const eventHandler = event => controller.active = (index === 5) ;
        controlElement.addEventListener("click", eventHandler);
        controlElement.addEventListener("touchstart", eventHandler);
    }
});