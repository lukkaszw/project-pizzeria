/* global flatpickr */

import BaseWidget from './BaseWidget.js';
import { select, settings } from '../settings.js';
import { utils } from '../utils.js';

class DatePicker extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, utils.dateToStr(new Date()));
    this.dom.input = this.dom.wrapper.querySelector(select.widgets.datePicker.input);
    this.initPlugin();
  }

  initPlugin() {
    const thisDatePicker = this;
    this.minDate = new Date(this.value);
    this.maxDate = utils.addDays(this.minDate, settings.datePicker.maxDaysInFuture);

    flatpickr(this.dom.input, {
      defaultDate: this.minDate,
      minDate: this.minDate,
      maxDate: this.maxDate,
      'disable': [
        function(date) {
          return (date.getDay() === 1);
        }
      ],
      'locale': {
        'firstDayOfWeek': 1
      },
      onChange: (selectedDates, dateStr) => {
        thisDatePicker.value = dateStr;
      }
    });
  }

  /*

  W tym przypadku jest taka sytuacja, że użytkownik będzie mógł zmienić datę tylko poprzez ten plugin, który sam z siebie generuje datę w porządku.
  Tutaj nie wiedziałem czy właśnie zmienić trzy odziedziczone metody, które warunkują poprawne wykonanie się settera tak jak zrobiłem poniżej, czy zamienić samego settera na np.:

  set value(dateStr) {
    this.correctValue = dateStr;
  }

  tylko, że wtedy odziedziczone parseValue, isValid i renderValue praktycznie sie nie nadają do użycia w tej klasie, ale i nie muszę ich używać. Natomiast inny developer mógłby mieć problem z tym, gdyby chciał ich użyc w przyszłości.
   Gdy zmieniam te trzy poniżej, to wszystkie odziedziczone i nadpisane metody nadają się do użytku, choć praktycznie są w tej chwili niepotrzebne - są zmienione tylko tak by setter mógł się wykonać.
   To chciałbym poruszyć na rozmowie. Co robić w takiej sytuacji?

  */
  parseValue(value) {
    return value;
  }

  isValid() {
    return true;
  }

  renderValue() {
    return true;
  }


}

export default DatePicker;
