import Controller from "./controller.js"
import xhr from "./xhr.js"


/*
 * Authentication controller type.
 * Copyright (c) 2022 Sascha Baumeister
 */
class AuthenticationController extends Controller {

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

		const template = document.querySelector("head template.authentication");
		const section = template.content.cloneNode(true).firstElementChild;
		centerArticle.append(section);

		const loginButton = section.querySelector("button.login");
		const eventHandler = event => this.login();
		loginButton.addEventListener("click", eventHandler);
		loginButton.addEventListener("touchstart", eventHandler);

		Controller.sessionOwner = null;
	}


	/*
	 * Authenticates email and password data.
	 */
	async login () {
		const centerArticle = document.querySelector("main article.center");
		const emailElement = centerArticle.querySelector("input.email");
		const passwordElement = centerArticle.querySelector("input.password");

		const email = emailElement.value.trim();
		const password = passwordElement.value.trim();

		this.displayMessage();
		try {
			const person = await xhr("/services/people/0", "GET", {"Accept": "application/json"}, null, "json", email, password);
			Controller.sessionOwner = person;

			const controlElements = document.querySelectorAll("header button");
			for (const controlElement of controlElements)
				controlElement.disabled = false;
			controlElements[1].click();
		} catch (error) {
			this.displayMessage(error);
		}
	}
}


/*
 * Performs controller event listener registration during load event handling.
 */
window.addEventListener("load", event => {
	const controller = new AuthenticationController();
	const controlElements = document.querySelectorAll("header button");

	for (let index = 0; index < controlElements.length; ++index) {
		const controlElement = controlElements[index];

		const eventHandler = event => controller.active = (index === 0) ;
		controlElement.addEventListener("click", eventHandler);
		controlElement.addEventListener("touchstart", eventHandler);
	}

	controlElements[0].click();
});