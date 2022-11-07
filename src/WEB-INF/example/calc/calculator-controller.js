
const OPERATOR_SYMBOLS = [ "=", "+", "-", "*", "/", "%", "**", "root", "log" ];


/*
 * Defines a calculator controller class.
 */
export default class CalculatorController extends Object {

	/*
	 * Initializes a new instance.
	 */
	constructor () { super(); }


	/**
	 * Registers any event handlers that must be registered after loading.
	 */
	activate () {
		const centerArticle = document.querySelector("main article.center");
		const buttons = [
			centerArticle.querySelector("button.assign"),
			centerArticle.querySelector("button.sum"),
			centerArticle.querySelector("button.difference"),
			centerArticle.querySelector("button.product"),
			centerArticle.querySelector("button.quotient"),
			centerArticle.querySelector("button.modul"),
			centerArticle.querySelector("button.exponent"),
			centerArticle.querySelector("button.root"),
			centerArticle.querySelector("button.logarithm")
		];

		for (let index = 0; index < buttons.length; ++index) {
			const operatorSymbol = OPERATOR_SYMBOLS[index];
			const handler = event => this.calculate(operatorSymbol);

			buttons[index].addEventListener("click", handler);
			buttons[index].addEventListener("touchstart", handler);
		}
	}


	/*
	 * Performs a calculation and assigns the result to the left operand input,
	 * resetting the right operand input to zero in the process.
	 */
	calculate (operatorSymbol) {
		const centerArticle = document.querySelector("main article.center");
		const leftOperandInputElement = centerArticle.querySelector("input.left-operand");
		const rightOperandInputElement = centerArticle.querySelector("input.right-operand");

		const leftOperand = Number.parseFloat(leftOperandInputElement.value.trim());
		const rightOperand = Number.parseFloat(rightOperandInputElement.value.trim());
		const result = calculate(operatorSymbol, leftOperand, rightOperand);

		leftOperandInputElement.value = result.toString();
		rightOperandInputElement.value = "0";
	}
}


/*
 * Returns the result of the given calculation.
 * @param operatorSymbol the operator symbol
 * @param leftOperand the left operand
 * @param rightOperand the right operand
 * @return the calculation result, or NaN for none
 */
function calculate (operatorSymbol, leftOperand, rightOperand) {
	switch (operatorSymbol) {
			case "=":
				return rightOperand;
			case "+":
				return leftOperand + rightOperand;
			case "-":
				return leftOperand - rightOperand;
			case "*":
				return leftOperand * rightOperand;
			case "/":
				return leftOperand / rightOperand;
			case "%":
				return leftOperand % rightOperand;
			case "**":
				return leftOperand ** rightOperand;
			case "root":
				return leftOperand ** (1 / rightOperand);
			case "log":
				return Math.log(leftOperand) / Math.log(rightOperand);
			default:
				return NaN;
	}
}


/*
 * Performs event handler registration for the window load event.
 */
window.addEventListener("load", event => {
	const constroller = new CalculatorController();
	constroller.activate();
});