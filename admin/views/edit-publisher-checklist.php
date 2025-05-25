<?php
if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

$checklist_id = isset( $_GET['checklist_id'] ) ? intval( $_GET['checklist_id'] ) : 0;
$checklist = null;

if ( $checklist_id ) {
    $checklist = get_post( $checklist_id );
    $requirements = MCL_DB_Manager::get_publisher_requirements($checklist_id);
    $post_types = get_post_meta($checklist_id, '_mcl_publisher_post_types', true) ?: array();
    $active = get_post_meta($checklist_id, '_mcl_active', true);
} else {
    $requirements = array();
    $post_types = array();
    $active = 0;
}

$default_requirements = MCL_DB_Manager::get_default_publisher_requirements();
?>

<div class="mcl-wrap">
    <div class="mcl-header">
        <div class="mcl-title-wrapper">
            <div class="mcl-title-container">
                <h1 class="mcl-title">
                    <?php echo $checklist_id ? esc_html__('Edit Publisher Checklist', 'magic-checklists') : esc_html__('Add New Publisher Checklist', 'magic-checklists'); ?>
                </h1>
                <div class="mcl-intro">
                    <p class="mcl-description mcl-description-light">
                        <?php esc_html_e('Configure automatic requirements that will be checked when creating or editing posts and pages. Items marked as required will prevent publishing until they are satisfied.', 'magic-checklists'); ?>
                    </p>
                </div>
            </div>
            <div class="mcl-actions">
                <a href="<?php echo admin_url('admin.php?page=mcl_checklists'); ?>" class="mcl-button mcl-button-secondary">
                    <span class="dashicons dashicons-arrow-left-alt"></span>
                    <?php esc_html_e('Back to Checklists', 'magic-checklists'); ?>
                </a>
                <button type="submit" class="mcl-button mcl-button-primary mcl-submit-form">
                    <?php echo $checklist_id ? esc_html__('Update Publisher Checklist', 'magic-checklists') : esc_html__('Create Publisher Checklist', 'magic-checklists'); ?>
                </button>
            </div>
        </div>
    </div>

    <div class="mcl-content">
        <form method="post" action="<?php echo admin_url('admin-post.php'); ?>" class="mcl-form" id="mcl-publisher-form">
            <?php wp_nonce_field('mcl_save_publisher_checklist', 'mcl_nonce'); ?>
            <input type="hidden" name="action" value="save_publisher_checklist">
            <input type="hidden" name="checklist_id" value="<?php echo esc_attr($checklist_id); ?>">
            <input type="hidden" name="checklist_type" value="publisher">

            <div class="mcl-publisher-content">
                <!-- Basic Settings Section -->
                <div class="mcl-form-section">
                    <h2 class="mcl-section-title">
                        <span class="mcl-section-icon">⚙️</span>
                        <?php esc_html_e('Basic Settings', 'magic-checklists'); ?>
                    </h2>
                    
                    <div class="mcl-form-group">
                        <label for="mcl_title" class="mcl-label"><?php esc_html_e('Checklist Name', 'magic-checklists'); ?> <span class="required">*</span></label>
                        <input 
                            name="title" 
                            type="text" 
                            id="mcl_title" 
                            value="<?php echo esc_attr($checklist ? $checklist->post_title : ''); ?>" 
                            class="mcl-input" 
                            required
                            placeholder="<?php esc_attr_e('e.g., Content Quality Standards', 'magic-checklists'); ?>"
                        >
                        <p class="mcl-description">
                            <?php esc_html_e('This name will be shown in the Gutenberg sidebar when editing posts/pages.', 'magic-checklists'); ?>
                        </p>
                    </div>

                    <div class="mcl-form-group">
                        <label for="mcl_description" class="mcl-label"><?php esc_html_e('Description', 'magic-checklists'); ?></label>
                        <textarea 
                            name="description" 
                            id="mcl_description" 
                            class="mcl-textarea"
                            placeholder="<?php esc_attr_e('Describe the purpose of this checklist...', 'magic-checklists'); ?>"
                        ><?php echo esc_textarea($checklist ? $checklist->post_content : ''); ?></textarea>
                    </div>

                    <div class="mcl-form-group">
                        <label class="mcl-label"><?php esc_html_e('Apply to Post Types', 'magic-checklists'); ?> <span class="required">*</span></label>
                        <div class="mcl-checkbox-group mcl-post-types">
                            <?php
                            $available_post_types = get_post_types(array('public' => true), 'objects');
                            foreach ($available_post_types as $post_type_key => $post_type_obj) :
                                // Skip attachments and other non-editable types
                                if (in_array($post_type_key, array('attachment'))) continue;
                            ?>
                                <label class="mcl-checkbox-label">
                                    <input type="checkbox" 
                                        name="post_types[]" 
                                        value="<?php echo esc_attr($post_type_key); ?>" 
                                        <?php checked(in_array($post_type_key, $post_types)); ?>>
                                    <?php echo esc_html($post_type_obj->labels->name); ?>
                                </label>
                            <?php endforeach; ?>
                        </div>
                        <p class="mcl-description">
                            <?php esc_html_e('Select which post types this checklist should apply to.', 'magic-checklists'); ?>
                        </p>
                    </div>

                    <div class="mcl-form-group">
                        <label for="mcl_active" class="mcl-label"><?php esc_html_e('Active Status', 'magic-checklists'); ?></label>
                        <div class="mcl-toggle-wrapper">
                            <div class="mcl-toggle-switch">
                                <input name="active" type="checkbox" id="mcl_active" value="1" <?php checked($active, 1); ?>>
                                <label for="mcl_active" class="mcl-switch-label"></label>
                            </div>
                            <p class="mcl-description">
                                <?php esc_html_e('When active, this checklist will be shown in the Gutenberg editor for the selected post types.', 'magic-checklists'); ?>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Requirements Section -->
                <div class="mcl-form-section">
                    <h2 class="mcl-section-title">
                        <span class="mcl-section-icon">✅</span>
                        <?php esc_html_e('Content Requirements', 'magic-checklists'); ?>
                    </h2>
                    <p class="mcl-section-description">
                        <?php esc_html_e('Configure automatic checks that will verify content quality. Required items will prevent publishing until satisfied.', 'magic-checklists'); ?>
                    </p>

                    <div class="mcl-requirements-container">
                        <?php 
                        // Group existing requirements by type for repeatable items
                        $existing_by_type = array();
                        foreach ($requirements as $req) {
                            if (!isset($existing_by_type[$req['type']])) {
                                $existing_by_type[$req['type']] = array();
                            }
                            $existing_by_type[$req['type']][] = $req;
                        }

                        foreach ($default_requirements as $req_type => $req_def): 
                            $is_repeatable = isset($req_def['repeatable']) && $req_def['repeatable'];
                            $existing_instances = isset($existing_by_type[$req_type]) ? $existing_by_type[$req_type] : array();
                        ?>
                            
                            <div class="mcl-requirement-group" data-type="<?php echo esc_attr($req_type); ?>" data-repeatable="<?php echo $is_repeatable ? 'true' : 'false'; ?>">
                                <div class="mcl-requirement-group-header">
                                    <h3 class="mcl-requirement-group-title">
                                        <?php echo esc_html($req_def['label']); ?>
                                        <?php if ($is_repeatable): ?>
                                            <span class="mcl-repeatable-badge">Repeatable</span>
                                        <?php endif; ?>
                                    </h3>
                                    <?php if ($is_repeatable): ?>
                                        <button type="button" class="mcl-add-instance-btn" data-type="<?php echo esc_attr($req_type); ?>">
                                            <span class="dashicons dashicons-plus-alt"></span>
                                            Add <?php echo esc_html($req_def['label']); ?>
                                        </button>
                                    <?php endif; ?>
                                </div>
                                <p class="mcl-requirement-group-description">
                                    <?php echo esc_html($req_def['description']); ?>
                                </p>
                                
                                <div class="mcl-instances-container">
                                    <?php if ($is_repeatable): ?>
                                        <?php if (!empty($existing_instances)): ?>
                                            <?php foreach ($existing_instances as $index => $existing_req): ?>
                                                <?php
                                                $instance_id = $existing_req['instance_id'] ?: uniqid();
                                                $is_enabled = true;
                                                $is_required = $existing_req['required'];
                                                $config = $existing_req['config'];
                                                ?>
                                                <div class="mcl-requirement-instance" data-instance-id="<?php echo esc_attr($instance_id); ?>">
                                                    <?php include 'partials/requirement-instance.php'; ?>
                                                </div>
                                            <?php endforeach; ?>
                                        <?php else: ?>
                                            <!-- Will be populated by JavaScript when user clicks "Add" -->
                                        <?php endif; ?>
                                    <?php else: ?>
                                        <?php
                                        $existing_req = !empty($existing_instances) ? $existing_instances[0] : null;
                                        $instance_id = '';
                                        $is_enabled = $existing_req !== null;
                                        $is_required = $existing_req ? $existing_req['required'] : true;
                                        $config = $existing_req ? $existing_req['config'] : array();
                                        ?>
                                        <div class="mcl-requirement-instance" data-instance-id="">
                                            <?php include 'partials/requirement-instance.php'; ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>



                <div class="mcl-form-actions">
                    <button type="submit" class="mcl-button mcl-button-primary mcl-submit-form-bottom">
                        <?php echo $checklist_id ? esc_html__('Update Publisher Checklist', 'magic-checklists') : esc_html__('Create Publisher Checklist', 'magic-checklists'); ?>
                    </button>
                </div>
            </div>
        </form>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mcl-publisher-form');
    
    let requirementDefinitions = <?php echo json_encode($default_requirements); ?>;
    
    // Handle post type changes to fetch meta fields
    document.querySelectorAll('input[name="post_types[]"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            fetchMetaFields();
        });
    });
    
    // Initial meta fields fetch
    fetchMetaFields();
    
    function fetchMetaFields() {
        const selectedPostTypes = Array.from(document.querySelectorAll('input[name="post_types[]"]:checked'))
            .map(input => input.value);
        
        if (selectedPostTypes.length === 0) {
            return;
        }
        
        const formData = new FormData();
        formData.append('action', 'mcl_get_meta_fields');
        formData.append('nonce', '<?php echo wp_create_nonce('mcl_admin_nonce'); ?>');
        
        // Send post types as individual form fields
        selectedPostTypes.forEach(postType => {
            formData.append('post_types[]', postType);
        });
        
        fetch('<?php echo admin_url('admin-ajax.php'); ?>', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                updateMetaFieldSelects(data.data);
            }
        })
        .catch(error => {
            console.error('Error fetching meta fields:', error);
        });
    }
    
    function updateMetaFieldSelects(options) {
        document.querySelectorAll('.mcl-meta-field-select').forEach(select => {
            const currentValue = select.value;
            select.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select a custom field --';
            select.appendChild(defaultOption);
            
            // Add field options
            Object.entries(options).forEach(([value, label]) => {
                if (value !== '') {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = label;
                    if (value === currentValue) {
                        option.selected = true;
                    }
                    select.appendChild(option);
                }
            });
        });
    }
    
    // Handle add instance buttons
    document.addEventListener('click', function(e) {
        if (e.target.closest('.mcl-add-instance-btn')) {
            e.preventDefault();
            const button = e.target.closest('.mcl-add-instance-btn');
            const reqType = button.dataset.type;
            const container = button.closest('.mcl-requirement-group').querySelector('.mcl-instances-container');
            
            addRequirementInstance(reqType, container);
        }
        
        if (e.target.closest('.mcl-remove-instance-btn')) {
            e.preventDefault();
            const button = e.target.closest('.mcl-remove-instance-btn');
            const instance = button.closest('.mcl-requirement-instance');
            instance.remove();
        }
    });
    
    function addRequirementInstance(reqType, container) {
        const instanceId = 'instance_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const reqDef = requirementDefinitions[reqType];
        
        const instanceDiv = document.createElement('div');
        instanceDiv.className = 'mcl-requirement-instance';
        instanceDiv.dataset.instanceId = instanceId;
        
        // Build the instance HTML
        let html = `<div class="mcl-requirement-item" data-type="${reqType}">
            <div class="mcl-requirement-header">
                <div class="mcl-requirement-toggle">
                    <input type="checkbox" 
                        id="requirement_${reqType}_${instanceId}" 
                        name="requirements[${reqType}][${instanceId}][enabled]" 
                        value="1" 
                        checked
                        class="mcl-requirement-checkbox">
                    <label for="requirement_${reqType}_${instanceId}" class="mcl-requirement-label">
                        ${reqDef.label}
                    </label>
                </div>
                
                <div class="mcl-requirement-actions">
                    <div class="mcl-requirement-required">
                        <label class="mcl-checkbox-label mcl-required-label">
                            <input type="checkbox" 
                                name="requirements[${reqType}][${instanceId}][required]" 
                                value="1" 
                                checked>
                            Required
                        </label>
                    </div>
                    
                    <button type="button" class="mcl-remove-instance-btn" data-instance-id="${instanceId}">
                        <span class="dashicons dashicons-trash"></span>
                    </button>
                </div>
            </div>
            
            <input type="hidden" name="requirements[${reqType}][${instanceId}][instance_id]" value="${instanceId}">
            
            <div class="mcl-requirement-config">`;
        
        if (reqDef.config_fields && Object.keys(reqDef.config_fields).length > 0) {
            html += '<div class="mcl-config-fields">';
            
            Object.entries(reqDef.config_fields).forEach(([fieldName, fieldDef]) => {
                html += `<div class="mcl-config-field">
                    <label class="mcl-config-label">${fieldDef.label}</label>`;
                
                if (fieldDef.type === 'number') {
                    html += `<input type="number" 
                        name="requirements[${reqType}][${instanceId}][config][${fieldName}]" 
                        value="${fieldDef.default || ''}"
                        min="${fieldDef.min || ''}"
                        max="${fieldDef.max || ''}"
                        class="mcl-input mcl-input-small">`;
                } else if (fieldDef.type === 'text') {
                    const extraClass = (reqType === 'custom_item' && fieldName === 'item_title') ? 'mcl-instance-title-field' : '';
                    html += `<input type="text" 
                        name="requirements[${reqType}][${instanceId}][config][${fieldName}]" 
                        value="${fieldDef.default || ''}"
                        placeholder="${fieldDef.placeholder || ''}"
                        class="mcl-input mcl-input-medium ${extraClass}">`;
                } else if (fieldDef.type === 'select') {
                    const extraClass = (reqType === 'custom_field' && fieldName === 'field_name') ? 'mcl-meta-field-select' : '';
                    html += `<select name="requirements[${reqType}][${instanceId}][config][${fieldName}]" 
                        class="mcl-input mcl-input-medium ${extraClass}"
                        data-post-types-target="${reqType === 'custom_field' ? 'true' : 'false'}">
                        <option value="">${fieldDef.placeholder || 'Select...'}</option>
                    </select>`;
                }
                
                html += '</div>';
            });
            
            html += '</div>';
        }
        
        html += `<div class="mcl-requirement-status">`;
        if (reqDef.auto_check) {
            html += `<span class="mcl-auto-check">
                <span class="dashicons dashicons-yes-alt"></span>
                Automatically verified
            </span>`;
        } else {
            html += `<span class="mcl-manual-check">
                <span class="dashicons dashicons-admin-users"></span>
                Manual verification required
            </span>`;
        }
        html += `</div></div></div>`;
        
        instanceDiv.innerHTML = html;
        container.appendChild(instanceDiv);
        
        // Update meta field selects for new custom field instances
        if (reqType === 'custom_field') {
            fetchMetaFields();
        }
        
        // Attach event listeners
        attachInstanceEventListeners(instanceDiv);
    }
    
    function attachInstanceEventListeners(instance) {
        // Handle requirement toggles
        const checkbox = instance.querySelector('.mcl-requirement-checkbox');
        if (checkbox) {
            checkbox.addEventListener('change', function() {
                const item = this.closest('.mcl-requirement-item');
                const configSection = item.querySelector('.mcl-requirement-config');
                const requiredSection = item.querySelector('.mcl-requirement-required');
                
                if (this.checked) {
                    configSection.style.display = 'block';
                    requiredSection.style.display = 'block';
                } else {
                    configSection.style.display = 'none';
                    requiredSection.style.display = 'none';
                }
            });
        }
        
        // Handle config changes
        instance.querySelectorAll('.mcl-config-field input, .mcl-config-field select').forEach(input => {
            input.addEventListener('input', function() {
                updateInstanceLabel(this);
            });
            input.addEventListener('change', function() {
                updateInstanceLabel(this);
            });
        });
    }
    
    function updateInstanceLabel(input) {
        const instance = input.closest('.mcl-requirement-instance');
        const label = instance.querySelector('.mcl-requirement-label');
        
        if (input.classList.contains('mcl-instance-title-field')) {
            // Update custom item label
            const title = input.value.trim();
            label.textContent = title || 'Custom Item';
        } else if (input.name.includes('[field_label]')) {
            // Update custom field label
            const fieldLabel = input.value.trim();
            const fieldName = instance.querySelector('select[name*="[field_name]"]')?.value;
            if (fieldLabel) {
                label.textContent = fieldLabel;
            } else if (fieldName) {
                label.textContent = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/[_-]/g, ' ');
            } else {
                label.textContent = 'Custom Field';
            }
        } else if (input.name.includes('[field_name]')) {
            // Update custom field label when field name changes
            const fieldName = input.value;
            const fieldLabelInput = instance.querySelector('input[name*="[field_label]"]');
            const fieldLabel = fieldLabelInput?.value.trim();
            
            if (fieldLabel) {
                label.textContent = fieldLabel;
            } else if (fieldName) {
                label.textContent = fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/[_-]/g, ' ');
            } else {
                label.textContent = 'Custom Field';
            }
        }
    }
    
    // Attach initial event listeners
    document.querySelectorAll('.mcl-requirement-instance').forEach(instance => {
        attachInstanceEventListeners(instance);
    });
    
    // Handle upper submit button click
    document.querySelector('.mcl-submit-form')?.addEventListener('click', function(e) {
        e.preventDefault();
        form.submit();
    });
    
    // Form validation
    form?.addEventListener('submit', function(e) {
        const title = document.getElementById('mcl_title').value.trim();
        const postTypes = document.querySelectorAll('input[name="post_types[]"]:checked');
        const requirements = document.querySelectorAll('.mcl-requirement-checkbox:checked');
        
        let errors = [];
        
        if (!title) {
            errors.push('<?php esc_html_e('Checklist name is required', 'magic-checklists'); ?>');
        }
        
        if (postTypes.length === 0) {
            errors.push('<?php esc_html_e('At least one post type must be selected', 'magic-checklists'); ?>');
        }
        
        if (requirements.length === 0) {
            errors.push('<?php esc_html_e('At least one requirement must be enabled', 'magic-checklists'); ?>');
        }
        
        if (errors.length > 0) {
            e.preventDefault();
            alert('<?php esc_html_e('Please fix the following errors:', 'magic-checklists'); ?>\n\n' + errors.join('\n'));
        }
    });
});
</script>

