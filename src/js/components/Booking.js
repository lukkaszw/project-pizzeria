/* global uuid */

import { select, templates, settings, classNames, messages } from '../settings.js';
import { utils } from '../utils.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';

class Booking {
  constructor(wrapper) {
    this.render(wrapper);
    this.initWidgets();
  }

  getData() {

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
        this.parseData(booking, eventsCurrent, eventsRepeat);
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

  validateFormEl(element) {
    if(element.value.length < 1) {
      element.classList.add('error');
      return false;
    }
    element.classList.remove('error');
    return true;
  }

  checkFormValidation() {
    let isValid = (this.validateFormEl(this.dom.phone) && this.validateFormEl(this.dom.address));
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

    this.dom.submitBtn.disabled = true;

    for(let table of this.dom.tables) {
      table.addEventListener('click', (e) => this.choseTable(e.target));
    }

    this.dom.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendBooking();
    });

    this.dom.hourPicker.addEventListener('updated', () => this.resetChosenTable());

    this.dom.datePicker.addEventListener('updated', () => this.resetChosenTable());

    this.dom.phone.addEventListener('input', () => this.checkFormValidation());
    this.dom.address.addEventListener('input', () => this.checkFormValidation());

  }

  sendBooking() {
    if(!this.chosenTable) return;

    const tableId = parseInt(this.chosenTable.getAttribute(settings.booking.tableIdAttribute));

    const starters = [];
    this.dom.starters.forEach(starter => {
      if(starter.checked) starters.push(starter.value);
    });

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
      uuid: uuid.v4(),
    };

    const url = `${settings.db.url}/${settings.db.booking}`;

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
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
        console.log('Dokonano rezerwacji:', parsedResponse);
        const link = `${window.location.protocol}//${window.location.host}/#/booking/${bookingData.uuid}`;
        this.chosenTable.classList.add(classNames.booking.tableBooked);
        this.resetChosenTable();
        this.getData();
        this.generateBookingInfo(true, link);
      })
      .catch(error => {
        console.warn(error);
        this.generateBookingInfo(false);
      });

  }

  generateBookingInfo(isSuccess, link) {
    const message = isSuccess ? (
      `${messages.booking.success}
      <a href="${link}" class="booking-info__link">${link}</a>`
    ) : (
      messages.booking.error
    );
    isSuccess ? this.dom.bookingInfo.classList.remove('error') : this.dom.bookingInfo.classList.add('error');
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
