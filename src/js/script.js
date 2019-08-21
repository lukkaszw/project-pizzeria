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
            if(chosenIngrs.includes(option) && !isIngrDefault) {
              price += ingrPrice;
            } else if(!chosenIngrs.includes(option) && isIngrDefault) {
              price -= ingrPrice;
            }
          }
        }
      }

      thisProduct.priceElem.innerHTML = price;

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
      console.log('*** App starting ***');
      console.log('thisApp:', thisApp);
      console.log('classNames:', classNames);
      console.log('settings:', settings);
      console.log('templates:', templates);

      thisApp.initData();

      thisApp.initMenu();
    },

  };

  app.init();
}
