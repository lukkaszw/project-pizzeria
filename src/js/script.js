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
    db: {
      url: '//localhost:3131',
      product: 'product',
      order: 'order',
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

    resetOptions() {
      const defaultOptions = [];
      if(this.data.params) {
        Object.keys(this.data.params).forEach(param => {
          Object.keys(this.data.params[param].options).forEach(option => {
            if(this.data.params[param].options[option].default) {
              defaultOptions.push(option);
            }
          });
        });
      }
      this.setOptions(defaultOptions, 1);
      this.processOrder();
    }

    setOptions(chosenOptions, amount) {
      this.amountWidget.input.value = amount;
      this.amountWidget.value = amount;

      this.formInputs.forEach(element => {
        if(element.type === 'checkbox' || element.type === 'radio') {
          if(chosenOptions.includes(element.id)) element.checked = true;
          else element.checked = false;
        } else if(element.type.includes('select')) {
          const listOfOptions = element.querySelectorAll('option');
          listOfOptions.forEach(option => {
            if(chosenOptions.includes(option.value)) option.selected = true;
            else option.selected = false;
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
      app.cart.add(this);
      this.resetOptions();
    }

    cartProductUpdate(params, amount) {
      const optionsInParams = [];

      Object.keys(params).forEach(param => {
        Object.keys(params[param].options).forEach(option => {
          optionsInParams.push(option);
        });
      });

      this.setOptions(optionsInParams, amount);

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
      this.dom.form = this.dom.wrapper.querySelector(select.cart.form);
      this.dom.address = this.dom.wrapper.querySelector(select.cart.address);
      this.dom.phone = this.dom.wrapper.querySelector(select.cart.phone);
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
      this.dom.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.sendOrder();
      });

      this.dom.phone.addEventListener('change', (e) => this.validateFormEl(e.target));
      this.dom.address.addEventListener('change', (e) => this.validateFormEl(e.target));
    }

    validateFormEl(element) {
      if(element.value.length < 9) {
        element.classList.add('error');
        return false;
      } else {
        element.classList.remove('error');
        return true;
      }
    }

    validateData() {
      let isValid = true;
      if(this.products.length === 0) isValid = false;
      if(!this.validateFormEl(this.dom.phone)) isValid = false;
      if(!this.validateFormEl(this.dom.address)) isValid = false;
      return isValid;
    }

    sendOrder() {
      const url = `${settings.db.url}/${settings.db.order}`;

      if(this.validateData()) {
        const productParams = this.products.map(product => product.getData());

        const payload = {
          address: this.dom.address.value,
          phone: this.dom.phone.value,
          totalNumber: this.totalNumber,
          deliveryFee: this.deliveryFee,
          subtotalPrice: this.subtotalPrice,
          totalPrice: this.totalPrice,
          products: productParams
        };

        const options = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        };

        fetch(url, options)
          .then(response => {
            if(response.ok) {
              return response.json();
            } else {
              throw new Error(`Error - ${response.status}`);
            }
          })
          .then(parsedResponse => {
            console.log('Dokonano zamówienia:', parsedResponse);
            this.resetCart();
          })
          .catch(error => {
            console.warn(error);
            alert('Niestety nie udało się wysłać zamówienia przez problemy techniczne na stronie. Nasz zespół nad tym pracuje. Zapraszamy wkrótce.');
          });
      }
    }

    resetCart() {

      this.products = [];
      this.dom.productList.innerHTML = '';
      this.dom.phone.value = '';
      this.dom.address.value = '';
      this.update();

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
      console.log(this.params);
      const newParamList = {};
      Object.keys(this.params).forEach(param => {
        newParamList[param] = [];
        for(let key in this.params[param].options) {
          newParamList[param].push(key);
        }
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

  class App {
    constructor(dbPaths) {
      this.dbPaths = dbPaths;
    }

    initData() {
      this.data = {};
      const url = `${this.dbPaths.url}/${this.dbPaths.product}`;
      fetch(url)
        .then(response => {
          if(response.ok) {
            return response.json();
          } else {
            throw new Error(`Error - ${response.status}`);
          }
        })
        .then(parsedResponse => {
          this.data.products = parsedResponse;
          this.initMenu();
        })
        .catch(error => {
          console.warn(error);
          alert('Problemy techniczne na stronie. Nasz zespół nad tym pracuje. Przepraszamy i zapraszamy ponownie wkrótce.');
        });
    }

    initMenu() {
      for(let productData in this.data.products) {
        new Product(this.data.products[productData].id, this.data.products[productData]);
      }
    }

    initCart() {
      const cartElement = document.querySelector(select.containerOf.cart);
      this.cart = new Cart(cartElement);
    }

    init() {
      this.initData();
      this.initMenu();
      this.initCart();
    }

  }

  const app = new App(settings.db);
  app.init();

}
