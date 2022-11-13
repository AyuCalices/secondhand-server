/*
 * Defines a hello world controller class.
 */
export default class HelloController extends Object {
	/*
	 * Initializes a new instance.
	 */
	constructor () { super(); }


	activate () {
		const centerArticle = document.querySelector("main article.center");
		const inputElement = centerArticle.querySelector("input.input");
		const button = centerArticle.querySelector("button.append");

		inputElement.addEventListener("input", event => this.toggleButtonState());

		const handler = event => this.appendWelcomeLine();
		button.addEventListener("click", handler);
		button.addEventListener("touchstart", handler);
	}


	appendWelcomeLine () {
		const centerArticle = document.querySelector("main article.center");
		const inputElement = centerArticle.querySelector("input.input");
		const outputElement = centerArticle.querySelector("textarea.output");
		const button = centerArticle.querySelector("button.append");

		const text = inputElement.value.trim();
		button.disabled = true;
		inputElement.value = "";
		outputElement.value += text + "\n";
	}


	toggleButtonState () {
		const centerArticle = document.querySelector("main article.center");
		const inputElement = centerArticle.querySelector("input.input");
		const button = centerArticle.querySelector("button.append");

		button.disabled = inputElement.value.trim().length === 0;
	}
}


/*
 * Performs event handler registration for the window load event.
 */
window.addEventListener("load", event => {
	const constroller = new HelloController();
	constroller.activate();
});