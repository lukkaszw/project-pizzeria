import { select, templates, classNames } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';


class Product {
  constructor(id, data) {
    this.id = id;
    this.data = data;
    this.renderInMenu();
    this.getElements();
    this.initAccordion();
    this.initOrderForm();
    this.initAmountWidget();
    this.processOrder();
  }

  renderInMenu() {
    const generatedHTML = templates.menuProduct(this.data);
    this.element = utils.createDOMFromHTML(generatedHTML);
    const menuContainer = document.querySelector(select.containerOf.menu);
    menuContainer.appendChild(this.element);
  }

  getElements() {
    this.accordionTrigger = this.element.querySelector(select.menuProduct.clickable);
    this.form = this.element.querySelector(select.menuProduct.form);
    this.formInputs = this.form.querySelectorAll(select.all.formInputs);
    this.cartButton = this.element.querySelector(select.menuProduct.cartButton);
    this.priceElem = this.element.querySelector(select.menuProduct.priceElem);
    this.imageWrapper = this.element.querySelector(select.menuProduct.imageWrapper);
    this.amountWidgetElem = this.element.querySelector(select.menuProduct.amountWidget);
  }

  resetOptions() {
    let defaultOptions = [];
    if(this.data.params) {

      defaultOptions = Object.values(this.data.params)
        .map(paramOptions => Object.keys(paramOptions.options)
          .filter(key => paramOptions.options[key].default))
        .flat();

    }
    this.setOptions(defaultOptions, 1);
    this.processOrder();
  }

  setOptions(chosenOptions, amount) {
    this.amountWidget.dom.input.value = amount;
    this.amountWidget.value = amount;

    this.formInputs.forEach(element => {
      if(element.type === 'checkbox' || element.type === 'radio') {
        if(chosenOptions.includes(element.id)) {
          element.checked = true;
        } else {
          element.checked = false;
        }
      } else if(element.type.includes('select')) {
        const listOfOptions = element.querySelectorAll('option');
        listOfOptions.forEach(option => {
          if(chosenOptions.includes(option.value)) {
            option.selected = true;
          } else {
            option.selected = false;
          }
        });
      }
    });
  }

  initAmountWidget() {
    this.amountWidget = new AmountWidget(this.amountWidgetElem);
    this.amountWidgetElem.addEventListener('updated', () => this.processOrder());
  }

  activate() {
    this.element.classList.toggle(classNames.menuProduct.wrapperActive);
    const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

    for(let activeProduct of activeProducts) {
      if(activeProduct !== this.element) {
        activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
      }
    }
  }

  initAccordion() {
    this.accordionTrigger.addEventListener('click', () => this.activate());
  }

  initOrderForm() {
    this.form.addEventListener('submit', (event) => {
      event.preventDefault();
      this.processOrder();
    });

    for(let input of this.formInputs){
      input.addEventListener('change', () => this.processOrder());
    }

    this.cartButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.processOrder();
      this.addToCart();
    });
  }

  addToCart() {
    this.name = this.data.name;
    this.amount = this.amountWidget.value;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: this,
      },
    });

    this.element.dispatchEvent(event);

    this.resetOptions();
  }

  cartProductUpdate(params, amount) {

    let chosenOptions = [];

    chosenOptions = Object.values(params)
      .map(paramsOptions => (Object.keys(paramsOptions.options)))
      .flat();

    this.setOptions(chosenOptions, amount);

    this.processOrder();
    if(!this.element.classList.contains('active')) {
      this.activate();
    }
    this.element.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  processOrder() {
    const formData = utils.serializeFormToObject(this.form);

    this.params = {};
    let price = this.data.price;

    const allParams = this.data.params || [];

    for(let param in allParams) {
      const paramOptions = allParams[param].options;
      const chosenIngredients = formData[param] || [];

      for(let option in paramOptions) {
        const ingrPrice = paramOptions[option].price;
        const isIngredientDefault = paramOptions[option].default;
        const isIngredientChosen = chosenIngredients.includes(option);
        if(isIngredientChosen && !isIngredientDefault) {
          price += ingrPrice;
        } else if(!isIngredientChosen && isIngredientDefault) {
          price -= ingrPrice;
        }

        const images = this.imageWrapper.querySelectorAll(`.${param}-${option}`) || [];
        if(isIngredientChosen) {
          images.forEach(image => image.classList.add(classNames.menuProduct.imageVisible));
          if(!this.params[param]) {
            this.params[param] = {
              label: allParams[param].label,
              options: {},
            };
          }
          this.params[param].options[option] = paramOptions[option].label;
        } else {
          images.forEach(image => image.classList.remove(classNames.menuProduct.imageVisible));
        }
      }

    }

    this.priceSingle = price;
    this.price = this.priceSingle * this.amountWidget.value;
    this.priceElem.innerHTML = this.price;

  }

}

export default Product;