<style>
.mcl-publisher-content {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.mcl-requirements-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 25px;
}

/* Make cards stretch to equal height */
.mcl-requirement-group {
    display: flex;
    flex-direction: column;
}

.mcl-instances-container {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.mcl-requirement-instance {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.mcl-requirement-item {
    flex: 1;
    display: flex;
    flex-direction: column;
}

.mcl-requirement-config {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}

.mcl-section-title {
    margin: 0;
}

.mcl-section-description,
.mcl-description {
    font-size: 16px;
    color:rgb(215, 215, 215);
    margin: 0;
}

/* Requirement Groups for Repeatable Items */
.mcl-requirement-group {
    background: #fff;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    padding: 25px;
    margin-bottom: 0;
    transition: all 0.3s ease;
}

/* Make repeatable items span all 3 columns */
.mcl-requirement-group[data-repeatable="true"] {
    grid-column: 1 / -1;
}

/* Create 3-column grid for instances within repeatable items */
.mcl-requirement-group[data-repeatable="true"] .mcl-instances-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
}

.mcl-requirement-group:has(.mcl-requirement-checkbox:checked) {
    border-color: #f2da22;
    background: #fffef7;
}

.mcl-requirement-group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding-bottom: 15px;
    border-bottom: 1px solid #e2e8f0;
}

