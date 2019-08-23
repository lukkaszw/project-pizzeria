/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      orderSummary: '#template-order-summary',
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input[name="amount"]',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      totalPrice: '.cart__total-price strong',
      totalNumber: '.cart__total-number',
      mobileActivaterAmount: '.cart-mobile-activater .cart-amount',
      mobileActivaterBtn: '.cart-mobile-activater',
      cartSummary: '.cart__order-summary',
      subTotalPrice: '.cart__order-price > li:first-child .cart__order-price-sum',
      deliveryPrice: '.cart__order-price > li:nth-child(2) .cart__order-price-sum',
      totalPriceBelow: '.cart__order-price > li:nth-child(3) .cart__order-price-sum',
    }
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    orderSummary: Handlebars.compile(document.querySelector(select.templateOf.orderSummary).innerHTML),
  };

  class Cart {
    constructor() {
      this.products = [];
      this.totalPrice = 0;
      this.subTotalPrice = 0;
      this.totalNumber = 0;
      this.currentId = 1;
      this.delivery = 10;
      this.getElements();
    }

    getElements() {
      this.mobileActivaterBtnElem = document.querySelector(select.cart.mobileActivaterBtn);
      this.mobileActivaterAmountElem = document.querySelector(select.cart.mobileActivaterAmount);
      this.element = document.querySelector(select.containerOf.cart);
      this.totalPriceElem = this.element.querySelector(select.cart.totalPrice);
      this.totalNumberElem = this.element.querySelector(select.cart.totalNumber);
      this.subTotalPriceElem = this.element.querySelector(select.cart.subTotalPrice);
      this.deliveryElem = this.element.querySelector(select.cart.deliveryPrice);
      this.totalPriceBelowElem = this.element.querySelector(select.cart.totalPriceBelow);
    }

    renderInCartInfo() {
      this.totalPriceElem.innerHTML = `$${this.totalPrice}`;
      this.totalNumberElem.innerHTML = this.totalNumber;
      this.mobileActivaterAmountElem.innerHTML = this.totalNumber;
      this.subTotalPriceElem.innerHTML = `$${this.subTotalPrice}`;
      this.deliveryElem.innerHTML = `$${this.delivery}`;
      this.totalPriceBelowElem.innerHTML = `$${this.totalPrice}`;
      if(this.totalNumber > 0) {
        this.mobileActivaterBtnElem.disabled = false;
      }
    }

    addToCart(name, chosenIngr, price, amount) {
      if(this.products.length === 0) this.totalPrice += this.delivery;
      const cartProduct = new CartProduct(this.currentId, name, chosenIngr, price, amount);
      //this.totalPrice += cartProduct.price;
      //this.subTotalPrice += cartProduct.price;
      //this.totalNumber += cartProduct.amount;
      //this.currentId++;

      this.products.push(cartProduct);

      this.calcPricesAndNumber();
      this.renderInCartInfo();
    }

    calcPricesAndNumber() {
      this.subTotalPrice = 0;
      this.totalNumber = 0;
      this.products.forEach(product => {
        this.subTotalPrice += product.price;
        this.totalNumber += product.amount;
      });
      this.totalPrice = this.subTotalPrice + this.delivery;
    }
  }

  class CartProduct {
    constructor(id, name, formData, price, amount) {
      this.id = id;
      this.name = name;
      this.data = formData;
      this.price = price;
      this.amount = amount;
      this.renderCartInSummary();
      this.getElements();
    }

    getElements() {
      this.element = document.querySelector(`#product-${this.id}`);
      this.increseElem = this.element.querySelector('.plus');
      this.decreaseElem = this.element.querySelector('.minus');
      this.inputAmountElem = this.element.querySelector('input');
    }

    renderCartInSummary() {
      const generatedHTML = templates.orderSummary(this);
      const cartSummaryContainer = document.getElementById('card-order-summary');
      cartSummaryContainer.innerHTML += generatedHTML;
    }
  }

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

    initAmountWidget() {
      this.amountWidget = new AmountWidget(this.amountWidgetElem);
      this.amountWidgetElem.addEventListener('updated', () => this.processOrder());
    }

    initAccordion() {
      this.accordionTrigger.addEventListener('click', () => {
        this.element.classList.toggle(classNames.menuProduct.wrapperActive);
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

        for(let activeProduct of activeProducts) {
          if(activeProduct !== this.element) {
            activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
          }
        }

      });
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

    processOrder() {
      const formData = utils.serializeFormToObject(this.form);
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
          } else {
            images.forEach(image => image.classList.remove(classNames.menuProduct.imageVisible));
          }
        }

      }

      price *= this.amountWidget.value;
      this.priceElem.innerHTML = price;
    }

    addToCart() {
      const price = parseFloat(this.priceElem.innerHTML);
      const chosenIngr = utils.serializeFormToObject(this.form);
      const amount =this.amountWidget.value;
      delete chosenIngr.amount;
      app.cart.addToCart(this.data.name, chosenIngr, price, amount);
    }
  }

  class AmountWidget {
    constructor(element) {
      this.value = settings.amountWidget.defaultValue;
      this.getElements(element);
      this.setValue(this.value);
      this.initActions();
    }

    announce() {
      const event = new Event('updated');
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

  const app = {
    initData: function() {
      this.data = dataSource;
    },
    initCart: function() {
      this.cart = new Cart();
    },

    initMenu: function() {
      for(let productData in this.data.products) {
        new Product(productData, this.data.products[productData]);
      }
    },

    init: function(){
      this.initData();
      this.initCart();
      this.initMenu();
    },

  };

  app.init();

}
