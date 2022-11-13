/*
 * Adds a hello world message to the center article element.
 */
function sayHello () {
	const centerArticle = document.querySelector("main article.center");
	centerArticle.append("Hello World!");
}


/*
 * Performs event handler registration for the window load event.
 */
window.addEventListener("load", event => sayHello());
