import { classNames } from '../settings.js';
import { utils } from '../utils.js';

class Validator {

  static setElementClass(element, isValid, invalidClass) {
    if(isValid) {
      element.classList.remove(invalidClass);
      return true;
    }
    element.classList.add(invalidClass);
    return false;
  }

  static validateEmail(element, invalidClass = classNames.validation.invalid) {
    const isValid = utils.regexEmail(element.value);
    return Validator.setElementClass(element, isValid, invalidClass);
  }

  static validatePhone(element, invalidClass = classNames.validation.invalid) {
    const isValid = utils.regexPhoneNumber(element.value);
    return Validator.setElementClass(element, isValid, invalidClass);
  }

  static validateAddress(element, invalidClass = classNames.validation.invalid) {
    const isValid = element.value.length > 8;
    return Validator.setElementClass(element, isValid, invalidClass);
  }
}

export default Validator;


