export class CountdownManager {
    constructor(drawer) {
        this.drawer = drawer;
        this.countdownInterval = null;
        this.itemIntervals = new Map();
    }

    init() {
        this.clearCountdown();
        this.clearAllItemCountdowns();
    }

    startCountdown(deadline) {
        this.clearCountdown();

        const countdownElement = this.drawer.drawerContent.querySelector('#mcl-countdown');
        if (!countdownElement) return;

        const updateCountdown = () => {
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

    startItemCountdown(listItem, deadline) {
        if (!listItem || !deadline) return;

        const itemId = listItem.getAttribute('data-item-id');
        this.clearItemCountdown(itemId);

        const countdownElement = listItem.querySelector('.mcl-item-deadline-countdown');
        if (!countdownElement) {
            const container = document.createElement('div');
            container.className = 'mcl-item-deadline-container';
            container.style.display = 'block';
            container.innerHTML = `<span class="mcl-item-deadline-countdown"></span>`;
            listItem.appendChild(container);
        }

        const updateItemCountdown = () => {
            const now = new Date();
            const distance = deadline - now.getTime();

            // Remove existing deadline classes
            listItem.classList.remove(
                'mcl-deadline-24h',
                'mcl-deadline-2h',
                'mcl-deadline-passed'
            );

            // Always use compact format for items, even when passed
            if (distance < 0) {
                listItem.classList.add('mcl-deadline-passed');
                countdownElement.textContent = 'Deadline passed';
                this.clearItemCountdown(itemId);
                return;
            }

            // Calculate time units
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            // Format countdown text
            let countdownText;
            if (days > 0) {
                countdownText = `${days}d ${hours}h`;
            } else if (hours > 0) {
                countdownText = `${hours}h ${minutes}m`;
            } else {
                countdownText = `${minutes}m`;
            }

            countdownElement.textContent = countdownText;
            this.updateItemDeadlineWarnings(listItem, distance);
        };

        updateItemCountdown();
        const interval = setInterval(updateItemCountdown, 60000); // Update every minute
        this.itemIntervals.set(itemId, interval);
    }

    formatCountdown(days, hours, minutes, seconds) {
        const parts = [];
        
        if (days > 0) parts.push(`${days}d`);
        if (hours > 0 || days > 0) parts.push(`${hours}h`);
        if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
        parts.push(`${seconds}s`);

        return parts.join(' ');
    }

    formatItemCountdown(distance) {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        if (days > 0) return `${days}d ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }

    updateDeadlineWarnings(distance) {
        if (distance < 7200000) {  // 2 hours
            this.drawer.drawer.classList.add('mcl-deadline-2h');
        }
        else if (distance < 86400000) {  // 24 hours
            this.drawer.drawer.classList.add('mcl-deadline-24h');
        }
    }

    updateItemDeadlineWarnings(listItem, distance) {
        if (distance < 7200000) { // 2 hours
            listItem.classList.add('mcl-deadline-2h');
        }
        else if (distance < 86400000) { // 24 hours
            listItem.classList.add('mcl-deadline-24h');
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

    clearItemCountdown(itemId) {
        const interval = this.itemIntervals.get(itemId);
        if (interval) {
            clearInterval(interval);
            this.itemIntervals.delete(itemId);
        }
    }

    clearAllItemCountdowns() {
        this.itemIntervals.forEach(interval => clearInterval(interval));
        this.itemIntervals.clear();
    }

    destroy() {
        this.clearCountdown();
        this.clearAllItemCountdowns();
    }
}