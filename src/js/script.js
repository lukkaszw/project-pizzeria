/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product',
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
        input: 'input.amount',
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
  };


  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    },
    cart: {
      defaultDeliveryFee: 20,
    },
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  };

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

    addToCart() {
      this.name = this.data.name;
      this.amount = this.amountWidget.value;
      app.cart.add(this);
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

  class Cart {
    constructor(element) {
      this.products = [];
      this.deliveryFee = settings.cart.defaultDeliveryFee;
      this.getElements(element);
      this.initActions();
    }

    getElements(element) {
      this.dom = {};
      this.dom.wrapper = element;
      this.dom.toggleTrigger = this.dom.wrapper.querySelector(select.cart.toggleTrigger);
      this.dom.productList = this.dom.wrapper.querySelector(select.cart.productList);
      this.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];
      for(let key of this.renderTotalsKeys){
        this.dom[key] = this.dom.wrapper.querySelectorAll(select.cart[key]);
      }
    }

    initActions() {
      this.dom.toggleTrigger.addEventListener('click', () => this.dom.wrapper.classList.toggle(classNames.cart.wrapperActive));

      this.dom.productList.addEventListener('updated', () => {
        this.update();
      });

      this.dom.productList.addEventListener('remove', (e) => this.remove(e.detail.cartProduct));
    }

    add(menuProduct) {
      const generatedHTML = templates.cartProduct(menuProduct);
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);
      this.dom.productList.appendChild(generatedDOM);

      this.products.push(new CartProduct(menuProduct, generatedDOM));
      this.update();
    }

    update() {
      this.totalNumber = 0;
      this.subtotalPrice = 0;
      this.products.forEach(product => {
        this.totalNumber += product.amount;
        this.subtotalPrice += product.price;
      });
      this.totalPrice = this.subtotalPrice + this.deliveryFee;
      for(let key of this.renderTotalsKeys) {
        for(let elem of this.dom[key]) {
          elem.innerHTML = this[key];
        }
      }
    }

    remove(cartProduct) {
      const index = this.products.indexOf(cartProduct);
      this.products.splice(index, 1);
      cartProduct.dom.wrapper.remove();
      this.update();
    }

  }

  class CartProduct {
    constructor(menuProduct, element) {
      this.id = menuProduct.id;
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
    }

    initAmountWidget() {
      this.amountWidget = new AmountWidget(this.dom.amountWidget);
      this.dom.amountWidget.addEventListener('updated', () => this.updateAmount());
    }

    updateAmount() {
      this.amount = this.amountWidget.value;
      this.price = this.priceSingle * this.amount;
      this.dom.price.innerHTML = this.price;
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

  }

  const app = {
    initData: function() {
      this.data = dataSource;
    },

    initMenu: function() {
      for(let productData in this.data.products) {
        new Product(productData, this.data.products[productData]);
      }
    },

    initCart: function() {
      const cartElement = document.querySelector(select.containerOf.cart);
      this.cart = new Cart(cartElement);
    },

    init: function(){
      this.initData();
      this.initMenu();
      this.initCart();
    },

  };

  app.init();

}
