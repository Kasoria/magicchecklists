/**
 * MagicChecklists Dashboard Widget JavaScript (Vanilla JS)
 */
(function() {
    'use strict';

    class MCLDashboardWidget {
        constructor() {
            this.init();
        }

        init() {
            this.bindEvents();
        }

        bindEvents() {
            document.addEventListener('click', this.handleToggleClick.bind(this));
            document.addEventListener('change', this.handleCheckboxChange.bind(this));
        }

        handleToggleClick(event) {
            const button = event.target.closest('.mcl-widget-toggle-btn');
            if (!button) return;
            event.preventDefault();

            const checklistId = button.getAttribute('data-checklist-id');
            const currentState = parseInt(button.getAttribute('data-current-state'), 10);
            const newState = currentState === 1 ? 0 : 1;

            if (button.classList.contains('loading')) return;

            this.setButtonLoading(button, true);

            const data = new URLSearchParams();
            data.append('action', 'mcl_widget_toggle_checklist');
            data.append('checklist_id', checklistId);
            data.append('new_state', newState);
            data.append('nonce', window.mclDashboardWidget.nonce);

            fetch(window.mclDashboardWidget.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: data.toString()
            })
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    this.updateChecklistUI(button, newState);
                    this.showNotice('success', response.data.message);
                } else {
                    this.showNotice('error', response.data.message || window.mclDashboardWidget.i18n.error);
                }
            })
            .catch(() => {
                this.showNotice('error', window.mclDashboardWidget.i18n.error);
            })
            .finally(() => {
                this.setButtonLoading(button, false);
            });
        }

        handleCheckboxChange(event) {
            const checkbox = event.target;
            if (!checkbox.matches('.mcl-widget-checkbox')) return;
            const item = checkbox.closest('.mcl-widget-item');
            const checklistId = item.getAttribute('data-checklist-id');
            const itemId = item.getAttribute('data-item-id');
            const checked = checkbox.checked;

            if (item.classList.contains('loading')) return;

            item.classList.add('loading');
            checkbox.disabled = true;

            const data = new URLSearchParams();
            data.append('action', 'mcl_widget_toggle_item');
            data.append('checklist_id', checklistId);
            data.append('item_id', itemId);
            data.append('checked', checked ? 1 : 0);
            data.append('nonce', window.mclDashboardWidget.nonce);

            fetch(window.mclDashboardWidget.ajaxurl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
                },
                body: data.toString()
            })
            .then(response => response.json())
            .then(response => {
                if (response.success) {
                    this.updateItemUI(item, checked);
                } else {
                    checkbox.checked = !checked;
                    this.showNotice('error', response.data.message || window.mclDashboardWidget.i18n.error);
                }
            })
            .catch(() => {
                checkbox.checked = !checked;
                this.showNotice('error', window.mclDashboardWidget.i18n.error);
            })
            .finally(() => {
                item.classList.remove('loading');
                checkbox.disabled = false;
            });
        }

        updateItemUI(item, checked) {
            if (checked) {
                item.classList.add('mcl-widget-item-checked');
            } else {
                item.classList.remove('mcl-widget-item-checked');
            }

            item.classList.add('mcl-widget-item-updated');
            setTimeout(() => {
                item.classList.remove('mcl-widget-item-updated');
            }, 300);
        }

        setButtonLoading(button, loading) {
            if (loading) {
                button.classList.add('loading');
                button.disabled = true;
                const currentState = parseInt(button.getAttribute('data-current-state'), 10);
                button.textContent = currentState === 1 ?
                    window.mclDashboardWidget.i18n.deactivating :
                    window.mclDashboardWidget.i18n.activating;
            } else {
                button.classList.remove('loading');
                button.disabled = false;
            }
        }

        updateChecklistUI(button, newState) {
            const checklist = button.closest('.mcl-widget-checklist');
            const status = checklist.querySelector('.mcl-widget-status');

            button.setAttribute('data-current-state', newState);
            button.classList.remove('active', 'inactive');
            button.classList.add(newState === 1 ? 'active' : 'inactive');
            button.textContent = newState === 1 ?
                (window.mclDashboardWidget.i18n.deactivate || 'Deactivate') :
                (window.mclDashboardWidget.i18n.activate || 'Activate');

            status.classList.remove('mcl-status-active', 'mcl-status-inactive');
            status.classList.add(newState === 1 ? 'mcl-status-active' : 'mcl-status-inactive');
            status.textContent = newState === 1 ? 'Active' : 'Inactive';

            checklist.classList.add('mcl-widget-updated');
            setTimeout(() => {
                checklist.classList.remove('mcl-widget-updated');
            }, 2000);
        }

        showNotice(type, message) {
            const noticesArea = document.querySelector('.wrap h1');
            if (!noticesArea) {
                alert(message);
                return;
            }

            const noticeClass = type === 'success' ? 'notice-success' : 'notice-error';
            const notice = document.createElement('div');
            notice.className = `notice ${noticeClass} is-dismissible mcl-widget-notice`;

            const p = document.createElement('p');
            p.textContent = message;
            notice.appendChild(p);

            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'notice-dismiss';
            button.innerHTML = '<span class="screen-reader-text">Dismiss this notice.</span>';
            notice.appendChild(button);

            document.querySelectorAll('.mcl-widget-notice').forEach(el => el.remove());
            noticesArea.insertAdjacentElement('afterend', notice);

            button.addEventListener('click', function() {
                notice.style.transition = 'opacity 0.3s';
                notice.style.opacity = '0';
                setTimeout(() => notice.remove(), 300);
            });

            if (type === 'success') {
                setTimeout(() => {
                    notice.style.transition = 'opacity 0.3s';
                    notice.style.opacity = '0';
                    setTimeout(() => notice.remove(), 300);
                }, 3000);
            }

            this.scrollToNotice(notice);
        }

        scrollToNotice(notice) {
            const noticeTop = notice.getBoundingClientRect().top + window.scrollY;
            const windowTop = window.scrollY;
            const windowHeight = window.innerHeight;

            if (noticeTop < windowTop || noticeTop > windowTop + windowHeight) {
                window.scrollTo({ top: noticeTop - 100, behavior: 'smooth' });
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new MCLDashboardWidget();
    });

    const style = document.createElement('style');
    style.type = 'text/css';
    style.textContent = `
        .mcl-widget-updated { animation: mcl-widget-pulse 0.5s ease-in-out; }
        .mcl-widget-item-updated { animation: mcl-widget-item-pulse 0.3s ease-in-out; }
        .mcl-widget-item.loading { opacity: 0.6; pointer-events: none; }
        @keyframes mcl-widget-pulse { 0% { background-color: transparent; } 50% { background-color: rgba(34, 113, 177, 0.1); } 100% { background-color: transparent; } }
        @keyframes mcl-widget-item-pulse { 0% { background-color: transparent; } 50% { background-color: rgba(70, 180, 80, 0.1); } 100% { background-color: transparent; } }
    `;
    document.head.appendChild(style);
})();