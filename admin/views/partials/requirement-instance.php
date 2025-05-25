<?php
// This file is included in the requirement loop
// Variables available: $req_type, $req_def, $instance_id, $is_enabled, $is_required, $config, $is_repeatable

$field_prefix = $is_repeatable ? "requirements[{$req_type}][{$instance_id}]" : "requirements[{$req_type}]";
$checkbox_id = $is_repeatable ? "requirement_{$req_type}_{$instance_id}" : "requirement_{$req_type}";
?>

<div class="mcl-requirement-item" data-type="<?php echo esc_attr($req_type); ?>">
    <div class="mcl-requirement-header">
        <div class="mcl-requirement-toggle">
            <label class="mcl-toggle-switch">
                <input type="checkbox" 
                    id="<?php echo esc_attr($checkbox_id); ?>" 
                    name="<?php echo esc_attr($field_prefix); ?>[enabled]" 
                    value="1" 
                    <?php checked($is_enabled); ?>
                    class="mcl-requirement-checkbox">
                <span class="mcl-toggle-slider"></span>
            </label>
            <label for="<?php echo esc_attr($checkbox_id); ?>" class="mcl-requirement-label">
                <?php if ($is_repeatable): ?>
                    <?php if ($req_type === 'custom_field'): ?>
                        <?php echo !empty($config['field_label']) ? esc_html($config['field_label']) : esc_html($req_def['label']); ?>
                    <?php elseif ($req_type === 'custom_item'): ?>
                        <?php echo !empty($config['item_title']) ? esc_html($config['item_title']) : esc_html($req_def['label']); ?>
                    <?php else: ?>
                        <?php echo esc_html($req_def['label']); ?>
                    <?php endif; ?>
                <?php else: ?>
                    <?php echo esc_html($req_def['label']); ?>
                <?php endif; ?>
            </label>
        </div>
        
        <div class="mcl-requirement-actions">
            <div class="mcl-requirement-required" style="<?php echo $is_enabled ? '' : 'display: none;'; ?>">
                <div class="mcl-required-toggle-wrapper">
                    <label class="mcl-toggle-switch mcl-toggle-switch-small">
                        <input type="checkbox" 
                            name="<?php echo esc_attr($field_prefix); ?>[required]" 
                            value="1" 
                            <?php checked($is_required); ?>>
                        <span class="mcl-toggle-slider"></span>
                    </label>
                    <span class="mcl-required-text"><?php esc_html_e('Required', 'magic-checklists'); ?></span>
                </div>
            </div>
            
            <?php if ($is_repeatable): ?>
                <button type="button" class="mcl-remove-instance-btn" data-instance-id="<?php echo esc_attr($instance_id); ?>">
                    <span class="dashicons dashicons-trash"></span>
                </button>
            <?php endif; ?>
        </div>
    </div>
    
    <?php if ($is_repeatable): ?>
        <input type="hidden" name="<?php echo esc_attr($field_prefix); ?>[instance_id]" value="<?php echo esc_attr($instance_id); ?>">
    <?php endif; ?>
    
    <div class="mcl-requirement-config" style="<?php echo $is_enabled ? '' : 'display: none;'; ?>">
        <?php if (!empty($req_def['config_fields'])): ?>
            <div class="mcl-config-fields">
                <?php foreach ($req_def['config_fields'] as $field_name => $field_def): ?>
                    <div class="mcl-config-field">
                        <label class="mcl-config-label">
                            <?php echo esc_html($field_def['label']); ?>
                        </label>
                        
                        <?php if ($field_def['type'] === 'number'): ?>
                            <input type="number" 
                                name="<?php echo esc_attr($field_prefix); ?>[config][<?php echo esc_attr($field_name); ?>]" 
                                value="<?php echo esc_attr($config[$field_name] ?? $field_def['default']); ?>"
                                min="<?php echo esc_attr($field_def['min']); ?>"
                                max="<?php echo esc_attr($field_def['max']); ?>"
                                class="mcl-input mcl-input-small">
                        
                        <?php elseif ($field_def['type'] === 'text'): ?>
                            <input type="text" 
                                name="<?php echo esc_attr($field_prefix); ?>[config][<?php echo esc_attr($field_name); ?>]" 
                                value="<?php echo esc_attr($config[$field_name] ?? $field_def['default']); ?>"
                                placeholder="<?php echo esc_attr($field_def['placeholder'] ?? ''); ?>"
                                class="mcl-input mcl-input-medium <?php echo $req_type === 'custom_item' && $field_name === 'item_title' ? 'mcl-instance-title-field' : ''; ?>">
                        
                        <?php elseif ($field_def['type'] === 'select'): ?>
                            <select name="<?php echo esc_attr($field_prefix); ?>[config][<?php echo esc_attr($field_name); ?>]" 
                                class="mcl-input mcl-input-medium <?php echo $req_type === 'custom_field' && $field_name === 'field_name' ? 'mcl-meta-field-select' : ''; ?>"
                                data-post-types-target="<?php echo $req_type === 'custom_field' ? 'true' : 'false'; ?>">
                                <option value=""><?php echo esc_html($field_def['placeholder'] ?? 'Select...'); ?></option>
                                <?php if ($req_type === 'custom_field' && $field_name === 'field_name'): ?>
                                    <!-- Options will be populated by JavaScript -->
                                    <?php if (!empty($config[$field_name])): ?>
                                        <option value="<?php echo esc_attr($config[$field_name]); ?>" selected>
                                            <?php echo esc_html($config[$field_name]); ?>
                                        </option>
                                    <?php endif; ?>
                                <?php endif; ?>
                            </select>
                        <?php endif; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        
        <div class="mcl-requirement-status">
            <?php if ($req_def['auto_check']): ?>
                <span class="mcl-auto-check">
                    <span class="dashicons dashicons-yes-alt"></span>
                    <?php esc_html_e('Automatically verified', 'magic-checklists'); ?>
                </span>
            <?php else: ?>
                <span class="mcl-manual-check">
                    <span class="dashicons dashicons-admin-users"></span>
                    <?php esc_html_e('Manual verification required', 'magic-checklists'); ?>
                </span>
            <?php endif; ?>
        </div>
    </div>
</div> 