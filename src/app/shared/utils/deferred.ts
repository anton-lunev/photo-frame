export class Deferred<T = void> {

  private readonly promiseInstance: Promise<T>;
  private resolveCallback: (value?: T | PromiseLike<T>) => void;
  private rejectCallback: (reason?: any) => void;

  constructor() {
    this.promiseInstance = new Promise<T>((resolve, reject) => {
      this.resolveCallback = resolve;
      this.rejectCallback = reject;
    });
  }

  resolve(value?: T | PromiseLike<T>) {
    this.resolveCallback(value);
  }

  reject(reason?: any) {
    this.rejectCallback(reason);
  }

  get promise(): Promise<T> {
    return this.promiseInstance;
  }
}
