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


    /*


      params = {
        param1: {
          options1: {
            optionA1: {},
            optionA2: {}
          },
          options2: {
            optionB1: {},
            optionB2: {}
          }
        },
        param2: {
          options1: {
            optionC1: {},
            optionC2: {}
          },
          options2: {
            optionD1: {},
            optionD2: {}
          },
        }
      }

      Taka mniej więcej struktura obiektu przychodzi z produktu z karty (z cartProduct).

      Chce wrzucić do tablicy optionsInParams poszczególne opcje, ale nie ich wartości tylko klucze(keys). Tak żeby w tablicy było: ["optionA1", "optionA2", "optionB1", "optionB2", "optionC1" itd....].

      Podobnie robie w metodzie resetOptions. Tylko tam potrzebne mi są tylko wartości defaultowe, dlatego sprawdzam, czy opcje mają default na true i dopiero wtedy je pushuje.

      Taka tablica jest mi potrzebna jako argument do metody this.setOptions, bo takie wartości są ustawiane jako id lub name w formularzu w checkboxach, radio oraz jako value w opcjach selectu. W ten sposób sprawdzając czy w tej tablicy są ich atrybuty ustawiam opcje w polach wyboru produktu.

      Dlatego loopuje porzez wszystkie params, a następnie wszystkie options w każdym param by się dostac do kluczy option i je wrzucić do tablicy. Chciałem metodą map wewnątrz pierwszej pętli, ale wtedy wychodzi tablica opcji z ostatniego param. Chyba, że bym konkatenował każdą następną tablicę zwróconą z map do tej głównej. Myśle, że wyszłoby bardziej zagmatwanie niż zwykłym pushem.

      Tak wymyśliłem algorytm na reset opcji po dodaniu produktu oraz ustawianie opcji edytowanego produktu z karty.
      Oczywiście jeśli masz pomysł na prostrze i bardziej czytelne rozwiązania to byłoby super i z chęcią wysłucham każdej rady :)


    */

    let choosenOptions = [];

    /*Object.keys(params).forEach(param => {
      Object.keys(params[param].options).forEach(option => {
        choosenOptions.push(option);
      });
    });*/


    Object.keys(params).forEach(param => {
      let options = (Object.entries(params[param].options).map(([key]) => key));
      choosenOptions = choosenOptions.concat(options);

    });

    this.setOptions(choosenOptions, amount);

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