.mcl-requirement-group-title {
    font-size: 18px;
    font-weight: 600;
    color: #1a1a1a;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
}

.mcl-repeatable-badge {
    background: #e0e7ff;
    color: #3730a3;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
}

.mcl-add-instance-btn {
    background: #f2da22;
    color: #1a1a1a;
    border: none;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
}

.mcl-add-instance-btn:hover {
    background: #e6c61a;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mcl-requirement-group-description {
    color: #64748b;
    margin-bottom: 20px;
    font-size: 14px;
    line-height: 1.5;
}

.mcl-instances-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.mcl-requirement-instance {
    position: relative;
}

/* Updated Requirement Items */
.mcl-requirement-item {
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.2s ease;
    background: #fff;
    position: relative;
}

.mcl-requirement-item:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border-color: #d1d5db;
}

.mcl-requirement-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
}

.mcl-requirement-toggle {
    display: flex;
    align-items: center;
    flex: 1;
}

.mcl-requirement-checkbox {
    margin-right: 12px;
    transform: scale(1.2);
}

.mcl-requirement-label {
    font-weight: 600;
    font-size: 16px;
    color: #1a1a1a;
    cursor: pointer;
    flex: 1;
}

.mcl-requirement-actions {
    display: flex;
    align-items: center;
    gap: 15px;
}

