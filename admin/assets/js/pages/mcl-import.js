import { ValidationUtils } from '../common/mcl-utils.js';

document.addEventListener('DOMContentLoaded', function() {
    const ImportChecklist = {
        init() {
            this.initFormHandling();
            this.initTextareaHandling();
        },

        initFormHandling() {
            const form = document.querySelector('.mcl-import-form');
            if (!form) return;

            form.addEventListener('submit', (e) => this.handleSubmit(e));
        },

        initTextareaHandling() {
            const textarea = document.getElementById('mcl_import_textarea');
            if (!textarea) return;

            // Add paste handling to clean up pasted content
            textarea.addEventListener('paste', (e) => this.handlePaste(e));

            // Auto-resize textarea based on content
            textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));

            // Handle tab key for indentation
            textarea.addEventListener('keydown', (e) => this.handleTabKey(e));
        },

        handleSubmit(e) {
            const textarea = document.getElementById('mcl_import_textarea');
            if (!textarea) return;

            const lines = textarea.value.trim().split('\n');
            const nonEmptyLines = lines.filter(line => line.trim().length > 0);

            if (nonEmptyLines.length === 0) {
                e.preventDefault();
                ValidationUtils.showError(
                    document.querySelector('.mcl-error') || this.createErrorElement(textarea),
                    'Please enter at least one item'
                );
                return;
            }

            // Clean up the textarea value before submission
            textarea.value = nonEmptyLines.join('\n');
        },

        handlePaste(e) {
            e.preventDefault();

            // Get pasted content
            let pastedText = (e.clipboardData || window.clipboardData).getData('text');

            // Clean up the pasted content
            pastedText = this.cleanupPastedContent(pastedText);

            // Insert at cursor position
            const textarea = e.target;
            const startPos = textarea.selectionStart;
            const endPos = textarea.selectionEnd;

            textarea.value = 
                textarea.value.substring(0, startPos) +
                pastedText +
                textarea.value.substring(endPos);

            // Update cursor position
            textarea.selectionStart = textarea.selectionEnd = startPos + pastedText.length;

            // Trigger auto-resize
            this.autoResizeTextarea(textarea);
        },

        handleTabKey(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                
                const textarea = e.target;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;

                // Insert tab
                textarea.value = 
                    textarea.value.substring(0, start) +
                    '\t' +
                    textarea.value.substring(end);

                // Put cursor after tab
                textarea.selectionStart = textarea.selectionEnd = start + 1;
            }
        },

        cleanupPastedContent(text) {
            // Remove any excessive whitespace or empty lines
            return text
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 0)
                .join('\n');
        },

        autoResizeTextarea(textarea) {
            // Reset height to allow shrinking
            textarea.style.height = 'auto';
            
            // Calculate required height
            const newHeight = Math.max(
                200, // Minimum height
                Math.min(
                    textarea.scrollHeight, // Content height
                    600 // Maximum height
                )
            );
            
            textarea.style.height = newHeight + 'px';
        },

        createErrorElement(textarea) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'mcl-error';
            textarea.parentNode.insertBefore(errorDiv, textarea.nextSibling);
            return errorDiv;
        }
    };

    ImportChecklist.init();
});