import { select, classNames } from '../settings.js';
import Cart from './Cart.js';
import Product from './Product.js';
import Booking from './Booking.js';


class App {
  constructor(dbPaths) {
    this.dbPaths = dbPaths;
  }

  initPages() {
    this.pages = document.querySelector(select.containerOf.pages).children;
    this.navLinks = document.querySelectorAll(select.nav.links);
    const pageIdFromHash = window.location.hash.replace('#/', '');

    let pageMatchingHash = this.pages[0].id;

    for(let page of this.pages) {
      if(page.id === pageIdFromHash) {
        pageMatchingHash = page.id;
        break;
      }
    }

    this.activatePage(pageMatchingHash);

    for(let link of this.navLinks) {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = e.target.getAttribute('href').replace('#', '');
        this.activatePage(pageId);
        window.location.hash = '#/' + pageId;
      });
    }
  }

  activatePage(pageId) {
    for(let page of this.pages) {
      page.classList.toggle(classNames.pages.active, page.id === pageId);
    }

    for(let link of this.navLinks) {
      link.classList.toggle(
        classNames.pages.active,
        link.getAttribute('href') === `#${pageId}`
      );
    }

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

  initBooking() {
    const bookingElement = document.querySelector(select.containerOf.booking);
    new Booking(bookingElement);
  }

  init() {
    this.initPages();
    this.initData();
    this.initMenu();
    this.initCart();
    this.initBooking();
  }

}


export default App;
