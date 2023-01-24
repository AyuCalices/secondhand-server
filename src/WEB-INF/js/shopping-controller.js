import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Shopping controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class ShoppingController extends Controller {
    #centerArticle;
    #searchResultSection;

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

        const templateOfferQuery = document.querySelector("head template.offer-query");
        const sectionOfferQuery = templateOfferQuery.content.cloneNode(true).firstElementChild;
        this.#centerArticle.append(sectionOfferQuery);

        const searchOffersButton = sectionOfferQuery.querySelector("div.offer-criteria button.search");
        searchOffersButton.addEventListener('click', () => this.searchOffers());

        const searchSellerButton = sectionOfferQuery.querySelector("div.seller-criteria button.search");
        searchSellerButton.addEventListener('click', () => this.searchSellers());

        this.#searchResultSection = document.createElement('section');
        this.#centerArticle.append(this.#searchResultSection);
        // const offers = await this.queryOffers();
        // this.updateOffersSection(offers);
    }

    async searchOffers() {
        const offerQueryParams = this.takeOfferQueryParamsFromInput();
        const offers = await this.queryOffers(offerQueryParams);
        this.displayQueriedOffers(offers);
    }

    async queryOffers(queryParams) {
        this.displayMessage("")
        try {
            const queryString = Object
                .keys(queryParams)
                .filter(key => queryParams[key] != null) // TODO: maybe don't even assign null values as you may want them to be sent in some cases
                .map(key => key + '=' + queryParams[key])
                .join('&');

            const headers = {"Content-Type": "application/json", "Accept": "application/json"};
            const response = await fetch("/services/offers?" + queryString, {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const offers = await response.json();
            // offers.sort((a, b) => b.created - a.created);
            // TODO: filter
            return offers;
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async displayQueriedOffers(offers) {
        this.displayMessage("");
        try {
            this.clearChildren(this.#searchResultSection);
            const templateAvailableOffers = document.querySelector("head template.available-offers");
            const sectionAvailableOffers = templateAvailableOffers.content.cloneNode(true).firstElementChild;
            this.#searchResultSection.append(sectionAvailableOffers);

            const offersTable = this.#searchResultSection.querySelector("section.available-offers table.offers");
            const tableBody = offersTable.querySelector("tbody");
            const templateOffersTableRow = document.querySelector("head template.available-offer-table-row");
            this.clearChildren(tableBody);

            for (const offer of offers) {
                const sectionOffersTableRow = templateOffersTableRow.content.cloneNode(true).firstElementChild;
                tableBody.append(sectionOffersTableRow)

                const rowCells = sectionOffersTableRow.querySelectorAll("td");
                const avatarImage = sectionOffersTableRow.querySelector("img.avatar");
                const avatarButton = sectionOffersTableRow.querySelector("button.select")
                avatarImage.src = "/services/offers/" + offer.identity + "/avatar" + "?cache-bust=" + Date.now();
                avatarButton.addEventListener('click', event => this.addToCart(offer));

                rowCells[1].append(offer.article.category);
                rowCells[2].append(offer.article.brand);
                rowCells[3].append(offer.article.alias);
                rowCells[4].append(offer.serial || "-");
                rowCells[5].append((offer.price * 0.01).toFixed(2));
                rowCells[6].append((offer.postage * 0.01).toFixed(2));
            }

        } catch (error) {
            this.displayMessage(error)
        }
    }

    takeOfferQueryParamsFromInput() {
        const section = this.#centerArticle.querySelector("section.offer-query");
        const offerQueryParams = {};

        offerQueryParams.category = section.querySelector("select.category").value.trim() || null;
        offerQueryParams.brand = section.querySelector("input.brand").value.trim() || null;
        offerQueryParams.alias = section.querySelector("input.name").value.trim() || null;
        offerQueryParams.description = section.querySelector("input.description").value.trim() || null;

        const minPriceInputValue = section.querySelector("input.min-price").value;
        if (minPriceInputValue) offerQueryParams.lowerPrice = Math.floor(parseFloat(minPriceInputValue) * 100);
        const maxPriceInputValue = section.querySelector("input.max-price").value;
        if (maxPriceInputValue) offerQueryParams.upperPrice = Math.floor(parseFloat(maxPriceInputValue) * 100);
        const minPostageInput = section.querySelector("input.min-postage").value;
        if (minPostageInput) offerQueryParams.lowerPostage = Math.floor(parseFloat(minPostageInput) * 100);
        const maxPostageInput = section.querySelector("input.max-postage").value;
        if (maxPostageInput) offerQueryParams.upperPostage = Math.floor(parseFloat(maxPostageInput) * 100);

        return offerQueryParams;
    }

    addToCart(offer) {
        Controller.shoppingCart.push(offer);
    }

    async querySellers(queryParams) {
        this.displayMessage("")
        try {
            // TODO: method for this
            const queryString = Object
                .keys(queryParams)
                .filter(key => queryParams[key] != null) // TODO: maybe don't even assign null values as you may want them to be sent in some cases
                .map(key => key + '=' + queryParams[key])
                .join('&');

            const headers = {"Content-Type": "application/json", "Accept": "application/json"};
            const response = await fetch("/services/people?" + queryString, {
                method: "GET", headers: headers, credentials: "include"
            });
            if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);

            const persons = await response.json();
            // offers.sort((a, b) => b.created - a.created);
            // TODO: filter
            return persons;
        } catch (error) {
            this.displayMessage(error);
        }
    }

    async searchSellers() {
        const sellerQueryParams = this.takeSellerQueryParamsFromInput();
        const sellers = await this.querySellers(sellerQueryParams);

        this.clearChildren(this.#searchResultSection);
        const templateSellerSelection = document.querySelector("head template.seller-selection");
        const sectionSellerSelection = templateSellerSelection.content.cloneNode(true).firstElementChild;
        this.#searchResultSection.append(sectionSellerSelection);

        const sellersTable = sectionSellerSelection.querySelector("table.seller-selection");
        const tableBody = sellersTable.querySelector("tbody");
        const templateSellersTableRow = document.querySelector("head template.seller-table-row");
        this.clearChildren(tableBody);

        for (const seller of sellers) {
            const sectionOffersTableRow = templateSellersTableRow.content.cloneNode(true).firstElementChild;
            tableBody.append(sectionOffersTableRow)

            const rowCells = sectionOffersTableRow.querySelectorAll("td");
            const avatarImage = sectionOffersTableRow.querySelector("img.avatar");
            const avatarButton = sectionOffersTableRow.querySelector("button.search")
            avatarImage.src = "/services/people/" + seller.identity + "/avatar" + "?cache-bust=" + Date.now();
            avatarButton.addEventListener('click', event => console.log("search offers for person"));

            rowCells[1].append(seller.email);
            rowCells[2].append(seller.name.given);
            rowCells[3].append(seller.name.family);
            rowCells[4].append(seller.address.postcode);
            rowCells[5].append(seller.address.street);
            rowCells[6].append(seller.address.city);
            rowCells[7].append(seller.address.country);
            rowCells[8].append(seller.account.iban);
            rowCells[9].append(seller.account.bic);
        }
    }

    takeSellerQueryParamsFromInput() {
        const section = this.#centerArticle.querySelector("section.offer-query");
        const sellerQueryParams = {};

        sellerQueryParams.title = section.querySelector("input.title").value.trim() || null;
        sellerQueryParams.givenName = section.querySelector("input.forename").value.trim() || null;
        sellerQueryParams.familyName = section.querySelector("input.surname").value.trim() || null;
        sellerQueryParams.city = section.querySelector("input.city").value.trim() || null;
        sellerQueryParams.country = section.querySelector("input.country").value.trim() || null;
        sellerQueryParams.bic = section.querySelector("input.bic").value.trim() || null;

        return sellerQueryParams;
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