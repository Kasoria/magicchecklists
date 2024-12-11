export class CountdownManager {
  constructor(drawer) {
      this.drawer = drawer;
      this.countdownInterval = null;
  }

  init() {
      this.clearCountdown();
  }

  startCountdown(deadline) {
    this.clearCountdown();

    const countdownElement = this.drawer.drawerContent.querySelector('#mcl-countdown');
    if (!countdownElement) return;

    const updateCountdown = () => {
        // Create Date object in UTC from the Unix timestamp
        const targetDate = new Date(deadline);
        targetDate.setTime(targetDate.getTime() + targetDate.getTimezoneOffset() * 60000);
        
        const now = new Date();
        const distance = targetDate - now;

        this.drawer.drawer.classList.remove(
            'mcl-deadline-24h',
            'mcl-deadline-2h',
            'mcl-deadline-passed'
        );

        if (distance < 0) {
            const deadlineDate = new Date(deadline);
            deadlineDate.setTime(deadlineDate.getTime() + deadlineDate.getTimezoneOffset() * 60000);
            countdownElement.textContent = `Deadline passed (${deadlineDate.toLocaleString()})`;
            this.drawer.drawer.classList.add('mcl-deadline-passed');
            this.clearCountdown();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const countdownText = this.formatCountdown(days, hours, minutes, seconds);
        countdownElement.textContent = countdownText;

        this.updateDeadlineWarnings(distance);
    };

    updateCountdown();
    this.countdownInterval = setInterval(updateCountdown, 1000);
    this.drawer.drawer.setAttribute('data-countdown-interval', this.countdownInterval);
  }

  formatCountdown(days, hours, minutes, seconds) {
      const parts = [];
      
      if (days > 0) parts.push(`${days}d`);
      if (hours > 0 || days > 0) parts.push(`${hours}h`);
      if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
      parts.push(`${seconds}s`);

      return parts.join(' ');
  }

  updateDeadlineWarnings(distance) {
      if (distance < 7200000) {  // 2 hours
          this.drawer.drawer.classList.add('mcl-deadline-2h');
      }
      else if (distance < 86400000) {  // 24 hours
          this.drawer.drawer.classList.add('mcl-deadline-24h');
      }
  }

  clearCountdown() {
      if (this.countdownInterval) {
          clearInterval(this.countdownInterval);
          this.countdownInterval = null;
      }

      const countdownInterval = this.drawer.drawer.getAttribute('data-countdown-interval');
      if (countdownInterval) {
          clearInterval(parseInt(countdownInterval));
          this.drawer.drawer.removeAttribute('data-countdown-interval');
      }
  }
}