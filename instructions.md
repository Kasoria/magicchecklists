## Introduction

You are extending a WordPress plugin that allows users to create and manage checklists.

## Requirements

Use the existing code as a guide to implement the following:

- Add a new functionality to allow users to nest list items.
- Start with the edit-checklist.php file.
- Adjust the mcl-edit.js, mcl-edit.css, and mcl-edit.php files to accommodate the new functionality.
- Also adjust the saving method inside the class-mcl-admin.php file to save the nested list items.
- You have to rethink how list items are saved.
- If a drag and drop functionality is too complicated, then don't do it.
- First focus on implementing the nesting functionality with a button or dropdown to nest list items.
- The dropdown should include all existing list items in the current checklist.
- When a parent list item is selected, the child list items should be nested under the parent list item visually.
- A parent must be able to have multiple children.
- Children must be indented to visually show that they are nested.
- Users must be able to remove a child list item from the parent list item, so it turns into a standalone (parent) list item.
- We also have a sortable list of list items. Meaning, the list items can be dragged and dropped to change the order.
- Child items must stick to the parent item when the parent is moved up and down in the list.