/* global rangeSlider */

import BaseWidget from './BaseWidget.js';
import { select, settings } from '../settings.js';
import { utils } from '../utils.js';

class HourPicker extends BaseWidget {
  constructor(wrapper) {
    super(wrapper, settings.hours.open);
    this.dom.output = this.dom.wrapper.querySelector(select.widgets.hourPicker.output);
    this.initPlugin();

  }

  initPlugin() {
    this.dom.input = this.dom.wrapper.querySelector(select.widgets.hourPicker.input);
    this.slider = new rangeSlider(this.dom.input);
    this.dom.input.addEventListener('input', (e) => this.value = e.target.value);
    this.value = this.dom.input.value;
  }

  changeValue(hour) {
    const hourToNumber = utils.hourToNumber(hour);
    this.slider.update({value: hourToNumber});
  }

  parseValue(value) {
    return utils.numberToHour(value);
  }

  isValid() {
    return true;
  }

  renderValue() {
    this.dom.output.innerHTML = this.value;
  }
}

export default HourPicker;
