/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
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
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
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
    // CODE ADDED END
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
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
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

    initMenu: function() {
      for(let productData in this.data.products) {
        new Product(productData, this.data.products[productData]);
      }
    },

    init: function(){
      this.initData();
      this.initMenu();
    },

  };

  app.init();

}
