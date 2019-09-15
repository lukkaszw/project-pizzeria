/* global uuid */

import { select, templates, settings, classNames, messages } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import Validator from './Validator.js';

class Booking {
  constructor(wrapper) {
    this.render(wrapper);
    this.getElements();
    this.initWidgets();
    this.addEvents();
  }

  getData() {
    const uuid = window.location.hash.replace('#/booking','').replace('/', '');
    const isUUIDMentioned = !settings.booking.hashKeyWords.includes(uuid);

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(this.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(this.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam
      ]
    };

    const urls = {
      booking:        `${settings.db.url}/${settings.db.booking}?${params.booking.join('&')}`,
      eventsCurrent:  `${settings.db.url}/${settings.db.event}?${params.eventsCurrent.join('&')}`,
      eventsRepeat:   `${settings.db.url}/${settings.db.event}?${params.eventsRepeat.join('&')}`,
    };

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat)
    ])
      .then(allResponses => {
        const bookingResponse = allResponses[0];
        const eventsCurrentResponse = allResponses[1];
        const eventsRepeatResponse = allResponses[2];
        return Promise.all([
          bookingResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json()
        ]);
      })
      .then(([booking, eventsCurrent, eventsRepeat]) => {
        let bookingAfterFilter = booking;
        if(uuid && isUUIDMentioned) {
          this.bookingToUpdate = booking.find(oneBooking => oneBooking.uuid === uuid);
          bookingAfterFilter = booking.filter(oneBooking => oneBooking.uuid !== uuid);
          if(!this.bookingToUpdate) {
            this.generateBookingMessage(false, 'GET_UPDATE');
          }
        }
        this.parseData(bookingAfterFilter, eventsCurrent, eventsRepeat);
      });

  }

  parseData(booking, eventsCurrent, eventsRepeat) {
    this.booked = {};

    for(let item of booking) {
      this.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for(let item of eventsCurrent) {
      this.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    const minDate = this.datePicker.minDate;
    const maxDate = this.datePicker.maxDate;

    for(let item of eventsRepeat) {
      if(item.repeat === 'daily') {
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          this.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }

    this.updateDOM();

    if(this.bookingToUpdate) {
      this.renderUpdatingData();
    }

  }

  renderUpdatingData() {
    if(this.bookingToUpdate.date !== this.datePicker.value) {
      this.datePicker.picker.setDate(this.bookingToUpdate.date);
    }
    this.hourPicker.changeValue(this.bookingToUpdate.hour);
    this.chosenTable = [...this.dom.tables].find(table => {
      const tableId = parseInt(table.getAttribute(settings.booking.tableIdAttribute));
      if(tableId === this.bookingToUpdate.table) return true;
    });
    this.chosenTable.classList.add(classNames.booking.tableChosen);
    this.peopleAmount.value = this.bookingToUpdate.ppl;
    this.hoursAmount.value = this.bookingToUpdate.duration;
    this.dom.starters.forEach(starter => starter.checked = this.bookingToUpdate.starters.includes(starter.value));
    this.dom.phone.value = this.bookingToUpdate.phone;
    this.dom.address.value = this.bookingToUpdate.address;
    this.dom.submitBtn.innerHTML = settings.booking.bookTableBtn.updateName;
    this.dom.cancelUpdateBtn.classList.add(classNames.booking.btnCancelUpdateActive);
    this.dom.deleteBtn.classList.add(classNames.booking.btnDeleteActive);
    this.generateBookingMessage(true, 'GET_UPDATE');
  }

  makeBooked(date, hour, duration, table) {
    if(!this.booked[date]) {
      this.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let blockHour = startHour; blockHour < startHour + duration; blockHour += 0.5) {

      if(!this.booked[date][blockHour]) {
        this.booked[date][blockHour] = [];
      }
      this.booked[date][blockHour].push(table);

    }
  }

  checkFormValidation() {
    let isValid = (Validator.validatePhone(this.dom.phone) && Validator.validateEmail(this.dom.address));
    if(!this.chosenTable) isValid = false;
    this.dom.submitBtn.disabled = !isValid;
  }

  updateDOM() {

    this.date = this.datePicker.value;
    this.hour = utils.hourToNumber(this.hourPicker.value);

    let allAvailable = false;

    if(!this.booked[this.date] || !this.booked[this.date][this.hour]) {
      allAvailable = true;
    }

    for(let table of this.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if(!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if(!allAvailable && this.booked[this.date][this.hour].includes(tableId)) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
      }
    }

  }

  render(wrapper) {
    const generatedHTML = templates.bookingWidget();
    this.dom = {};
    this.dom.wrapper = wrapper;
    this.dom.wrapper.innerHTML = generatedHTML;
  }

  getElements() {
    this.dom.peopleAmount = this.dom.wrapper.querySelector(select.booking.peopleAmount);
    this.dom.hoursAmount = this.dom.wrapper.querySelector(select.booking.hoursAmount);
    this.dom.datePicker = this.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    this.dom.hourPicker = this.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    this.dom.tables = this.dom.wrapper.querySelectorAll(select.booking.tables);
    this.dom.starters = this.dom.wrapper.querySelectorAll(select.booking.starter);
    this.dom.phone = this.dom.wrapper.querySelector(select.booking.phone);
    this.dom.address = this.dom.wrapper.querySelector(select.booking.address);
    this.dom.form = this.dom.wrapper.querySelector(select.booking.form);
    this.dom.submitBtn = this.dom.wrapper.querySelector(select.booking.submitBtn);
    this.dom.bookingInfo = this.dom.wrapper.querySelector(select.booking.bookingInfo);
    this.dom.linkToUpdate = this.dom.wrapper.querySelector(select.booking.updateLink);
    this.dom.cancelUpdateBtn = this.dom.wrapper.querySelector(select.booking.cancelUpdate);
    this.dom.deleteBtn = this.dom.wrapper.querySelector(select.booking.deleteBtn);

    this.dom.submitBtn.disabled = true;
  }

  addEvents() {

    for(let table of this.dom.tables) {
      table.addEventListener('click', (e) => this.choseTable(e.target));
    }

    this.dom.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendBooking();
    });

    this.dom.cancelUpdateBtn.addEventListener('click', () => this.resetPanel());
    this.dom.peopleAmount.addEventListener('updated', () => this.checkFormValidation());
    this.dom.hoursAmount.addEventListener('updated', () => this.checkFormValidation());

    this.dom.hourPicker.addEventListener('updated', () => this.resetChosenTable());

    this.dom.datePicker.addEventListener('updated', () => this.resetChosenTable());

    this.dom.phone.addEventListener('input', () => this.checkFormValidation());
    this.dom.address.addEventListener('input', () => this.checkFormValidation());

    this.dom.deleteBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.deleteBooking();
    } );

    this.dom.linkToUpdate.addEventListener('click', (e) => {
      e.preventDefault();
      const path = e.target.getAttribute('href');
      const hash = path.substring(path.indexOf('#'));
      window.location.hash = hash;
      this.resetMessagePanel();
      this.getData();
    });

    this.dom.starters.forEach(starter => starter.addEventListener('change', () => this.checkFormValidation()));
  }

  resetPanel() {
    this.bookingToUpdate = null;
    window.location.hash = '#/booking';
    this.peopleAmount.value = settings.amountWidget.defaultValue;
    this.hoursAmount.value = settings.amountWidget.defaultValue;
    this.dom.tables.forEach(table => table.classList.remove(classNames.booking.tableChosen, classNames.booking.tableBooked));
    this.dom.starters.forEach(starter => starter.checked = false);
    this.hourPicker.changeValue(utils.numberToHour(settings.hours.open));
    this.datePicker.picker.setDate(this.datePicker.minDate);
    this.datePicker.value = utils.dateToStr(new Date());
    this.dom.phone.value = '';
    this.dom.address.value = '';
    this.dom.submitBtn.innerHTML = settings.booking.bookTableBtn.bookName;
    this.dom.cancelUpdateBtn.classList.remove(classNames.booking.btnCancelUpdateActive);
    this.dom.deleteBtn.classList.remove(classNames.booking.btnDeleteActive);
    this.resetMessagePanel();
    this.getData();
  }

  sendBooking() {
    if(!this.chosenTable) return;

    const tableId = parseInt(this.chosenTable.getAttribute(settings.booking.tableIdAttribute));

    const starters = [];
    this.dom.starters.forEach(starter => {
      if(starter.checked) starters.push(starter.value);
    });

    const uuidNr = this.bookingToUpdate ? this.bookingToUpdate.uuid : uuid.v4();
    const method = this.bookingToUpdate ? 'PUT' : 'POST';
    const ifId = this.bookingToUpdate ? `/${this.bookingToUpdate.id}` : '';

    const bookingData = {
      date: this.date,
      hour: this.hourPicker.value,
      table: tableId,
      repeat: false,
      duration: this.hoursAmount.value,
      ppl: this.peopleAmount.value,
      starters,
      phone: this.dom.phone.value,
      address: this.dom.address.value,
      uuid: uuidNr
    };

    let url = `${settings.db.url}/${settings.db.booking}${ifId}`;

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    };

    fetch(url, options)
      .then(response => {
        if(response.ok) {
          const link = `${window.location.protocol}//${window.location.host}/#/booking/${bookingData.uuid}`;
          this.resetChosenTable();
          if(this.bookingToUpdate) {
            this.resetPanel();
          }
          this.getData();
          this.generateBookingMessage(true, method, link);
        } else {
          throw new Error(`Error - ${response.status}`);
        }
      })
      .catch(error => {
        console.warn(error);
        this.generateBookingMessage(false, method);
      });

  }

  deleteBooking() {
    const url =  `${settings.db.url}/${settings.db.booking}/${this.bookingToUpdate.id}`;
    const options = {
      method: 'DELETE'
    };

    fetch(url, options)
      .then(response => {
        if(response.ok) {
          this.resetPanel();
          this.generateBookingMessage(true, 'DELETE');
        } else {
          throw new Error(response.status);
        }
      })
      .catch(e => {
        console.warn(e);
        this.generateBookingMessage(false, 'DELETE');
      });

  }

  generateBookingMessage(isSuccess, action, link) {
    const message = isSuccess ? messages.booking[action].success : messages.booking[action].error;
    isSuccess ? this.dom.bookingInfo.classList.remove('error') : this.dom.bookingInfo.classList.add('error');
    if(link) {
      this.dom.linkToUpdate.setAttribute('href', link);
      this.dom.linkToUpdate.innerHTML = link;
    }
    this.dom.bookingInfo.innerHTML = message;
  }

  choseTable(table) {
    if(table.classList.contains(classNames.booking.tableBooked)) return;

    for(let tableInList of this.dom.tables) {
      if(tableInList === table) {
        tableInList.classList.add(classNames.booking.tableChosen);
      } else {
        tableInList.classList.remove(classNames.booking.tableChosen);
      }
    }

    this.chosenTable = table;
    this.checkFormValidation();
  }

  resetChosenTable() {
    if(this.chosenTable) {
      this.chosenTable.classList.remove(classNames.booking.tableChosen);
      this.chosenTable = null;
      this.dom.submitBtn.disabled = true;
    }
  }

  resetMessagePanel() {
    this.dom.bookingInfo.innerHTML = '';
    this.dom.linkToUpdate.setAttribute('href', '#');
    this.dom.linkToUpdate.innerHTML = '';
  }

  initWidgets() {
    this.peopleAmount = new AmountWidget(this.dom.peopleAmount);
    this.hoursAmount = new AmountWidget(this.dom.hoursAmount);
    this.datePicker = new DatePicker(this.dom.datePicker);
    this.hourPicker = new HourPicker(this.dom.hourPicker);

    this.dom.wrapper.addEventListener('updated', () => {
      this.updateDOM();
    });
  }
}

export default Booking;
