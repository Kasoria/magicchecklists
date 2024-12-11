import { AjaxUtils, PriorityUtils} from '../common/mcl-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const MainAdmin = {
        init() {
            this.initToggleSwitches();
            this.initSortableColumns();
            this.initPriorityIndicators();
            this.initDeleteButtons();
            this.initCloneButtons();
            this.initTagFilter();
        },

        initToggleSwitches() {
            document.querySelectorAll('.mcl-toggle-active').forEach(toggle => {
                toggle.addEventListener('change', async (e) => {
                    e.preventDefault();
                    const isChecked = e.target.checked;
                    const checklistId = e.target.getAttribute('data-checklist-id');
                    const nonce = e.target.getAttribute('data-nonce'); // Get nonce from data attribute
                    
                    try {
                        // Disable the toggle while processing
                        toggle.disabled = true;
                        
                        const response = await AjaxUtils.postData('mcl_toggle_active', {
                            checklist_id: checklistId,
                            active: isChecked ? 1 : 0,
                            _ajax_nonce: nonce // Pass the nonce from the element
                        });
        
                        if (response.success) {
                            // Don't show success message, just reload
                            window.location.reload();
                        } else {
                            // Show error message and revert toggle
                            toggle.checked = !isChecked;
                            toggle.disabled = false;
                            alert(response.data?.message || mclAdmin.i18n.errorUpdatingStatus);
                        }
                    } catch (error) {
                        // Handle network/other errors
                        console.error('Toggle error:', error);
                        toggle.checked = !isChecked;
                        toggle.disabled = false;
                        alert(mclAdmin.i18n.errorUpdatingStatus);
                    }
                });
            });
        },

        initSortableColumns() {
            const table = document.querySelector('.mcl-table');
            if (!table) return;

            const headers = table.querySelectorAll('th.sortable');
            headers.forEach(header => {
                header.addEventListener('click', () => this.handleSort(header));
            });
        },

        initPriorityIndicators() {
            const table = document.querySelector('.mcl-table');
            if (!table) return;

            // Set initial colors for priority badges
            table.querySelectorAll('.mcl-priority-badge').forEach(badge => {
                const priority = badge.textContent.trim().toLowerCase();
                badge.style.backgroundColor = mclAdmin.priorityColors[priority] || mclAdmin.priorityColors.none;
            });
        },

        initDeleteButtons() {
            document.querySelectorAll('.mcl-delete').forEach(button => {
                button.addEventListener('click', (e) => this.handleDelete(e));
            });
        },

        initCloneButtons() {
            document.querySelectorAll('.mcl-clone').forEach(button => {
                button.addEventListener('click', (e) => this.handleClone(e));
            });
        },

        handleSort(header) {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rows = Array.from(tbody.querySelectorAll('tr'));
            const sortBy = header.dataset.sort;
            const isAsc = !header.classList.contains('sort-asc');

            // Remove sort classes from all headers
            table.querySelectorAll('th').forEach(th => {
                th.classList.remove('sort-asc', 'sort-desc');
            });

            // Add sort class to clicked header
            header.classList.add(isAsc ? 'sort-asc' : 'sort-desc');

            // Sort rows
            const sortedRows = this.sortRows(rows, sortBy, isAsc);

            // Update table
            tbody.innerHTML = '';
            sortedRows.forEach(row => tbody.appendChild(row));

            // Refresh event listeners on sorted rows
            this.refreshRowEventListeners();
        },

        sortRows(rows, sortBy, isAsc) {
            return rows.sort((a, b) => {
                let aVal, bVal;

                switch(sortBy) {
                    case 'priority':
                        const priorityOrder = {
                            'critical': 5,
                            'high': 4,
                            'medium': 3,
                            'low': 2,
                            'none': 1
                        };
                        
                        const aPriority = a.querySelector('.mcl-priority-badge').textContent.trim().toLowerCase();
                        const bPriority = b.querySelector('.mcl-priority-badge').textContent.trim().toLowerCase();
                        aVal = priorityOrder[aPriority] || 1;
                        bVal = priorityOrder[bPriority] || 1;
                        break;

                    case 'title':
                        aVal = a.querySelector('td').textContent.trim().toLowerCase();
                        bVal = b.querySelector('td').textContent.trim().toLowerCase();
                        break;

                    default:
                        aVal = a.cells[0].textContent.trim().toLowerCase();
                        bVal = b.cells[0].textContent.trim().toLowerCase();
                }

                if (typeof aVal === 'string') {
                    return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
                }
                return isAsc ? aVal - bVal : bVal - aVal;
            });
        },

        refreshRowEventListeners() {
            // Refresh delete button listeners
            this.initDeleteButtons();
            
            // Refresh clone button listeners
            this.initCloneButtons();
            
            // Refresh toggle switch listeners
            this.initToggleSwitches();
        },

        handleDelete(e) {
            // Don't show confirmation if it's handled by onclick attribute
            if (e.target.hasAttribute('onclick')) return;

            if (!confirm(mclAdmin.i18n.deleteConfirm)) {
                e.preventDefault();
            }
        },

        handleClone(e) {
            // Prevent multiple rapid clicks
            const button = e.target.closest('.mcl-clone');
            if (button.classList.contains('mcl-processing')) {
                e.preventDefault();
                return;
            }

            button.classList.add('mcl-processing');
            
            // Remove processing class after animation completes
            setTimeout(() => {
                button.classList.remove('mcl-processing');
            }, 1000);
        },

        // Helper method to update UI after toggle state changes
        updateToggleState(checkbox, isActive) {
            const row = checkbox.closest('tr');
            const statusCell = row.querySelector('.mcl-status');
            
            if (statusCell) {
                statusCell.textContent = isActive ? 'Active' : 'Inactive';
                statusCell.className = `mcl-status ${isActive ? 'mcl-status-active' : 'mcl-status-inactive'}`;
            }
        },

        // Helper method to show loading state
        setLoadingState(element, isLoading) {
            if (isLoading) {
                element.classList.add('mcl-loading');
                element.disabled = true;
            } else {
                element.classList.remove('mcl-loading');
                element.disabled = false;
            }
        },

        // Inside MainAdmin class
        initTagFilter() {
            const tagFilter = document.getElementById('mcl-tag-filter');
            if (!tagFilter) return;
        
            const choices = new Choices(tagFilter, {
                removeItemButton: true,
                searchResultLimit: 10,
                shouldSort: false,
                placeholder: true,
                placeholderValue: 'Click here to filter by tags',
                searchPlaceholderValue: 'Type to search tags',
            });
        
            tagFilter.addEventListener('change', () => {
                const selectedTags = choices.getValue().map(choice => choice.value);
                const rows = document.querySelectorAll('.mcl-table tbody tr');
        
                rows.forEach(row => {
                    const tagCell = row.querySelector('.mcl-tags-cell');
                    if (selectedTags.length === 0) {
                        row.style.display = '';
                        return;
                    }
        
                    const tagBadges = tagCell.querySelectorAll('.mcl-tag-badge');
                    const rowTags = Array.from(tagBadges).map(badge => badge.textContent.trim());
                    
                    // Show row if it has ANY of the selected tags
                    const hasAnyTag = selectedTags.some(tag => rowTags.includes(tag));
                    row.style.display = hasAnyTag ? '' : 'none';
                });
            });
        }
    };

    MainAdmin.init();
});