import { settings, select, classNames, templates } from '../settings.js';
import { utils } from '../utils.js';
import CartProduct from './CartProduct.js';

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

export default Cart;
