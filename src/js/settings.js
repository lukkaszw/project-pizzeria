/* global Handlebars */

export const select = {
  templateOf: {
    menuProduct: '#template-menu-product',
    cartProduct: '#template-cart-product',
    bookingWidget: '#template-booking-widget',
  },
  containerOf: {
    menu: '#product-list',
    cart: '#cart',
    pages: '#pages',
    booking: '.booking-wrapper',
    mainPage: '#main-page',
  },
  all: {
    menuProducts: '#product-list > .product',
    menuProductsActive: '#product-list > .product.active',
    formInputs: 'input, select',
  },
  mainPage: {
    boxLinks: '.box',
    carrousel: '.recomendations',
  },
  carrousel: {
    slides: '.slide',
    btns: '.carousel-panel__btn',
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
    datePicker: {
      wrapper: '.date-picker',
      input: `input[name="date"]`,
    },
    hourPicker: {
      wrapper: '.hour-picker',
      input: 'input[type="range"]',
      output: '.output',
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
  booking: {
    peopleAmount: '.people-amount',
    hoursAmount: '.hours-amount',
    tables: '.floor-plan .table',
    form: '.booking-form',
    starter: '[name="starter"]',
    phone: '[name="phone"]',
    address: '[name="address"]',
    submitBtn: '[type="submit"]',
    bookingInfo: '.booking-info',
    cancelUpdate: '.cancel-update',
    updateLink: '.booking-info__link',
    deleteBtn: '.delete-btn',
  },
  nav: {
    links: '.main-nav a',
  },
};


export const classNames = {
  menuProduct: {
    wrapperActive: 'active',
    imageVisible: 'active',
  },
  cart: {
    wrapperActive: 'active',
  },
  booking: {
    loading: 'loading',
    tableBooked: 'booked',
    tableChosen: 'chosen',
    btnDeleteActive: 'active',
    btnCancelUpdateActive: 'active',
  },
  nav: {
    active: 'active',
  },
  pages: {
    active: 'active',
  },
  validation: {
    invalid: 'error',
  }
};

export const settings = {
  hours: {
    open: 12,
    close: 24,
  },
  amountWidget: {
    defaultValue: 1,
    defaultMin: 1,
    defaultMax: 9,
  },
  datePicker: {
    maxDaysInFuture: 14,
  },
  cart: {
    defaultDeliveryFee: 20,
  },
  booking: {
    tableIdAttribute: 'data-table',
    hashKeyWords: ['#booking', '#less', '#more'],
    bookTableBtn: {
      bookName: 'Book table',
      updateName: 'Update',
    },
  },
  db: {
    url: '//' + window.location.hostname + (window.location.hostname=='localhost' ? ':3131' : ''),
    product: 'product',
    order: 'order',
    booking: 'booking',
    event: 'event',
    dateStartParamKey: 'date_gte',
    dateEndParamKey: 'date_lte',
    notRepeatParam: 'repeat=false',
    repeatParam: 'repeat_ne=false',
  },
  uuid: {
    v4: {
      length: 36
    }
  }
};

export const messages = {
  booking: {
    'POST': {
      success: 'Dokonano rezerwacji. Link do jej edycji:',
      error: 'Niestety nie udało się dokonać rezerwacji przez problemy techniczne na stronie. Nasz zespół nad tym pracuje. Zapraszamy wkrótce.',
    },
    'PUT': {
      success: 'Dokonano aktualizacji rezerwacji. Link do jej ponownej edycji:',
      error: 'Niestety nie udało się zaktualizować rezerwacji przez problemy techniczne na stronie. Nasz zespół nad tym pracuje. Zapraszamy wkrótce.',
    },
    'DELETE': {
      success: 'Rezerwacja została usunięta.',
      error: 'Nie udało się usunąć rezerwacji. Problemy techniczne na stronie. Prosimy o kontakt telefoniczny.',
    },
    'GET_UPDATE': {
      success: 'Edycja rezerwacji',
      error: 'Nieprawidłowy link do edycji rezerwacji! Prosimy upewnić się czy został użyty prawidłowy link i spróbować ponownie.',
    }
  },
};

export const templates = {
  menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
  cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
  bookingWidget: Handlebars.compile(document.querySelector(select.templateOf.bookingWidget).innerHTML),
};
