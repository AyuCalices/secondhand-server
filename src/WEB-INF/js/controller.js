
/*
 * Associates objects as keys with associated value objects
 * that store the key object's private variables.
 */
const PRIVATES = new WeakMap();


/*
 * Semi-abstract controller type.
 * Copyright (c) 2015 Sascha Baumeister
 */
export default class Controller extends EventTarget {


	/*
	 * The authenticated person which is currently logged in,
	 * or null for none.
	 */
	static sessionOwner = null;


	/*
	 * The content of the shopping cart.
	 */
	static shoppingCart = [];


	/*
	 * Initializes a new instance.
	 */
	constructor () {
		super();

		const that = { active: false };
		PRIVATES.set(this, that);
	}


	/*
	 * Getter for the active property.
	 */
	get active () {
		const that = PRIVATES.get(this);
		return that.active;
	}


	/*
	 * Setter for the active property.
	 */
	set active (value) {
		if (value == this.active) return;

		const that = PRIVATES.get(this);
		that.active = value;

		if (value) this.activate();
		else this.deactivate();

		// const event = new CustomEvent("active", { detail: value });
		// this.dispatchEvent(event);
	}


	/*
	 * Activates this controller.
	 */
	activate () {
		throw new InternalError("method should be overriden!");
	}


	/*
	 * Deactivates this controller.
	 */
	deactivate () {
	}


	/*
	 * Displays the given object in the footer's message area,
	 * or resets it if none is given.
	 * @param error {Object} the optional error or string, or null
	 */
	displayMessage (object) {
		const output = document.querySelector("footer output.message");
		if (object) {
			console.error(object);
			output.value = object instanceof Error ? object.message : object.toString();
		} else {
			output.value = "";
		}
	}


	/*
	 * Removes all child elements of the given HTML element.
	 * @param element {Element} the HTML element
	 */
	clearChildren (element) {
		while (element.childElementCount > 0)
			element.lastElementChild.remove();
	}


	/*
	 * Clones the given object by marshaling it into JSON,
	 * and returning the result of unmarshaling said JSON.
	 * @param object {Object} the object
	 */
	cloneObject (object) {
		return JSON.parse(JSON.stringify(object));
	}
}