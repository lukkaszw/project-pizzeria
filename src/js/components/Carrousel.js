import { select } from '../settings.js';

class Carrousel {
  constructor(wrapper) {
    this.getElements(wrapper);
    this.startCarrousel();
  }

  getElements(wrapper) {
    this.dom = {};
    this.dom.wrapper = wrapper;
    this.dom.slides = this.dom.wrapper.querySelectorAll(select.carrousel.slides);
    this.dom.btns =   this.dom.wrapper.querySelectorAll(select.carrousel.btns);

    this.dom.btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const slideNr = parseInt(btn.getAttribute('id').replace('#slide-', ''));
        this.changeSlide(slideNr);
      });
    });
  }

  startCarrousel() {
    this.activeSlide = 0;
    this.lastSlide = this.dom.slides.length - 1;
    this.runSlideInterval();
  }

  runSlideInterval() {
    this.interval = setInterval(() => {
      this.activeSlide === this.lastSlide ? this.activeSlide = 0 : this.activeSlide++;
      this.setSlideActive();
    }, 3000);
  }

  setSlideActive() {
    this.dom.slides.forEach((slide, index) => {
      index === this.activeSlide ? slide.classList.add('active') : slide.classList.remove('active');
    });
    this.dom.btns.forEach((btn, index) => {
      index === this.activeSlide ? btn.classList.add('active') : btn.classList.remove('active');
    });
  }

  changeSlide(slideNr) {
    clearInterval(this.interval);
    this.activeSlide = slideNr - 1;
    this.setSlideActive();
    this.runSlideInterval();
  }
}

export default Carrousel;
