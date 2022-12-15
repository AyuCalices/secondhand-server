import Controller from "./controller.js";
import xhr from "./xhr.js";


export default class PreferencesController extends MenuController {


	constructor() {
		super();
	}

	display() {
		if (!Controller.sessionOwner) {
			document.querySelector("header li:first-of-type > a").click();
			return;
		}

		super.display();
		this.displayError();
		try {
			const section = document.querySelector("#preferences-template").content.cloneNode(true).firstElementChild;
			document.querySelector("main").append(section);

			const buttons = section.querySelectorAll("button");
			buttons[0].addEventListener("click", event => this.displaySessionOwnerPhone(""));
			buttons[1].addEventListener("click", event => this.storeSessionOwner());

			const image = section.querySelector("img")
			image.addEventListener("drop", event => this.storeSessionOwnerAvatar(event.dataTransfer.files[0]));

			this.displaySessionOwner();
		} catch (error) {
			this.displayError(error);
		}
	}


	async displaySessionOwner() {
		const sessionOwner = Controller.sessionOwner;
		const section = document.querySelector("section.preferences");
		const elements = section.querySelectorAll("img, input");

		elements[0].src = "/services/documents/" + sessionOwner.avatarReference + "?cache-bust=" + Date.now();
		elements[1].value = sessionOwner.email;
		elements[2].value = "";
		elements[3].value = sessionOwner.group;
		elements[4].value = sessionOwner.name.title ?? "";
		elements[5].value = sessionOwner.name.forename;
		elements[6].value = sessionOwner.name.surname;
		elements[7].value = sessionOwner.address.street;
		elements[8].value = sessionOwner.address.postcode;
		elements[9].value = sessionOwner.address.city;
		elements[10].value = sessionOwner.address.country;

		const phoneInputsDom = document.querySelectorAll("section.preferences fieldset.phones input")
		const phoneInputsArray = Array.from(phoneInputsDom);
		phoneInputsArray.forEach(e => e.remove());

		for (const phone of sessionOwner.phones)
			this.displaySessionOwnerPhone(phone);
			
	}


	displaySessionOwnerPhone(phone) {
		const phoneFieldset = document.querySelector("main > section.preferences > fieldset:nth-of-type(4)");

		const div = document.createElement("div");
		const input = document.createElement("input");
		input.value = phone;
		div.append(input);

		const buttonDiv = phoneFieldset.querySelector("div:last-of-type");
		buttonDiv.remove();
		phoneFieldset.append(div);
		phoneFieldset.append(buttonDiv);
	}


	async storeSessionOwner() {
		this.displayError();
		try {
			const section = document.querySelector("section.preferences");
			const elements = section.querySelectorAll("img, input");
			const password = elements[2].value.trim();
			const copiedSessionOwner = JSON.parse(JSON.stringify(Controller.sessionOwner));
			copiedSessionOwner.email = elements[1].value.trim();
			copiedSessionOwner.group = elements[3].value.trim();
			copiedSessionOwner.name.title = elements[4].value.trim();
			copiedSessionOwner.name.forename = elements[5].value.trim();
			copiedSessionOwner.name.surname = elements[6].value.trim();
			copiedSessionOwner.address.street = elements[7].value.trim();
			copiedSessionOwner.address.postcode = elements[8].value.trim();
			copiedSessionOwner.address.city = elements[9].value.trim();
			copiedSessionOwner.address.country = elements[10].value.trim();
			const phoneInputs = document.querySelectorAll("section.preferences fieldset.phones input");
			copiedSessionOwner.phones.length = 0;

			for (const inputField of phoneInputs)
				if (inputField.value) copiedSessionOwner.phones.push(inputField.value.trim());

			const headers = { "Content-Type": "application/json" };
			if (password) headers["X-Set-Password"] = password;

			const response = await fetch("/services/people", { method: "POST", headers: headers, body: JSON.stringify(copiedSessionOwner), credentials: "include" });
			if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
			
			if (password)
				Controller.sessionOwner = await xhr("/services/people/0", "GET", { "Content-Type": "application/json" }, null, "json", copiedSessionOwner.email, password);
			else
				Controller.sessionOwner.version += 1;
			this.displaySessionOwner();
		} catch (error) {
			document.querySelector("header li:first-of-type > a").click();
			this.displayError(error);
		}
	}


	async storeSessionOwnerAvatar(avatarFile) {
		this.displayError();
		try {
			// TODO: call fetch(POST /services/documents) to store the given avatar file, and subsequently
			const imgContainer = document.querySelector("section.preferences img");
			let response;
			response = await fetch("/services/documents", { method: "POST", credentials: "include", headers: { "Content-Type": avatarFile.type, "Accept": "text/plain" }, body: avatarFile });
			if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
			const avatarReference = parseInt(await response.text());
			
			Controller.sessionOwner.avatarReference = avatarReference;

			response = await fetch("/services/people?avatarReference=" + avatarReference, { method: "POST", credentials: "include", headers: { "Content-Type": "application/json", "Accept": "text/plain" }, body: JSON.stringify(Controller.sessionOwner) });
			if (!response.ok) throw new Error("HTTP " + response.status + " " + response.statusText);
			Controller.sessionOwner.version += 1;

			imgContainer.src = "/services/documents/" + avatarReference + "?cache-bust=" + Date.now();
		} catch (error) {
			this.displayError(error);
		}
	}
}


window.addEventListener("load", event => {
	const controller = new PreferencesController();

	const anchors = document.querySelectorAll("header li > a");
	anchors.forEach((anchor, index) => anchor.addEventListener("click", event => controller.active = (index === 1)));
});