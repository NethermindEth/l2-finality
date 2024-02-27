export class Clock {
  constructor(
    private task: () => void,
    private intervalMinutes: number,
  ) {}

  start() {
    setInterval(() => {
      const now = new Date();
      if (
        now.getMinutes() % this.intervalMinutes === 0 &&
        now.getSeconds() === 0
      ) {
        this.task();
      }
    }, 1000); // Check every second
  }
}
