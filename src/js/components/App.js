import { select } from '../settings.js';
import Cart from './Cart.js';
import Product from './Product.js';


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

    this.productList = document.querySelector(select.containerOf.menu);

    this.productList.addEventListener('add-to-cart', (e) => {
      this.cart.add(e.detail.product);
    });
  }

  init() {
    this.initData();
    this.initMenu();
    this.initCart();
  }

}


export default App;
