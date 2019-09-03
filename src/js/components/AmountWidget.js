import { settings, select } from '../settings.js';

class AmountWidget {
  constructor(element) {
    this.value = settings.amountWidget.defaultValue;
    this.getElements(element);
    this.setValue(this.value);
    this.initActions();
  }

  announce() {
    const event = new CustomEvent('updated', {
      bubbles: true,
    });
    this.element.dispatchEvent(event);
  }

  getElements(element){
    this.element = element;
    this.input = this.element.querySelector(select.widgets.amount.input);
    this.linkDecrease = this.element.querySelector(select.widgets.amount.linkDecrease);
    this.linkIncrease = this.element.querySelector(select.widgets.amount.linkIncrease);
  }

  setValue(value) {
    const newValue = parseInt(value);

    if(newValue !== this.value && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
      this.value = newValue;
      this.announce();
    }

    this.input.value = this.value;
  }

  initActions() {
    this.input.addEventListener('change', () => this.setValue(this.input.value));
    this.linkDecrease.addEventListener('click', () => this.setValue(this.value - 1));
    this.linkIncrease.addEventListener('click', () => this.setValue(this.value + 1));
  }

}

export default AmountWidget;