.mcl-required-label {
    background: #f2da22;
    color: #1a1a1a;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mcl-required-label:hover {
    background: #e6c61a;
}

.mcl-remove-instance-btn {
    background: #ef4444;
    color: white;
    border: none;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.mcl-remove-instance-btn:hover {
    background: #dc2626;
    transform: scale(1.1);
}

.mcl-remove-instance-btn .dashicons {
    font-size: 16px;
    width: 16px;
    height: 16px;
}

.mcl-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-shrink: 0;
}

.mcl-title-wrapper {
    display: flex;
    flex-direction: row;
    gap: 20px;
}

.mcl-title-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

/* Configuration Fields */
.mcl-requirement-config {
    border-top: 1px solid #e2e8f0;
    padding-top: 15px;
    margin-top: 15px;
}

.mcl-config-fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    margin-bottom: 15px;
}

.mcl-config-field {
    display: flex;
    flex-direction: column;
}

.mcl-config-label {
    font-size: 14px;
    font-weight: 500;
    color: #374151;
    margin-bottom: 6px;
}

.mcl-input-small {
    width: 120px;
}

.mcl-input-medium {
    width: 100%;
}

.mcl-meta-field-select {
    min-width: 250px;
}

/* Requirement Status */
.mcl-requirement-status {
    margin-top: auto;
    padding-top: 15px;
    border-top: 1px solid #f1f5f9;
}

.mcl-auto-check {
    color: #22c55e;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.mcl-manual-check {
    color: #f59e0b;
    font-size: 14px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 6px;
}

.mcl-post-types {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
}

.mcl-form-actions {
    text-align: center;
    margin-top: 40px;
}

.mcl-submit-form-bottom {
    padding: 15px 40px;
    font-size: 16px;
    font-weight: 600;
}
</style> 