import { select } from '../settings.js';
import AmountWidget from './AmountWidget.js';

class CartProduct {
  constructor(menuProduct, element) {
    this.id = menuProduct.id;
    this.referenceToProduct = menuProduct;
    this.name = menuProduct.name;
    this.price = menuProduct.price;
    this.priceSingle = menuProduct.priceSingle;
    this.amount = menuProduct.amount;
    this.params = JSON.parse(JSON.stringify(menuProduct.params));
    this.getElements(element);
    this.initAmountWidget();
    this.initActions();
  }

  getElements(element) {
    this.dom = {};
    this.dom.wrapper = element;
    this.dom.price = this.dom.wrapper.querySelector(select.cartProduct.price);
    this.dom.amountWidget = this.dom.wrapper.querySelector(select.cartProduct.amountWidget);
    this.dom.edit = this.dom.wrapper.querySelector(select.cartProduct.edit);
    this.dom.remove = this.dom.wrapper.querySelector(select.cartProduct.remove);
  }

  initActions() {
    this.dom.edit.addEventListener('click',() => {});
    this.dom.remove.addEventListener('click', () => this.remove());
    this.dom.edit.addEventListener('click', () => {
      this.update();
      this.remove();
    });
  }

  initAmountWidget() {
    this.amountWidget = new AmountWidget(this.dom.amountWidget);
    this.amountWidget.value = this.amount;
    this.amountWidget.input.value = this.amount;
    this.dom.amountWidget.addEventListener('updated', () => this.updateAmount());
  }

  updateAmount() {
    this.amount = this.amountWidget.value;
    this.price = this.priceSingle * this.amount;
    this.dom.price.innerHTML = this.price;
    this.dom.wrapper.classList.add('changed');
    setTimeout(() => {
      this.dom.wrapper.classList.remove('changed');
    }, 400);
  }

  remove() {
    const thisCardProduct = this;
    const event = new CustomEvent('remove', {
      bubbles: true,
      detail: {
        cartProduct: thisCardProduct
      }
    });
    this.dom.wrapper.dispatchEvent(event);
  }

  update() {
    this.referenceToProduct.cartProductUpdate(this.params, this.amount);
  }

  getData() {
    const newParamList = {};
    Object.keys(this.params).forEach(param => {
      newParamList[param] = Object.keys(this.params[param].options).map(option => option);
    });

    return {
      id: this.id,
      name: this.name,
      amount: this.amount,
      priceSingle: this.priceSingle,
      price: this.price,
      params: newParamList
    };
  }
}

export default CartProduct;
