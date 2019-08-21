/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
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
  };

  class Product {
    constructor(id, data) {
      const thisProduct = this;
      thisProduct.id = id;
      thisProduct.data = data;
      thisProduct.renderInMenu();
      thisProduct.getElements();
      thisProduct.initAccordion();
      thisProduct.initOrderForm();
      thisProduct.initAmountWidget();
      thisProduct.processOrder();
    }

    renderInMenu() {
      const thisProduct = this;
      const generatedHTML = templates.menuProduct(thisProduct.data);
      thisProduct.element = utils.createDOMFromHTML(generatedHTML);
      const menuContainer = document.querySelector(select.containerOf.menu);
      menuContainer.appendChild(thisProduct.element);
    }

    getElements() {
      const thisProduct = this;

      thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
      thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);
      thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs);
      thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);
      thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);
      thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
      thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
    }

    initAmountWidget() {
      const thisProduct = this;

      thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

      thisProduct.amountWidgetElem.addEventListener('updated', () => thisProduct.processOrder());
    }

    initAccordion() {
      const thisProduct = this;

      thisProduct.accordionTrigger.addEventListener('click', () => {
        thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);
        const activeProducts = document.querySelectorAll(select.all.menuProductsActive);

        for(let activeProduct of activeProducts) {
          if(activeProduct !== thisProduct.element) {
            activeProduct.classList.remove(classNames.menuProduct.wrapperActive);
          }
        }

        /*DRUGIE ROZWIĄZANIE NA DOLE BY PORÓWNAĆ.
        OBA DZIAŁAJĄ, ALE JAK Z JAKOŚCIĄ KODU? CZY WARTO STOSOWAĆ ZAMIANE NODE LISTY NA TABLICĘ DLA SAMEGO FOREACH. JAKOŚ TAK MI WYGODNIEJ ZAMIAST PĘTLI FOR OF. CZĘSTO TAK ROBIĘ I NIE WIEM CZY TO DOBRA PRAKTYKA.
        CHCE O TO ZAPYTAĆ NA ROZMOWIE, ALE ZOSTAWIŁEM TUTAJ TEN KOD Z OBJAŚNIENIEM, ŻEBYŚ MÓGŁ GO OCENIĆ.

        [...activeProducts].forEach(activeProduct => {
          if(activeProduct !== thisProduct.element) {
            activeProduct.classList.remove('active');
          }
        });

        */
      });
    }

    initOrderForm() {
      const thisProduct = this;

      thisProduct.form.addEventListener('submit', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });

      for(let input of thisProduct.formInputs){
        input.addEventListener('change', function(){
          thisProduct.processOrder();
        });
      }

      thisProduct.cartButton.addEventListener('click', function(event){
        event.preventDefault();
        thisProduct.processOrder();
      });
    }

    processOrder() {
      const thisProduct = this;
      const formData = utils.serializeFormToObject(thisProduct.form);
      let price = thisProduct.data.price;

      const allParams = thisProduct.data.params;

      if(allParams) {
        for(let param in allParams) {
          const paramOptions = allParams[param].options;
          const chosenIngrs = formData[param] ? formData[param] : [];
          for(let option in paramOptions) {
            const ingrPrice = paramOptions[option].price;
            const isIngrDefault = paramOptions[option].default;
            const isIngrChosen = chosenIngrs.includes(option);
            if(isIngrChosen && !isIngrDefault) {
              price += ingrPrice;
            } else if(!isIngrChosen && isIngrDefault) {
              price -= ingrPrice;
            }
            const images = thisProduct.imageWrapper.querySelectorAll(`.${param}-${option}`);
            if(images.length > 0) {
              if(isIngrChosen) {
                images.forEach(image => {
                  image.classList.add(classNames.menuProduct.imageVisible);
                });
              } else {
                images.forEach(image => {
                  image.classList.remove(classNames.menuProduct.imageVisible);
                });
              }
            }
          }
        }
      }

      price *= thisProduct.amountWidget.value;

      thisProduct.priceElem.innerHTML = price;

    }
  }

  class AmountWidget {
    constructor(element) {
      const thisWidget = this;
      thisWidget.value = settings.amountWidget.defaultValue;

      thisWidget.getElements(element);
      thisWidget.setValue(thisWidget.value);
      thisWidget.initActions();
    }

    announce() {
      const thisWidged = this;

      const event = new Event('updated');
      thisWidged.element.dispatchEvent(event);
    }

    getElements(element){
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidged = this;

      const newValue = parseInt(value);
      if(newValue != thisWidged.value && newValue >= settings.amountWidget.defaultMin && newValue <= settings.amountWidget.defaultMax) {
        thisWidged.value = newValue;
        thisWidged.announce();
      }

      thisWidged.input.value = thisWidged.value;
    }

    initActions() {
      const thisWidged = this;

      thisWidged.input.addEventListener('change', () => thisWidged.setValue(thisWidged.input.value));
      thisWidged.linkDecrease.addEventListener('click', () => thisWidged.setValue(thisWidged.value - 1));
      thisWidged.linkIncrease.addEventListener('click', () => thisWidged.setValue(thisWidged.value + 1));
    }
  }

  const app = {
    initData: function() {
      const thisApp = this;
      thisApp.data = dataSource;
    },

    initMenu: function() {
      const thisApp = this;
      for(let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    init: function(){
      const thisApp = this;
      //console.log('*** App starting ***');
      //console.log('thisApp:', thisApp);
      //console.log('classNames:', classNames);
      console.log('settings:', settings);
      //console.log('templates:', templates);

      thisApp.initData();

      thisApp.initMenu();
    },

  };

  app.init();
}
