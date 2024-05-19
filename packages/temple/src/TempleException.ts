import type { ErrorList } from './types/Exception';
import Exception from './types/Exception';

/**
 * Exceptions are used to give more information
 * of an error that has occured
 */
export default class TempleException extends Exception {
  /**
   * General use expressive reasons
   */
  static for(message: string, ...values: string[]) {
    values.forEach(function(value) {
      message = message.replace('%s', value);
    });

    return new this(message);
  }

  /**
   * Expressive error report
   */
  static forErrorsFound(errors: ErrorList): Exception {
    const exception = new this('Invalid Parameters');
    exception.errors = errors;
    return exception;
  }

  /**
   * Requires that the condition is true
   */
  static require(
    condition: boolean, 
    message: string, 
    ...values: any[]
  ): void {
    if (!condition) {
      for (const value of values) {
        message = message.replace('%s', value);
      } 

      throw new this(message);
    }
  }
}