/**
 * MagicChecklists - Search Functionality
 * 
 * Provides real-time search filtering for checklists
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get the search input element
    const searchInput = document.getElementById('mcl-search');
    const tagFilter = document.getElementById('mcl-tag-filter');
    
    // Exit if we're not on the checklists page
    if (!searchInput) return;
    
    // Get table and table rows
    const table = document.querySelector('.mcl-table');
    const tableBody = table ? table.querySelector('tbody') : null;
    const rows = tableBody ? tableBody.querySelectorAll('tr') : [];
    
    // Exit if no table is found
    if (!table || rows.length === 0) return;
    
    // Function to filter table rows based on search input and tag filter
    function filterTable() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedTags = tagFilter ? Array.from(tagFilter.selectedOptions).map(option => option.value) : [];
        
        // Counter for visible rows
        let visibleRowCount = 0;
        
        // Filter rows based on search term and selected tags
        rows.forEach(row => {
            const title = row.querySelector('td:first-child').textContent.toLowerCase();
            const type = row.querySelector('td:nth-child(2) .mcl-type-badge').textContent.toLowerCase();
            const description = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
            const tagCells = row.querySelector('td.mcl-tags-cell');
            
            // Check if the row matches the search term
            const matchesSearch = searchTerm === '' || 
                title.includes(searchTerm) || 
                type.includes(searchTerm) ||
                description.includes(searchTerm);
            
            // Check if the row matches the selected tags
            let matchesTags = true;
            if (selectedTags.length > 0 && tagCells) {
                const tagElements = tagCells.querySelectorAll('.mcl-tag-badge');
                const rowTags = Array.from(tagElements).map(tag => tag.textContent.toLowerCase().trim());
                
                // The row should match ANY of the selected tags (OR logic)
                matchesTags = selectedTags.length === 0 || 
                    selectedTags.some(tag => 
                        rowTags.some(rowTag => rowTag === tag.toLowerCase())
                    );
            }
            
            // Show row if it matches both filters
            if (matchesSearch && matchesTags) {
                row.style.display = '';
                visibleRowCount++;
            } else {
                row.style.display = 'none';
            }
        });
        
        // Check if we need to display a no results message
        checkEmptyTable(visibleRowCount);
    }
    
    // Function to check if there are no visible rows and display a message
    function checkEmptyTable(visibleRowCount = null) {
        // If visibleRowCount is null, count the visible rows
        if (visibleRowCount === null) {
            visibleRowCount = 0;
            rows.forEach(row => {
                if (row.style.display !== 'none') {
                    visibleRowCount++;
                }
            });
        }
        
        // Remove existing no results message if it exists
        const existingMessage = tableBody.querySelector('.mcl-no-results-row');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // If no rows are visible, show a message
        if (visibleRowCount === 0) {
            const noResultsRow = document.createElement('tr');
            noResultsRow.className = 'mcl-no-results-row';
            
            const noResultsCell = document.createElement('td');
            noResultsCell.colSpan = table.querySelector('thead tr').childElementCount; // Span all columns
            noResultsCell.textContent = 'No checklists match your search criteria.';
            
            noResultsRow.appendChild(noResultsCell);
            tableBody.appendChild(noResultsRow);
        }
    }
    
    // Add event listener for search input
    searchInput.addEventListener('input', filterTable);
    searchInput.addEventListener('search', filterTable);
    
    // Add event listener for tag filter if it exists
    if (tagFilter) {
        // Listen for native select change event
        tagFilter.addEventListener('change', filterTable);
        
        // Listen for Choices.js events if Choices is initialized
        if (typeof Choices !== 'undefined' && tagFilter.classList.contains('choices__input')) {
            // Get the Choices instance that might have been created in mcl-main.js
            tagFilter.addEventListener('removeItem', filterTable);
            tagFilter.addEventListener('addItem', filterTable);
        }
    }
}); 