import { select } from '../settings.js';
import Carrousel from './Carrousel.js';

class MainPage {
  constructor(element) {
    this.getElements(element);
    this.initCarrousel();
  }

  getElements(element) {
    this.dom = {};
    this.dom.wrapper = element;
    this.dom.boxLinks = this.dom.wrapper.querySelectorAll(select.mainPage.boxLinks);

    this.dom.boxLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = link.getAttribute('href').replace('#', '');
        this.changePage(pageId);
      });
    });
  }

  changePage(pageId) {
    const event = new CustomEvent('changePage', {
      bubbles: true,
      detail: {
        pageId
      },
    });
    this.dom.wrapper.dispatchEvent(event);
  }

  initCarrousel() {
    this.carrouselElement = this.dom.wrapper.querySelector(select.mainPage.carrousel);
    this.carrousel = new Carrousel(this.carrouselElement);
  }


}

export default MainPage;
